import postgres from "postgres";
import { REPRESENTATION_SUBJECTION_WINDOW_YEARS } from "~/modules/domain";
import { TEST_GIP_WORKFORCE, TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

type Connection = ReturnType<typeof createConnection>;

// The fixture layer runs in the Playwright runner process, which cannot read the
// campaign-year override the app honours (that lives on the dev-server process,
// issue #4022). Year-scoped helpers therefore take the year explicitly and fall
// back to the database calendar year — the single EXTRACT(YEAR FROM CURRENT_DATE)
// of this module — so unpinned specs keep their pre-#4067 behaviour untouched.
async function effectiveYear(sql: Connection, year?: number): Promise<number> {
	if (year !== undefined) return year;
	const rows = await sql<[{ year: number }]>`
		SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS year
	`;
	return rows[0]?.year ?? 2026;
}

export async function ensureCurrentYearDeclaration(year?: number) {
	const sql = createConnection();
	try {
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const userId = users[0]?.user_id as string | undefined;
		if (!userId) return;
		const targetYear = await effectiveYear(sql, year);
		await sql`
			INSERT INTO app_declaration (
				id, siren, year, declarant_id, current_step, status,
				created_at, updated_at
			)
			VALUES (
				gen_random_uuid(),
				${TEST_SIREN},
				${targetYear},
				${userId},
				1,
				'draft',
				NOW(),
				NOW()
			)
			ON CONFLICT DO NOTHING
		`;
	} finally {
		await sql.end();
	}
}

export async function resetDeclarationToDraft() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_declaration_status_history
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;

		await sql`
			UPDATE app_declaration
			SET status = 'draft', current_step = 1,
			    first_declaration_path_choice = NULL,
			    second_declaration_path_choice = NULL,
			    total_women = NULL,
			    total_men = NULL,
			    hourly_women = NULL,
			    hourly_men = NULL,
			    draft = NULL,
			    draft_updated_at = NULL
			WHERE siren = ${TEST_SIREN}
		`;

		await sql`
			DELETE FROM app_employee_category
			WHERE declaration_type = 'correction'
			  AND job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = ${TEST_SIREN}
			  )
		`;

		// CSE opinion files + associations accumulate on the shared declaration
		// record (the suite uploads through the real UI now). Wipe them so each
		// test starts with no file and free upload slots. Deleting the files
		// cascades to app_cse_opinion_file, but we clear associations first to be
		// explicit and order-safe.
		await sql`
			DELETE FROM app_cse_opinion_file
			WHERE declaration_id IN (
			    SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;

		await sql`
			DELETE FROM app_file
			WHERE type = 'cse_opinion'
			  AND declaration_id IN (
			    SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Inserts (or refreshes) a app_campaign_deadline row for the given year (calendar
 * year by default) with all deadlines pushed far into the future. Prevents
 * date-sensitive business rules (e.g. `isDraftExpired` in
 * declarationDraftRouter.get) from breaking e2e tests when CI happens to run on
 * or after the default deadline of June 1.
 *
 * Deliberately leaves `campaign_start_date` NULL — do NOT "fix" this by seeding
 * it. `getActiveCampaignYear()` (`~/server/db/getGlobalSettings.ts`) only keeps
 * rows whose `campaign_start_date` is non-null and past, then takes their max; a
 * seeded date here would make every pinned year resolve to the latest one and
 * collapse the whole 7-year grid onto a single campaign. Left null, that query
 * falls back to `getCurrentYear()` — i.e. the piloted campaign year (#4022/#4067).
 */
export async function pushCampaignDeadlinesFarFuture(year?: number) {
	const sql = createConnection();
	try {
		const targetYear = await effectiveYear(sql, year);
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				decl1_modification_deadline,
				decl1_justification_deadline,
				decl1_joint_evaluation_deadline,
				decl2_modification_deadline,
				decl2_justification_deadline,
				decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			)
			SELECT
				${targetYear},
				'2099-12-31'::date,
				'2099-12-31'::date,
				'2099-12-31'::date,
				'2099-12-31'::date,
				'2099-12-31'::date,
				'2099-12-31'::date,
				'2099-12-31'::date
			ON CONFLICT (year) DO UPDATE SET
				decl1_modification_deadline = '2099-12-31'::date,
				decl1_justification_deadline = '2099-12-31'::date,
				decl1_joint_evaluation_deadline = '2099-12-31'::date,
				decl2_modification_deadline = '2099-12-31'::date,
				decl2_justification_deadline = '2099-12-31'::date,
				decl2_joint_evaluation_deadline = '2099-12-31'::date,
				decl2_cse_opinion_deadline = '2099-12-31'::date
		`;
	} finally {
		await sql.end();
	}
}

export async function setCompanyHasCse(hasCse: boolean | null) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_company SET has_cse = ${hasCse} WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Set the GIP-MDS annual average workforce of the test company for the current year.
 *
 * This is the single source of truth for every size-based rule (banner display, CSE
 * field, indicator G / step 5 gating, SUIT export). Passing `null` deletes the row,
 * which models a company absent from the GIP file — treated as "< 50", not subject.
 */
export async function setGipWorkforce(
	workforceEma: number | null,
	year?: number,
) {
	const sql = createConnection();
	try {
		const targetYear = await effectiveYear(sql, year);
		if (workforceEma === null) {
			await sql`
				DELETE FROM app_gip_mds_data
				WHERE siren = ${TEST_SIREN}
				  AND year = ${targetYear}
			`;
			return;
		}
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema, imported_at)
			VALUES (
				${TEST_SIREN},
				${targetYear},
				${workforceEma},
				NOW()
			)
			ON CONFLICT (siren, year) DO UPDATE SET workforce_ema = EXCLUDED.workforce_ema
		`;
	} finally {
		await sql.end();
	}
}

/** Restore the suite baseline: the test company is a >= 250 GIP company. */
export async function resetGipWorkforce() {
	await setGipWorkforce(TEST_GIP_WORKFORCE);
}

export async function setCompanyWorkforce(workforce: number | null) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_company SET workforce = ${workforce} WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Persist a step-1 workforce on the shared declaration. The funnel reads these
 * columns to decide whether a step already holds data, so this reaches the
 * "saved" rendering without replaying the form and waiting on its autosave.
 */
export async function setWorkforceCounts(women: number, men: number) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_declaration
			SET total_women = ${women}, total_men = ${men},
			    hourly_women = ${women}, hourly_men = ${men}
			WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

export async function setDeclarationComplianceState(state: {
	status?: string;
	currentStep?: number;
	firstDeclarationPathChoice?: string | null;
	secondDeclarationPathChoice?: string | null;
	secondDeclarationSubmittedAt?: Date | null;
	demarcheCompletedAt?: Date | null;
	cseOpinionCompletedAt?: Date | null;
	cseRequired?: boolean;
}) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_declaration
			SET status = ${state.status ?? "awaiting_compliance_path_choice"},
			    current_step = ${state.currentStep ?? 6},
			    first_declaration_path_choice = ${state.firstDeclarationPathChoice ?? null},
			    second_declaration_path_choice = ${state.secondDeclarationPathChoice ?? null}
			WHERE siren = ${TEST_SIREN}
		`;

		// The panel's closed-vs-cse decision reads the frozen `cse_required` snapshot,
		// so tests that model completion must pin it explicitly (it is otherwise left
		// over from whichever submit flow last ran on the shared declaration record).
		if (state.cseRequired !== undefined) {
			await sql`
				UPDATE app_declaration SET cse_required = ${state.cseRequired}
				WHERE siren = ${TEST_SIREN}
			`;
		}

		const decl = await sql`
			SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const declarationId = decl[0]?.id;
		if (!declarationId) return;

		await sql`
			DELETE FROM app_declaration_status_history
			WHERE declaration_id = ${declarationId}
		`;

		if (state.secondDeclarationSubmittedAt) {
			await sql`
				INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, round, created_at)
				VALUES (gen_random_uuid(), ${declarationId}, 'second_declaration_submit', 2, ${state.secondDeclarationSubmittedAt})
			`;
		}
		if (state.cseOpinionCompletedAt) {
			await sql`
				INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, created_at)
				VALUES (gen_random_uuid(), ${declarationId}, 'cse_opinion_submit', ${state.cseOpinionCompletedAt})
			`;
		}
		if (state.demarcheCompletedAt) {
			await sql`
				INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, created_at)
				VALUES (gen_random_uuid(), ${declarationId}, 'demarche_complete', ${state.demarcheCompletedAt})
			`;
		}
	} finally {
		await sql.end();
	}
}

