import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

// The GIP workforce reaches SUIT through a leftJoin on `gip_mds_data`; a unit
// test mocks the driver and cannot prove the join keeps GIP-less declarations.
describe("GET /api/v1/export/declarations — GIP workforce integration (#3929)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_IN_GIP = "111111111";
	const SIREN_NOT_IN_GIP = "222222222";
	const SIREN_FRACTIONAL = "333333333";
	const SIREN_OTHER_YEAR = "444444444";
	const ALL_SIRENS = [
		SIREN_IN_GIP,
		SIREN_NOT_IN_GIP,
		SIREN_FRACTIONAL,
		SIREN_OTHER_YEAR,
	];
	const YEAR = 2025;
	const USER_ID = "gip-workforce-integration-user";
	const DECL_IDS = [
		"gip-decl-in-gip",
		"gip-decl-not-in-gip",
		"gip-decl-fractional",
		"gip-decl-other-year",
	];

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE id IN ${sql(DECL_IDS)}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
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
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES (${USER_ID}, 'dir.rh@example.fr', 'Dir', 'RH')
		`;
		// `workforce` holds the Weez/INSEE value, deliberately different from the GIP one.
		await sql`
			INSERT INTO app_company (siren, name, workforce)
			VALUES
				(${SIREN_IN_GIP},      'Entreprise Dans GIP',       82),
				(${SIREN_NOT_IN_GIP},  'Entreprise Absente Du GIP', 1183),
				(${SIREN_FRACTIONAL},  'Entreprise Arrondi',        250),
				(${SIREN_OTHER_YEAR},  'Entreprise Autre Annee',    500)
		`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES
				(${SIREN_IN_GIP},     ${YEAR},     70.00),
				(${SIREN_FRACTIONAL}, ${YEAR},     99.97),
				(${SIREN_OTHER_YEAR}, ${YEAR - 1}, 300.00)
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status, created_at, updated_at)
			VALUES
				('gip-decl-in-gip',      ${SIREN_IN_GIP},     ${YEAR}, ${USER_ID}, 'demarche_completed', '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z'),
				('gip-decl-not-in-gip',  ${SIREN_NOT_IN_GIP}, ${YEAR}, ${USER_ID}, 'demarche_completed', '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z'),
				('gip-decl-fractional',  ${SIREN_FRACTIONAL}, ${YEAR}, ${USER_ID}, 'demarche_completed', '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z'),
				('gip-decl-other-year',  ${SIREN_OTHER_YEAR}, ${YEAR}, ${USER_ID}, 'demarche_completed', '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z')
		`;
	});

	async function fetchExport(): Promise<
		Array<{
			SIREN: string;
			Effectif: number | null;
			Indicateur_G_requis: boolean;
		}>
	> {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(
			new Request(
				"http://localhost/api/v1/export/declarations?date_begin=2025-05-01&date_end=2025-05-02",
				{ headers: { "x-gateway-forwarded": "test-value" } },
			),
		);
		expect(response.status).toBe(200);
		return (await response.json()).Declarations;
	}

	function findBySiren(
		declarations: Array<{ SIREN: string }>,
		siren: string,
	): { SIREN: string; Effectif: number | null; Indicateur_G_requis: boolean } {
		const found = declarations.find((d) => d.SIREN === siren);
		if (!found) throw new Error(`declaration for ${siren} missing from export`);
		return found as never;
	}

	it("sends the GIP annual average workforce as Effectif, not the Weez company workforce", async () => {
		const declarations = await fetchExport();

		expect(findBySiren(declarations, SIREN_IN_GIP).Effectif).toBe(70);
	});

	it("keeps the declaration of a company absent from the GIP file, with a null Effectif", async () => {
		const declarations = await fetchExport();

		expect(declarations).toHaveLength(4);
		const notInGip = findBySiren(declarations, SIREN_NOT_IN_GIP);
		expect(notInGip.Effectif).toBeNull();
		expect(notInGip.Indicateur_G_requis).toBe(false);
	});

	it("floors the numeric(9,2) workforce so 99,97 is exported as 99", async () => {
		const declarations = await fetchExport();

		expect(findBySiren(declarations, SIREN_FRACTIONAL).Effectif).toBe(99);
	});

	it("does not pick up a GIP row from another campaign year", async () => {
		const declarations = await fetchExport();

		const otherYear = findBySiren(declarations, SIREN_OTHER_YEAR);
		expect(otherYear.Effectif).toBeNull();
		expect(otherYear.Indicateur_G_requis).toBe(false);
	});
});
