import postgres from "postgres";

const DEFAULT_URL = "postgresql://postgres:postgres@localhost:5438/egapro";
const TEST_SIREN = "130025265";

/** Reset declaration to draft so tests are resilient to compliance test interleaving. */
export async function resetDeclarationToDraft() {
	const url = process.env.DATABASE_URL ?? DEFAULT_URL;
	const sql = postgres(url, { max: 1 });
	try {
		await sql`
			UPDATE app_declaration
			SET status = 'draft', current_step = 1,
			    compliance_path = NULL, second_declaration_status = NULL,
			    compliance_completed_at = NULL
			WHERE siren = ${TEST_SIREN}
		`;
		await sql`UPDATE app_company SET has_cse = true WHERE siren = ${TEST_SIREN}`;
		await sql`
			UPDATE app_employee_category
			SET annual_base_men = 1020, updated_at = NOW()
			WHERE declaration_type = 'initial'
			  AND job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = ${TEST_SIREN}
			  )
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
