import postgres from "postgres";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";
const TEST_SIREN = "130025265";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

/**
 * Ensure a draft declaration row exists for the test SIREN and the current
 * year. Used by tests that can't rely on `getOrCreate` to lazily insert
 * the row — e.g. the admin-impersonation scenario, where the insert branch
 * is blocked server-side.
 */
export async function ensureCurrentYearDeclaration() {
	const sql = createConnection();
	try {
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const userId = users[0]?.user_id as string | undefined;
		if (!userId) return;
		await sql`
			INSERT INTO app_declaration (
				id, siren, year, declarant_id, current_step, status,
				created_at, updated_at
			)
			VALUES (
				gen_random_uuid(),
				${TEST_SIREN},
				EXTRACT(YEAR FROM CURRENT_DATE)::int,
				${userId},
				1,
				'draft',
				NOW(),
				NOW()
			)
			ON CONFLICT ON CONSTRAINT declaration_siren_year_idx DO NOTHING
		`;
	} finally {
		await sql.end();
	}
}

/**
 * Reset the test declaration to draft and clean all associated data
 * so a new full flow can be tested from scratch.
 */
export async function resetDeclarationToDraft() {
	const sql = createConnection();
	try {
		// Reset declaration status
		await sql`
			UPDATE app_declaration
			SET status = 'draft', current_step = 1,
			    compliance_path = NULL, second_declaration_status = NULL,
			    compliance_completed_at = NULL
			WHERE siren = ${TEST_SIREN}
		`;

		// Clean correction employee categories to avoid stale second-declaration data
		await sql`
			DELETE FROM app_employee_category
			WHERE declaration_type = 'correction'
			  AND job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = ${TEST_SIREN}
			  )
		`;
	} finally {
		await sql.end();
	}
}

/** Toggle the hasCse flag on the test company. */
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

/** Set the compliance state on the test declaration. */
export async function setDeclarationComplianceState(state: {
	status?: string;
	currentStep?: number;
	compliancePath?: string | null;
	secondDeclarationStatus?: string | null;
	complianceCompletedAt?: Date | null;
	cseOpinionCompletedAt?: Date | null;
}) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_declaration
			SET status = ${state.status ?? "submitted"},
			    current_step = ${state.currentStep ?? 6},
			    compliance_path = ${state.compliancePath ?? null},
			    second_declaration_status = ${state.secondDeclarationStatus ?? null},
			    compliance_completed_at = ${state.complianceCompletedAt ?? null},
			    cse_opinion_completed_at = ${state.cseOpinionCompletedAt ?? null}
			WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}

/** Insert a dummy joint evaluation file for the test declaration. */
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

/**
 * Return the id of the most-recent joint_evaluation file for the test SIREN.
 * Used by E2E tests that need the fileId of a just-uploaded real file to
 * exercise the download endpoint.
 */
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

/** Remove dummy joint evaluation files for the test declaration. */
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

/** Insert a dummy CSE opinion for the test declaration. */
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

/** Remove dummy CSE opinions for the test declaration. */
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

const PREV_YEAR_DECL_ID_PREFIX = "e2e-prev-year-decl-";
const PREV_YEAR_DECL_ID_SUFFIX = "-000000000000";
const PREV_YEAR_JOB_CATEGORY_IDS = [
	"e2e-jobcat-1111-0000-000000000000",
	"e2e-jobcat-2222-0000-000000000000",
	"e2e-jobcat-3333-0000-000000000000",
] as const;

function previousYearDeclId(yearsBack: number) {
	return `${PREV_YEAR_DECL_ID_PREFIX}${String(yearsBack).padStart(4, "0")}${PREV_YEAR_DECL_ID_SUFFIX}`;
}

/**
 * Insert a submitted declaration `yearsBack` years before the current year with
 * job categories (indicator 7). Default `yearsBack = 1` matches the original
 * N-1 seed so existing callers are unaffected.
 */
