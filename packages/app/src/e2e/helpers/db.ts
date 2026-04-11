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
