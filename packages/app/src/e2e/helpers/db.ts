import postgres from "postgres";
import { TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

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
	} finally {
		await sql.end();
	}
}

/**
 * Inserts (or refreshes) a app_campaign_deadline row for the current year with all
 * deadlines pushed far into the future. Prevents date-sensitive business rules
 * (e.g. `isDraftExpired` in declarationDraftRouter.get) from breaking e2e tests
 * when CI happens to run on or after the default deadline of June 1.
 */
export async function pushCampaignDeadlinesFarFuture() {
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
			)
			SELECT
				EXTRACT(YEAR FROM CURRENT_DATE)::int,
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
				decl2_joint_evaluation_deadline = '2099-12-31'::date
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

export async function setDeclarationComplianceState(state: {
	status?: string;
	currentStep?: number;
	firstDeclarationPathChoice?: string | null;
	secondDeclarationPathChoice?: string | null;
	secondDeclarationSubmittedAt?: Date | null;
	demarcheCompletedAt?: Date | null;
	cseOpinionCompletedAt?: Date | null;
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

export async function getCurrentDbYear(): Promise<number> {
	const sql = createConnection();
	try {
		const rows = await sql<[{ year: number }]>`
			SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS year
		`;
		return rows[0]?.year ?? 2026;
	} finally {
		await sql.end();
	}
}

export async function cleanCurrentYearDeclarations() {
	const sql = createConnection();
	try {
		const rows = await sql<[{ year: number }]>`
			SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS year
		`;
		const year = rows[0]?.year;
		if (!year) return;
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				INNER JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}
			)
		`;
		await sql`
			DELETE FROM app_job_category
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
			)
		`;
		await sql`
			DELETE FROM app_cse_opinion
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
			)
		`;
		await sql`
			DELETE FROM app_file
			WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
			)
		`;
		await sql`DELETE FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}`;
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

export async function setCseFileAssociationsForCurrentDeclaration(
	associations: { declarationNumber: number; type: string }[],
) {
	const sql = createConnection();
	try {
		const decls = await sql<[{ id: string }]>`
			SELECT id FROM app_declaration
			WHERE siren = ${TEST_SIREN}
			  AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int
			LIMIT 1
		`;
		const declarationId = decls[0]?.id;
		if (!declarationId) return;

		const fileRows = await sql<[{ id: string }]>`
			SELECT id FROM app_file
			WHERE declaration_id = ${declarationId}
			  AND type = 'cse_opinion'
			ORDER BY uploaded_at DESC
			LIMIT 1
		`;
		const fileId = fileRows[0]?.id;
		if (!fileId) return;

		await sql`
			DELETE FROM app_cse_opinion_file
			WHERE declaration_id = ${declarationId}
		`;

		for (const assoc of associations) {
			await sql`
				INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id, created_at, updated_at)
				VALUES (gen_random_uuid(), ${declarationId}, ${assoc.declarationNumber}, ${assoc.type}, ${fileId}, NOW(), NOW())
			`;
		}
	} finally {
		await sql.end();
	}
}

export async function insertCseOpinionFileWithAssociations(
	associations: { declarationNumber: number; type: string }[],
) {
	const sql = createConnection();
	try {
		const decls = await sql<[{ id: string }]>`
			SELECT id FROM app_declaration
			WHERE siren = ${TEST_SIREN}
			  AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int
			LIMIT 1
		`;
		const declarationId = decls[0]?.id;
		if (!declarationId) return;

		const fileRows = await sql<[{ id: string }]>`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, created_at, type)
			VALUES (gen_random_uuid(), ${declarationId}, 'test-cse.pdf', '/tmp/test-cse.pdf', NOW(), NOW(), 'cse_opinion')
			RETURNING id
		`;
		const fileId = fileRows[0]?.id;
		if (!fileId) return;

		await sql`DELETE FROM app_cse_opinion_file WHERE declaration_id = ${declarationId}`;

		for (const assoc of associations) {
			await sql`
				INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id, created_at, updated_at)
				VALUES (gen_random_uuid(), ${declarationId}, ${assoc.declarationNumber}, ${assoc.type}, ${fileId}, NOW(), NOW())
			`;
		}
	} finally {
		await sql.end();
	}
}