export async function insertPreviousYearDeclaration(yearsBack = 1) {
	const sql = createConnection();
	const yearResult = await sql`
		SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int - ${yearsBack} AS target_year
	`;
	const targetYear = yearResult[0]?.target_year as number;
	const declId = previousYearDeclId(yearsBack);

	try {
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const userId = users[0]?.user_id;
		if (!userId) return;

		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, total_women, total_men, current_step, status, created_at, updated_at)
			VALUES (${declId}, ${TEST_SIREN}, ${targetYear}, ${userId}, 150, 200, 6, 'submitted', NOW(), NOW())
			ON CONFLICT DO NOTHING
		`;

		const categories = [
			{
				id: PREV_YEAR_JOB_CATEGORY_IDS[0],
				index: 0,
				name: "Cadres dirigeants",
				detail: "Directeurs et cadres supérieurs",
			},
			{
				id: PREV_YEAR_JOB_CATEGORY_IDS[1],
				index: 1,
				name: "Ingénieurs et cadres",
				detail: "Ingénieurs, chefs de projet, managers",
			},
			{
				id: PREV_YEAR_JOB_CATEGORY_IDS[2],
				index: 2,
				name: "Techniciens",
				detail: "Techniciens qualifiés",
			},
		];

		for (const cat of categories) {
			await sql`
				INSERT INTO app_job_category (id, declaration_id, category_index, name, detail, source)
				VALUES (${cat.id}, ${declId}, ${cat.index}, ${cat.name}, ${cat.detail}, 'convention-collective')
				ON CONFLICT DO NOTHING
			`;
		}
	} finally {
		await sql.end();
	}
}

/** Remove the seeded previous-year declaration at `yearsBack` and its job categories. */
export async function deletePreviousYearDeclaration(yearsBack = 1) {
	const sql = createConnection();
	const declId = previousYearDeclId(yearsBack);

	try {
		await sql`DELETE FROM app_employee_category WHERE job_category_id = ANY(${PREV_YEAR_JOB_CATEGORY_IDS})`;
		await sql`DELETE FROM app_job_category WHERE declaration_id = ${declId}`;
		await sql`DELETE FROM app_declaration WHERE id = ${declId}`;
	} finally {
		await sql.end();
	}
}

/** Delete all job categories and employee categories for the test SIREN's current year declaration. */
export async function deleteCurrentYearCategories() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				INNER JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${TEST_SIREN}
				  AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)::int
			)
		`;
		await sql`
			DELETE FROM app_job_category
			WHERE declaration_id IN (
				SELECT id FROM app_declaration
				WHERE siren = ${TEST_SIREN}
				  AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int
			)
		`;
	} finally {
		await sql.end();
	}
}

type CampaignDeadlineDates = {
	decl1ModificationDeadline: string;
	decl1JustificationDeadline: string;
	decl1JointEvaluationDeadline: string;
	decl2ModificationDeadline: string;
	decl2JustificationDeadline: string;
	decl2JointEvaluationDeadline: string;
};