export async function insertJointEvaluationFile(year: number) {
	const sql = createConnection();
	try {
		const decl = await sql`
			SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year} LIMIT 1
		`;
		if (decl.length === 0) return;
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, created_at, type)
			VALUES (gen_random_uuid(), ${decl[0]?.id}, 'dummy.pdf', '/tmp/dummy.pdf', NOW(), NOW(), 'joint_evaluation')
			ON CONFLICT DO NOTHING
		`;
	} finally {
		await sql.end();
	}
}

export async function getLatestJointEvaluationFileIdForTestSiren(): Promise<
	string | null
> {
	const sql = createConnection();
	try {
		const rows = await sql`
			SELECT f.id
			FROM app_file f
			INNER JOIN app_declaration d ON f.declaration_id = d.id
			WHERE d.siren = ${TEST_SIREN}
			  AND f.type = 'joint_evaluation'
			ORDER BY f.uploaded_at DESC
			LIMIT 1
		`;
		return (rows[0]?.id as string | undefined) ?? null;
	} finally {
		await sql.end();
	}
}

export async function deleteJointEvaluationFiles() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_file
			WHERE type = 'joint_evaluation'
			AND declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;
	} finally {
		await sql.end();
	}
}

export async function insertCseOpinion(year: number) {
	const sql = createConnection();
	try {
		const decl = await sql`
			SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year} LIMIT 1
		`;
		if (decl.length === 0) return;
		await sql`
			INSERT INTO app_cse_opinion (id, declaration_id, declaration_number, type, created_at, updated_at)
			VALUES (gen_random_uuid(), ${decl[0]?.id}, 1, 'remuneration', NOW(), NOW())
			ON CONFLICT DO NOTHING
		`;
	} finally {
		await sql.end();
	}
}

export async function deleteCseOpinions() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_cse_opinion
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Drop the autosaved draft without touching the declaration's status or step, so
 * a test can assert what the persisted rows alone render.
 */
export async function clearDeclarationDraft() {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_declaration
			SET draft = NULL, draft_updated_at = NULL
			WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Blank the per-category hourly headcounts, reproducing a category saved before
 * #4254 added the two columns: they are nullable and were never backfilled, so
 * this is the exact shape every pre-existing row still has in production.
 */
export async function clearCategoryHourlyCounts(year?: number) {
	const sql = createConnection();
	try {
		const targetYear = await effectiveYear(sql, year);
		await sql`
			UPDATE app_employee_category
			SET hourly_women_count = NULL, hourly_men_count = NULL
			WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				INNER JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${TEST_SIREN}
				  AND d.year = ${targetYear}
			)
		`;
	} finally {
		await sql.end();
	}
}

export async function deleteCurrentYearCategories(year?: number) {
	const sql = createConnection();
	try {
		const targetYear = await effectiveYear(sql, year);
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				INNER JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${TEST_SIREN}
				  AND d.year = ${targetYear}
			)
		`;
		await sql`
			DELETE FROM app_job_category
			WHERE declaration_id IN (
				SELECT id FROM app_declaration
				WHERE siren = ${TEST_SIREN}
				  AND year = ${targetYear}
			)
		`;
	} finally {
		await sql.end();
	}
}

