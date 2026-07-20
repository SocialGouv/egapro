import postgres from "postgres";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
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
