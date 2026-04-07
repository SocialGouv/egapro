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
}) {
	const sql = createConnection();
	try {
		await sql`
			UPDATE app_declaration
			SET status = ${state.status ?? "submitted"},
			    current_step = ${state.currentStep ?? 6},
			    compliance_path = ${state.compliancePath ?? null},
			    second_declaration_status = ${state.secondDeclarationStatus ?? null},
			    compliance_completed_at = ${state.complianceCompletedAt ?? null}
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
			INSERT INTO app_joint_evaluation_file (id, declaration_id, file_name, file_path, uploaded_at, created_at)
			VALUES (gen_random_uuid(), ${decl[0]?.id}, 'dummy.pdf', '/tmp/dummy.pdf', NOW(), NOW())
			ON CONFLICT DO NOTHING
		`;
	} finally {
		await sql.end();
	}
}

/** Remove dummy joint evaluation files for the test declaration. */
export async function deleteJointEvaluationFiles() {
	const sql = createConnection();
	try {
		await sql`
			DELETE FROM app_joint_evaluation_file
			WHERE declaration_id IN (
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

/**
 * Insert a submitted declaration for the previous year (N-1) with job categories,
 * so the "Reprendre les catégories de l'année précédente" button appears.
 */
export async function insertPreviousYearDeclaration() {
	const sql = createConnection();
	const yearResult =
		await sql`SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int - 1 AS previous_year`;
	const previousYear = yearResult[0]?.previous_year as number;
	const declId = "e2e-prev-year-decl-0000-000000000000";

	try {
		// Get test user id
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const userId = users[0]?.user_id;
		if (!userId) return;

		// Insert submitted declaration for previous year
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, total_women, total_men, current_step, status, created_at, updated_at)
			VALUES (${declId}, ${TEST_SIREN}, ${previousYear}, ${userId}, 150, 200, 6, 'submitted', NOW(), NOW())
			ON CONFLICT DO NOTHING
		`;

		// Insert 3 job categories
		const categories = [
			{
				id: "e2e-jobcat-1111-0000-000000000000",
				index: 0,
				name: "Cadres dirigeants",
				detail: "Directeurs et cadres supérieurs",
			},
			{
				id: "e2e-jobcat-2222-0000-000000000000",
				index: 1,
				name: "Ingénieurs et cadres",
				detail: "Ingénieurs, chefs de projet, managers",
			},
			{
				id: "e2e-jobcat-3333-0000-000000000000",
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

/** Remove the previous year test declaration and its job categories. */
export async function deletePreviousYearDeclaration() {
	const sql = createConnection();
	const declId = "e2e-prev-year-decl-0000-000000000000";

	try {
		const jobIds = [
			"e2e-jobcat-1111-0000-000000000000",
			"e2e-jobcat-2222-0000-000000000000",
			"e2e-jobcat-3333-0000-000000000000",
		];
		await sql`DELETE FROM app_employee_category WHERE job_category_id = ANY(${jobIds})`;
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
