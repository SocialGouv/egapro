import postgres from "postgres";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";
const TEST_SIREN = "130025265";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
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

		// Clean employee categories (both initial and correction) to avoid stale data
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = ${TEST_SIREN}
			)
		`;

		// Clean job categories so step 5 starts fresh
		await sql`
			DELETE FROM app_job_category
			WHERE declaration_id IN (
			    SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN}
			)
		`;
	} finally {
		await sql.end();
	}
}

/** Toggle the hasCse flag on the test company. */
export async function setCompanyHasCse(hasCse: boolean) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_company SET has_cse = ${hasCse} WHERE siren = ${TEST_SIREN}
		`;
	} finally {
		await sql.end();
	}
}