export async function getCurrentDbYear(): Promise<number> {
	const sql = createConnection();
	try {
		return await effectiveYear(sql);
	} finally {
		await sql.end();
	}
}

export async function cleanCurrentYearDeclarations(year?: number) {
	const sql = createConnection();
	try {
		const targetYear = await effectiveYear(sql, year);
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				INNER JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${TEST_SIREN} AND d.year = ${targetYear}
			)
		`;
		await sql`
			DELETE FROM app_job_category
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${targetYear}
			)
		`;
		await sql`
			DELETE FROM app_cse_opinion
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${targetYear}
			)
		`;
		await sql`
			DELETE FROM app_file
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${targetYear}
			)
		`;
		await sql`DELETE FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${targetYear}`;
	} finally {
		await sql.end();
	}
}

export async function countPathChoiceEventsRound1(): Promise<number> {
	const sql = createConnection();
	try {
		const rows = await sql<[{ n: number }]>`
			SELECT COUNT(*)::int AS n
			FROM app_declaration_status_history h
			INNER JOIN app_declaration d ON d.id = h.declaration_id
			WHERE d.siren = ${TEST_SIREN}
			  AND h.event_type = 'path_choice'
			  AND h.round = 1
		`;
		return rows[0]?.n ?? 0;
	} finally {
		await sql.end();
	}
}

export async function lastPathChoiceValueRound1(): Promise<string | null> {
	const sql = createConnection();
	try {
		const rows = await sql<[{ value: string | null }]>`
			SELECT h.value
			FROM app_declaration_status_history h
			INNER JOIN app_declaration d ON d.id = h.declaration_id
			WHERE d.siren = ${TEST_SIREN}
			  AND h.event_type = 'path_choice'
			  AND h.round = 1
			ORDER BY h.created_at DESC
			LIMIT 1
		`;
		return rows[0]?.value ?? null;
	} finally {
		await sql.end();
	}
}

export async function setUserPhone(phone: string | null) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_user SET phone = ${phone}
			WHERE id IN (
				SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN}
			)
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Purge every balanced-representation declaration of the test company (#3702).
 *
 * Year-agnostic on purpose: the funnel stores the *reference* year while the UI
 * and the panel reason in campaign years, so a year-scoped delete would silently
 * leave a row behind whenever a spec and a helper disagree by one.
 */
export async function resetRepresentationDeclaration() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_representation_declaration WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Seed the GIP workforce of the {@link REPRESENTATION_SUBJECTION_WINDOW_YEARS}
 * consecutive exercises the représentation pre-filter reads (#3898), ending on
 * `campaignYear`. Returns the seeded years so a spec can clear the ones that are
 * not part of the suite baseline.
 */
export async function setRepresentationWorkforceWindow(
	campaignYear: number,
	workforceEma: number,
): Promise<number[]> {
	const years = Array.from(
		{ length: REPRESENTATION_SUBJECTION_WINDOW_YEARS },
		(_, offset) => campaignYear - offset,
	);
	for (const year of years) {
		await setGipWorkforce(workforceEma, year);
	}
	return years;
}

export type CompanyLocation = {
	address: string | null;
	countryCode: string | null;
	countryLabel: string | null;
};

/**
 * Read the three columns that drive the location row of the Mon espace banner.
 *
 * They are populated from the company registry at sign-in, so their value differs
 * between a local worktree (registry unreachable — everything null) and CI. A spec
 * that asserts on that row must capture the baseline and restore it, rather than
 * assume one.
 */
export async function getCompanyLocation(): Promise<CompanyLocation> {
	const sql = createConnection();
	try {
		const rows = await sql`
			SELECT address, country_code, country_label
			FROM app_company
			WHERE siren = ${TEST_SIREN}
		`;
		return {
			address: (rows[0]?.address as string | null) ?? null,
			countryCode: (rows[0]?.country_code as string | null) ?? null,
			countryLabel: (rows[0]?.country_label as string | null) ?? null,
		};
	} finally {
		await sql.end();
	}
}

export async function setCompanyLocation(location: CompanyLocation) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_company
			SET address = ${location.address},
			    country_code = ${location.countryCode},
			    country_label = ${location.countryLabel}
			WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}