/** Upsert campaign deadlines for a given year (YYYY-MM-DD strings). */
export async function setCampaignDeadlines(
	year: number,
	dates: CampaignDeadlineDates,
) {
	const sql = createConnection();
	try {
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				decl1_modification_deadline,
				decl1_justification_deadline,
				decl1_joint_evaluation_deadline,
				decl2_modification_deadline,
				decl2_justification_deadline,
				decl2_joint_evaluation_deadline
			) VALUES (
				${year},
				${dates.decl1ModificationDeadline},
				${dates.decl1JustificationDeadline},
				${dates.decl1JointEvaluationDeadline},
				${dates.decl2ModificationDeadline},
				${dates.decl2JustificationDeadline},
				${dates.decl2JointEvaluationDeadline}
			)
			ON CONFLICT (year) DO UPDATE SET
				decl1_modification_deadline = EXCLUDED.decl1_modification_deadline,
				decl1_justification_deadline = EXCLUDED.decl1_justification_deadline,
				decl1_joint_evaluation_deadline = EXCLUDED.decl1_joint_evaluation_deadline,
				decl2_modification_deadline = EXCLUDED.decl2_modification_deadline,
				decl2_justification_deadline = EXCLUDED.decl2_justification_deadline,
				decl2_joint_evaluation_deadline = EXCLUDED.decl2_joint_evaluation_deadline
		`;
	} finally {
		await sql.end();
	}
}

/** Delete campaign deadlines for a given year (revert to defaults). */
export async function deleteCampaignDeadlines(year: number) {
	const sql = createConnection();
	try {
		await sql`DELETE FROM app_campaign_deadline WHERE year = ${year}`;
	} finally {
		await sql.end();
	}
}

type ReferentSeed = {
	id: string;
	region: string;
	county: string | null;
	name: string;
	type: "email" | "url";
	value: string;
	principal: boolean;
	substituteName: string | null;
	substituteEmail: string | null;
};

/** Insert or update a list of referents (used by public referents E2E tests). */
export async function seedReferents(rows: ReferentSeed[]) {
	const sql = createConnection();
	try {
		for (const r of rows) {
			await sql`
				INSERT INTO app_referent (
					id, region, county, name, type, value, principal,
					substitute_name, substitute_email, created_at, updated_at
				) VALUES (
					${r.id}, ${r.region}, ${r.county}, ${r.name}, ${r.type},
					${r.value}, ${r.principal},
					${r.substituteName}, ${r.substituteEmail}, NOW(), NOW()
				)
				ON CONFLICT (id) DO UPDATE SET
					region = EXCLUDED.region,
					county = EXCLUDED.county,
					name = EXCLUDED.name,
					type = EXCLUDED.type,
					value = EXCLUDED.value,
					principal = EXCLUDED.principal,
					substitute_name = EXCLUDED.substitute_name,
					substitute_email = EXCLUDED.substitute_email
			`;
		}
	} finally {
		await sql.end();
	}
}

/** Remove referents by id (used by public referents E2E tests). */
export async function deleteReferents(ids: string[]) {
	if (ids.length === 0) return;
	const sql = createConnection();
	try {
		await sql`DELETE FROM app_referent WHERE id = ANY(${ids})`;
	} finally {
		await sql.end();
	}
}

type SeededCampaignDeclaration = {
	/** Unique 9-digit SIREN. Must not collide with existing data. */
	siren: string;
	year: number;
	/** Campaign-day the declaration was submitted (ISO string). */
	submittedAt: string;
	/** Workforce stored on the synthetic company. */
	workforce: number;
	/**
	 * Denormalized alert-gap flag used by the K8 conformity KPI. Optional so
	 * the K2 campaign-progression seeds keep working without caring about it.
	 */
	hasAlertGap?: boolean;
	/**
	 * NAF code (full form, e.g. `"62.01Z"`). Optional for the same reason —
	 * K8 tests set it to exercise the sector filter, K2 tests leave it null.
	 */
	nafCode?: string | null;
	/**
	 * Denormalized average gap (%) used by the K10 multi-year trend chart.
	 * Optional — null means "no exploitable salary pair", which the chart
	 * filters out.
	 */
	averageGap?: number | null;
};

/**
 * Insert synthetic submitted declarations for the campaign progression E2E
 * tests (K2). Each entry creates a company row if needed and a matching
 * declaration with the specified `submitted_at`. Uses the real E2E declarant
 * attached to TEST_SIREN to satisfy the FK on `declarant_id`.
 */
export async function seedSubmittedDeclarationsForStats(
	rows: SeededCampaignDeclaration[],
) {
	if (rows.length === 0) return;
	const sql = createConnection();
	try {
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const declarantId = users[0]?.user_id as string | undefined;
		if (!declarantId) {
			throw new Error(
				"seedSubmittedDeclarationsForStats: no declarant found for TEST_SIREN",
			);
		}
		for (const row of rows) {
			const nafCode = row.nafCode ?? null;
			const hasAlertGap = row.hasAlertGap ?? false;
			const averageGap =
				row.averageGap === undefined || row.averageGap === null
					? null
					: row.averageGap.toString();
			await sql`
				INSERT INTO app_company (siren, name, workforce, naf_code, created_at, updated_at)
				VALUES (${row.siren}, ${`E2E Stats Co. ${row.siren}`}, ${row.workforce}, ${nafCode}, NOW(), NOW())
				ON CONFLICT (siren) DO UPDATE SET
					workforce = EXCLUDED.workforce,
					naf_code = EXCLUDED.naf_code
			`;
			await sql`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, current_step, status,
					submitted_at, has_alert_gap, average_gap, created_at, updated_at
				)
				VALUES (
					gen_random_uuid(), ${row.siren}, ${row.year}, ${declarantId}, 6,
					'submitted', ${row.submittedAt}, ${hasAlertGap}, ${averageGap},
					NOW(), NOW()
				)
				ON CONFLICT ON CONSTRAINT declaration_siren_year_idx DO UPDATE SET
					status = 'submitted',
					submitted_at = EXCLUDED.submitted_at,
					has_alert_gap = EXCLUDED.has_alert_gap,
					average_gap = EXCLUDED.average_gap
			`;
		}
	} finally {
		await sql.end();
	}
}

/** Remove the synthetic company+declaration rows seeded for the stats E2E. */
export async function deleteSeededCampaignDeclarations(sirens: string[]) {
	if (sirens.length === 0) return;
	const sql = createConnection();
	try {
		await sql`DELETE FROM app_declaration WHERE siren = ANY(${sirens})`;
		await sql`DELETE FROM app_company WHERE siren = ANY(${sirens})`;
	} finally {
		await sql.end();
	}
}

/** Clear or set the phone number for the test user (identified via user_company link to TEST_SIREN). */
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
