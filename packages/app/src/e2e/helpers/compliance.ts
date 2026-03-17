import { TEST_EMAIL, TEST_SIREN, withDb } from "./db";

type ComplianceStateOptions = {
	hasCse: boolean | null;
	hasInitialGap: boolean;
	compliancePath?: string | null;
	secondDeclarationStatus?: string | null;
	correctionHasGap?: boolean;
	complianceCompletedAt?: Date | null;
};

/**
 * Seed the DB with a specific compliance state for the test user.
 * Must be called in beforeAll() of each compliance test describe block.
 */
export async function setupComplianceState(
	options: ComplianceStateOptions,
): Promise<void> {
	const {
		hasCse,
		hasInitialGap,
		compliancePath = null,
		secondDeclarationStatus = null,
		correctionHasGap,
		complianceCompletedAt = null,
	} = options;

	await withDb(async (sql) => {
		const year = new Date().getFullYear();
		// annual_base_men=1100 → 9% gap, annual_base_men=1020 → ~2% gap (below threshold)
		const menSalary = hasInitialGap ? 1100 : 1020;

		const [user] = await sql<{ id: string }[]>`
			SELECT id FROM app_user WHERE email = ${TEST_EMAIL} LIMIT 1
		`;
		if (!user) throw new Error(`Test user ${TEST_EMAIL} not found in DB`);

		await sql`
			UPDATE app_company SET has_cse = ${hasCse} WHERE siren = ${TEST_SIREN}
		`;

		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, current_step, compliance_path,
				 second_declaration_status, compliance_completed_at, created_at, updated_at)
			VALUES
				(gen_random_uuid(), ${TEST_SIREN}, ${year}, ${user.id}, 'submitted', 6, ${compliancePath},
				 ${secondDeclarationStatus}, ${complianceCompletedAt}, NOW(), NOW())
			ON CONFLICT (siren, year) DO UPDATE SET
				status = 'submitted',
				current_step = 6,
				compliance_path = ${compliancePath},
				second_declaration_status = ${secondDeclarationStatus},
				compliance_completed_at = ${complianceCompletedAt},
				updated_at = NOW()
		`;

		// Guard against async ComplianceCompletionTracker mutation from previous test
		await sql`
			UPDATE app_declaration
			SET compliance_completed_at = ${complianceCompletedAt}
			WHERE siren = ${TEST_SIREN} AND year = ${year}
		`;

		const [declaration] = await sql<{ id: string }[]>`
			SELECT id FROM app_declaration
			WHERE siren = ${TEST_SIREN} AND year = ${year}
			LIMIT 1
		`;
		if (!declaration) throw new Error("Declaration not found after upsert");

		await sql`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (gen_random_uuid(), ${declaration.id}, 0, 'Catégorie test', 'csp')
			ON CONFLICT (declaration_id, category_index) DO UPDATE SET name = 'Catégorie test'
		`;

		const [jobCategory] = await sql<{ id: string }[]>`
			SELECT id FROM app_job_category
			WHERE declaration_id = ${declaration.id} AND category_index = 0
			LIMIT 1
		`;
		if (!jobCategory) throw new Error("Job category not found after upsert");

		await sql`
			INSERT INTO app_employee_category
				(id, job_category_id, declaration_type, women_count, men_count,
				 annual_base_women, annual_base_men, created_at, updated_at)
			VALUES (gen_random_uuid(), ${jobCategory.id}, 'initial', 5, 5, 1000, ${menSalary}, NOW(), NOW())
			ON CONFLICT (job_category_id, declaration_type) DO UPDATE SET
				annual_base_women = 1000,
				annual_base_men = ${menSalary},
				updated_at = NOW()
		`;

		if (correctionHasGap !== undefined) {
			const correctionMenSalary = correctionHasGap ? 1100 : 1020;
			await sql`
				INSERT INTO app_employee_category
					(id, job_category_id, declaration_type, women_count, men_count,
					 annual_base_women, annual_base_men, created_at, updated_at)
				VALUES
					(gen_random_uuid(), ${jobCategory.id}, 'correction', 5, 5, 1000, ${correctionMenSalary}, NOW(), NOW())
				ON CONFLICT (job_category_id, declaration_type) DO UPDATE SET
					annual_base_women = 1000,
					annual_base_men = ${correctionMenSalary},
					updated_at = NOW()
			`;
		} else {
			await sql`
				DELETE FROM app_employee_category
				WHERE job_category_id = ${jobCategory.id} AND declaration_type = 'correction'
			`;
		}
	});
}
