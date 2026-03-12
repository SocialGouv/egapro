import postgres from "postgres";

const DEFAULT_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

/** Reset DB state before E2E tests so runs are idempotent. */
export default async function globalSetup() {
	const url = process.env.DATABASE_URL ?? DEFAULT_URL;
	const sql = postgres(url, { max: 1 });
	try {
		await sql`
			UPDATE app_declaration
			SET status = 'draft', current_step = 1,
			    compliance_path = NULL, second_declaration_status = NULL,
			    compliance_completed_at = NULL
			WHERE siren = '130025265'
		`;
		// has_cse=true ensures step 6 submit redirects to /avis-cse in declaration tests
		await sql`UPDATE app_company SET has_cse = true WHERE siren = '130025265'`;
		// Reset initial employee categories to no-gap values so declaration submit doesn't trigger compliance flow
		await sql`
			UPDATE app_employee_category
			SET annual_base_men = 1020, updated_at = NOW()
			WHERE declaration_type = 'initial'
			  AND job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = '130025265'
			  )
		`;
		await sql`
			DELETE FROM app_employee_category
			WHERE declaration_type = 'correction'
			  AND job_category_id IN (
			    SELECT jc.id FROM app_job_category jc
			    INNER JOIN app_declaration d ON d.id = jc.declaration_id
			    WHERE d.siren = '130025265'
			  )
		`;
	} finally {
		await sql.end();
	}
}
