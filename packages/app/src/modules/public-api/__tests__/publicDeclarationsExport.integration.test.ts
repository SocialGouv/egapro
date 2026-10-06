import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

// The public release gate is SQL-enforced: a mocked driver cannot prove it.
describe("GET /api/public/declarations/export — public release gate (#4566)", () => {
	let sql!: ReturnType<typeof postgres>;

	const DECLARANT_ID = "pub-export-declarant";
	const SIREN_RELEASED = "830000001";
	const SIREN_TODAY = "830000002";
	const SIREN_FUTURE = "830000003";
	const SIREN_NULL_DATE = "830000004";
	const SIREN_NO_CAMPAIGN = "830000005";
	const ALL_SIRENS = [
		SIREN_RELEASED,
		SIREN_TODAY,
		SIREN_FUTURE,
		SIREN_NULL_DATE,
		SIREN_NO_CAMPAIGN,
	];

	const YEAR_RELEASED = 2140;
	const YEAR_TODAY = 2141;
	const YEAR_FUTURE = 2142;
	const YEAR_NULL_DATE = 2143;
	const YEAR_NO_CAMPAIGN = 2144;
	// No campaign_deadline row is created for YEAR_NO_CAMPAIGN.
	const CAMPAIGN_YEARS = [
		YEAR_RELEASED,
		YEAR_TODAY,
		YEAR_FUTURE,
		YEAR_NULL_DATE,
	];

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${DECLARANT_ID}`;
		await sql`DELETE FROM app_campaign_deadline WHERE year IN ${sql(CAMPAIGN_YEARS)}`;
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();

		await sql`INSERT INTO app_user (id, email) VALUES (${DECLARANT_ID}, 'declarant@example.fr')`;

		await sql`
			INSERT INTO app_company (siren, name, naf_code, naf_label, region, department_code, department_label, statut_diffusion)
			SELECT siren, 'Société ' || siren, '62.01Z', 'Programmation informatique', 'Île-de-France', '75', 'Paris', 'O'
			FROM unnest(${sql.array(ALL_SIRENS)}::text[]) AS siren
		`;

		// Dates computed by Postgres so that "today" does not depend on the machine time zone.
		await sql`
			INSERT INTO app_campaign_deadline (
				year, public_data_release_date,
				decl1_modification_deadline, decl1_justification_deadline, decl1_joint_evaluation_deadline,
				decl2_modification_deadline, decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES
				(${YEAR_RELEASED},  (now() AT TIME ZONE 'Europe/Paris')::date - 1, '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_TODAY},     (now() AT TIME ZONE 'Europe/Paris')::date,     '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_FUTURE},    (now() AT TIME ZONE 'Europe/Paris')::date + 1, '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_NULL_DATE}, NULL,                                         '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01')
		`;

		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status)
			VALUES
				('decl-export-released',    ${SIREN_RELEASED},    ${YEAR_RELEASED},    ${DECLARANT_ID}, 'demarche_completed'),
				('decl-export-today',       ${SIREN_TODAY},       ${YEAR_TODAY},       ${DECLARANT_ID}, 'demarche_completed'),
				('decl-export-future',      ${SIREN_FUTURE},      ${YEAR_FUTURE},      ${DECLARANT_ID}, 'demarche_completed'),
				('decl-export-null',        ${SIREN_NULL_DATE},   ${YEAR_NULL_DATE},   ${DECLARANT_ID}, 'demarche_completed'),
				('decl-export-no-campaign', ${SIREN_NO_CAMPAIGN}, ${YEAR_NO_CAMPAIGN}, ${DECLARANT_ID}, 'demarche_completed')
		`;
	});

	async function fetchExportedSirens(search = "") {
		const { GET } = await import("~/app/api/public/declarations/export/route");
		const response = await GET(
			new Request(`http://localhost/api/public/declarations/export${search}`),
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { data: Array<{ siren: string }> };
		return body.data
			.map((row) => row.siren)
			.filter((siren) => ALL_SIRENS.includes(siren));
	}

	it("exports the years whose public release date is reached, including today (S3)", async () => {
		const sirens = await fetchExportedSirens();

		expect(sirens).toEqual(
			expect.arrayContaining([SIREN_RELEASED, SIREN_TODAY]),
		);
		expect(sirens).not.toContain(SIREN_FUTURE);
	});

	it("excludes a year whose public release date is empty (S1)", async () => {
		const sirens = await fetchExportedSirens();

		expect(sirens).not.toContain(SIREN_NULL_DATE);
	});

	it("excludes a year that has no campaign row at all (S2)", async () => {
		const sirens = await fetchExportedSirens();

		expect(sirens).not.toContain(SIREN_NO_CAMPAIGN);
	});

	it.each([
		["future release date", YEAR_FUTURE],
		["empty release date", YEAR_NULL_DATE],
		["no campaign row", YEAR_NO_CAMPAIGN],
	])("returns an empty export when filtered on an unreleased year — %s (S4)", async (_label, year) => {
		const sirens = await fetchExportedSirens(`?year=${year}`);

		expect(sirens).toEqual([]);
	});

	it("still exports a released year when filtered by that year (S4 counterpart)", async () => {
		expect(await fetchExportedSirens(`?year=${YEAR_RELEASED}`)).toEqual([
			SIREN_RELEASED,
		]);
		expect(await fetchExportedSirens(`?year=${YEAR_TODAY}`)).toEqual([
			SIREN_TODAY,
		]);
	});

	it("also enforces the release gate in the CSV format", async () => {
		const { GET } = await import("~/app/api/public/declarations/export/route");
		const response = await GET(
			new Request("http://localhost/api/public/declarations/export?format=csv"),
		);

		expect(response.status).toBe(200);
		const csv = await response.text();
		expect(csv).toContain(SIREN_RELEASED);
		expect(csv).not.toContain(SIREN_FUTURE);
		expect(csv).not.toContain(SIREN_NULL_DATE);
		expect(csv).not.toContain(SIREN_NO_CAMPAIGN);
	});
});
