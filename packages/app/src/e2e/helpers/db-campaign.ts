import postgres from "postgres";
import { TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
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
			},
			{
				id: PREV_YEAR_JOB_CATEGORY_IDS[1],
				index: 1,
				name: "Ingénieurs et cadres",
			},
			{
				id: PREV_YEAR_JOB_CATEGORY_IDS[2],
				index: 2,
				name: "Techniciens",
			},
		];

		for (const cat of categories) {
			await sql`
				INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
				VALUES (${cat.id}, ${declId}, ${cat.index}, ${cat.name}, 'accord-entreprise')
				ON CONFLICT DO NOTHING
			`;
		}
	} finally {
		await sql.end();
	}
}

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

type CampaignDeadlineDates = {
	decl1ModificationDeadline: string;
	decl1JustificationDeadline: string;
	decl1JointEvaluationDeadline: string;
	decl2ModificationDeadline: string;
	decl2JustificationDeadline: string;
	decl2JointEvaluationDeadline: string;
};

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
	siren: string;
	year: number;
	submittedAt: string;
	workforce: number;
};

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
			await sql`
				INSERT INTO app_company (siren, name, workforce, created_at, updated_at)
				VALUES (${row.siren}, ${`E2E Stats Co. ${row.siren}`}, ${row.workforce}, NOW(), NOW())
				ON CONFLICT (siren) DO UPDATE SET workforce = EXCLUDED.workforce
			`;
			await sql`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, current_step, status,
					submitted_at, created_at, updated_at
				)
				VALUES (
					gen_random_uuid(), ${row.siren}, ${row.year}, ${declarantId}, 6,
					'submitted', ${row.submittedAt}, NOW(), NOW()
				)
				ON CONFLICT (siren, year) WHERE cancelled_at IS NULL DO UPDATE SET
					status = 'submitted',
					submitted_at = EXCLUDED.submitted_at
			`;
		}
	} finally {
		await sql.end();
	}
}

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
