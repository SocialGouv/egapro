import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { NON_DIFFUSIBLE_LABEL } from "~/modules/public-api";
import { db } from "~/server/db";
import { buildRepresentationExportRows } from "../generateRepresentationExport";

// The release gate is SQL-enforced: a mocked driver cannot prove it.
describe("buildRepresentationExportRows — public release gate", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_RELEASED = "820000001";
	const SIREN_TODAY = "820000002";
	const SIREN_FUTURE = "820000003";
	const SIREN_NULL_DATE = "820000004";
	const SIREN_NO_CAMPAIGN = "820000005";
	const SIREN_HIDDEN = "820000006";
	const SIREN_DRAFT = "820000007";
	const ALL_SIRENS = [
		SIREN_RELEASED,
		SIREN_TODAY,
		SIREN_FUTURE,
		SIREN_NULL_DATE,
		SIREN_NO_CAMPAIGN,
		SIREN_HIDDEN,
		SIREN_DRAFT,
	];

	// Reference years: the campaign releasing each one is year + 1.
	const YEAR_RELEASED = 2120;
	const YEAR_TODAY = 2121;
	const YEAR_FUTURE = 2122;
	const YEAR_NULL_DATE = 2123;
	const YEAR_NO_CAMPAIGN = 2124;
	const CAMPAIGN_YEARS = [
		YEAR_RELEASED + 1,
		YEAR_TODAY + 1,
		YEAR_FUTURE + 1,
		YEAR_NULL_DATE + 1,
	];

	async function cleanup() {
		await sql`DELETE FROM app_representation_declaration WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
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

		await sql`
			INSERT INTO app_company (siren, name, address, naf_code, naf_label, region, department_code, department_label, statut_diffusion)
			SELECT siren, 'Société ' || siren, '1 rue de la Paix, 75002 Paris', '62.02A', 'Conseil en systemes informatiques', 'Île-de-France', '75', 'Paris',
				CASE WHEN siren = ${SIREN_HIDDEN} THEN 'N' ELSE 'O' END
			FROM unnest(${sql.array(ALL_SIRENS)}::text[]) AS siren
		`;

		// Dates computed by Postgres so that today does not depend on the machine time zone.
		await sql`
			INSERT INTO app_campaign_deadline (
				year, public_data_release_date,
				decl1_modification_deadline, decl1_justification_deadline, decl1_joint_evaluation_deadline,
				decl2_modification_deadline, decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES
				(${YEAR_RELEASED + 1},  CURRENT_DATE - 1, '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_TODAY + 1},     CURRENT_DATE,     '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_FUTURE + 1},    CURRENT_DATE + 1, '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01'),
				(${YEAR_NULL_DATE + 1}, NULL,             '2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01','2000-01-01')
		`;

		await sql`
			INSERT INTO app_representation_declaration
				(id, siren, year, executive_women_percent, executive_men_percent, member_women_percent, member_men_percent, status)
			VALUES
				('repr-gate-released',     ${SIREN_RELEASED},     ${YEAR_RELEASED},     40.00, 60.00, 45.50, 54.50, 'submitted'),
				('repr-gate-today',        ${SIREN_TODAY},        ${YEAR_TODAY},        41.00, 59.00, 46.00, 54.00, 'submitted'),
				('repr-gate-future',       ${SIREN_FUTURE},       ${YEAR_FUTURE},       42.00, 58.00, 47.00, 53.00, 'submitted'),
				('repr-gate-null',         ${SIREN_NULL_DATE},    ${YEAR_NULL_DATE},    43.00, 57.00, 48.00, 52.00, 'submitted'),
				('repr-gate-no-campaign',  ${SIREN_NO_CAMPAIGN},  ${YEAR_NO_CAMPAIGN},  44.00, 56.00, 49.00, 51.00, 'submitted'),
				('repr-gate-hidden',       ${SIREN_HIDDEN},       ${YEAR_RELEASED},     30.00, 70.00, 25.00, 75.00, 'submitted'),
				('repr-gate-draft',        ${SIREN_DRAFT},        ${YEAR_RELEASED},     50.00, 50.00, 50.00, 50.00, 'draft')
		`;
	});

	async function exportedSirens(
		input?: Parameters<typeof buildRepresentationExportRows>[1],
	) {
		const rows = await buildRepresentationExportRows(db, input);
		return rows
			.filter((row) => ALL_SIRENS.includes(row.siren))
			.map((row) => row.siren);
	}

	it("exports only the reference years whose campaign release date is reached", async () => {
		expect(await exportedSirens()).toEqual([
			SIREN_RELEASED,
			SIREN_HIDDEN,
			SIREN_TODAY,
		]);
	});

	it("exports nothing for a year filtered on an unreleased campaign", async () => {
		for (const year of [YEAR_FUTURE, YEAR_NULL_DATE, YEAR_NO_CAMPAIGN]) {
			expect(await exportedSirens({ year, limit: 10, offset: 0 })).toEqual([]);
		}
	});

	it("still exports the released year when a year filter is given", async () => {
		expect(
			await exportedSirens({ year: YEAR_RELEASED, limit: 10, offset: 0 }),
		).toEqual([SIREN_RELEASED, SIREN_HIDDEN]);
	});

	it("keeps masking a non-diffusible company that is released", async () => {
		const rows = await buildRepresentationExportRows(db);
		const hidden = rows.find((row) => row.siren === SIREN_HIDDEN);

		expect(hidden).toMatchObject({
			name: NON_DIFFUSIBLE_LABEL,
			region: NON_DIFFUSIBLE_LABEL,
			departmentCode: NON_DIFFUSIBLE_LABEL,
			nafCode: NON_DIFFUSIBLE_LABEL,
			executiveWomenPercent: 30,
			memberWomenPercent: 25,
		});
	});

	it("keeps excluding a draft of an otherwise released year", async () => {
		expect(await exportedSirens()).not.toContain(SIREN_DRAFT);
	});
});
