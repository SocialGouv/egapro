import postgres from "postgres";
import { TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

/**
 * Full teardown of one campaign-year coordinate for the test SIREN (#4067).
 *
 * The E2E grid (#4022) runs 185 declarations across 7 campaign years on a single
 * test company, so residue between two coordinates would surface as erratic,
 * undiagnosable failures on a multi-hour nightly run. This purges every
 * year-scoped row for (siren, year) in foreign-key dependency order (children
 * first), then flattens the two `app_company` columns that are shared across all
 * years and would otherwise leak from one coordinate to the next.
 *
 * The declaration lock is released explicitly (before the declaration it hangs
 * off) so a coordinate never inherits the lock of the previous one — even though
 * the FK would cascade — because the guarantee must be verifiable, not incidental.
 * The whole sequence runs in one transaction: a mid-teardown failure must never
 * leave a half-purged coordinate behind.
 */
export async function resetCampaignYear(year: number) {
	const sql = createConnection();
	try {
		await sql.begin(async (tx) => {
			await tx`
				DELETE FROM app_employee_category
				WHERE job_category_id IN (
					SELECT jc.id FROM app_job_category jc
					INNER JOIN app_declaration d ON d.id = jc.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_job_category
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			// cse_opinion_file references both cse_opinion and file, so it goes first.
			await tx`
				DELETE FROM app_cse_opinion_file
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_cse_opinion
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_file
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_declaration_status_history
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_declaration_lock
				WHERE declaration_id IN (
					SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
				)
			`;
			await tx`
				DELETE FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year}
			`;
			await tx`
				DELETE FROM app_gip_mds_data WHERE siren = ${TEST_SIREN} AND year = ${year}
			`;
			await tx`
				DELETE FROM app_campaign_deadline WHERE year = ${year}
			`;
			// app_company is NOT year-scoped: flatten the columns a coordinate mutates
			// (setCompanyHasCse / setCompanyWorkforce) so they cannot bleed forward.
			await tx`
				UPDATE app_company SET has_cse = NULL, workforce = NULL WHERE siren = ${TEST_SIREN}
			`;
		});
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
