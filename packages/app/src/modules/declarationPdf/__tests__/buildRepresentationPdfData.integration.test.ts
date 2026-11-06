import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env } from "~/env.js";
import {
	buildRepresentationPdfData,
	RepresentationDeclarationNotFoundError,
} from "~/modules/declarationPdf/buildRepresentationPdfData";

describe("buildRepresentationPdfData against a real Postgres", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "222333444";
	const YEAR = 2025;
	const CAMPAIGN_YEAR = YEAR + 1;
	const NOW = new Date("2026-06-15T09:30:00.000Z");
	const DECLARATION_ID = "representation-pdf-integration";
	const DECLARANT_ID = "representation-pdf-integration-user";

	async function insertDeclaration(columns: Record<string, unknown>) {
		await sql`
			INSERT INTO app_representation_declaration ${sql({
				id: DECLARATION_ID,
				siren: SIREN,
				year: YEAR,
				declarant_id: DECLARANT_ID,
				...columns,
			})}
		`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_company (siren, name, naf_code, naf_label, address, department_label)
			VALUES (${SIREN}, 'Société Récapitulatif', '62.02A', 'Conseil en systèmes et logiciels informatiques', '12 rue des Innovateurs', '75011 Paris')
		`;
		await sql`
			INSERT INTO app_user (id, first_name, last_name, email, phone)
			VALUES (${DECLARANT_ID}, 'Marie', 'Dupont', 'marie.dupont@exemple.fr', '06 01 02 03 04')
		`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES (${SIREN}, ${CAMPAIGN_YEAR}, 2256)
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_representation_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${DECLARANT_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_representation_declaration WHERE siren = ${SIREN}`;
	});

	it("reads the numeric and date columns back as usable values (S20)", async () => {
		await insertDeclaration({
			status: "submitted",
			submitted_at: new Date("2026-03-10T08:00:00.000Z"),
			reference_period_start: "2025-01-01",
			reference_period_end: "2025-12-31",
			executive_women_percent: 60,
			executive_men_percent: 40,
			member_women_percent: 55.5,
			member_men_percent: 44.5,
			publish_date: "2026-03-01",
			publish_url: "https://exemple.fr/egalite-professionnelle",
		});

		const data = await buildRepresentationPdfData(SIREN, YEAR, NOW);

		expect(data).toMatchObject({
			siren: SIREN,
			year: YEAR,
			campaignYear: CAMPAIGN_YEAR,
			referencePeriod: "01/01/2025 - 31/12/2025",
			publicationApplicable: true,
			hasWebsite: true,
			publishDate: "2026-03-01",
		});
		expect(data.company).toMatchObject({
			name: "Société Récapitulatif",
			naf: "62.02A - Conseil en systèmes et logiciels informatiques",
			location: { label: "Adresse", value: "12 rue des Innovateurs" },
			workforceDisplay: "2 256",
		});
		expect(data.declarantRows).toEqual([
			{ label: "Nom Prénom", value: "Marie Dupont" },
			{ label: "Adresse email", value: "marie.dupont@exemple.fr" },
			{ label: "Numéro de téléphone", value: "06 01 02 03 04" },
		]);
		// `numeric` comes back as a string from the driver: the percentages have to
		// survive as numbers or the PDF renders "NaN %".
		expect(data.indicators.map((indicator) => indicator.womenPercent)).toEqual([
			60, 55.5,
		]);
		expect(data.indicators.map((indicator) => indicator.menPercent)).toEqual([
			40, 44.5,
		]);
		expect(data.indicators.map((indicator) => indicator.verdict)).toEqual([
			"compliant",
			"compliant",
		]);
		expect(data.submittedAt).toBeInstanceOf(Date);
	});

	it("reflects the last transmitted version after a new submission (S22)", async () => {
		await insertDeclaration({
			status: "submitted",
			submitted_at: new Date("2026-03-10T08:00:00.000Z"),
			executive_women_percent: 60,
			executive_men_percent: 40,
			member_women_percent: 55,
			member_men_percent: 45,
		});

		await sql`
			UPDATE app_representation_declaration
			SET executive_women_percent = 25, executive_men_percent = 75,
				submitted_at = '2026-04-02T08:00:00.000Z'
			WHERE id = ${DECLARATION_ID}
		`;

		const data = await buildRepresentationPdfData(SIREN, YEAR, NOW);

		expect(data.indicators[0]).toMatchObject({
			womenPercent: 25,
			menPercent: 75,
			verdict: "non_compliant",
		});
		expect(data.submittedAt).toEqual(new Date("2026-04-02T08:00:00.000Z"));
	});

	it("keeps the not-computable motives readable in the recap", async () => {
		await insertDeclaration({
			status: "submitted",
			submitted_at: new Date("2026-03-10T08:00:00.000Z"),
			not_computable_reason_executives: "un_seul_cadre_dirigeant",
			not_computable_reason_members: "aucune_instance_dirigeante",
		});

		const data = await buildRepresentationPdfData(SIREN, YEAR, NOW);

		expect(
			data.indicators.map((indicator) => indicator.notComputableReason),
		).toEqual(["Un cadre dirigeant", "Aucune instance dirigeante"]);
		expect(data.publicationApplicable).toBe(false);
	});

	it("leaves the declarant rows empty when the declaration has no declarant", async () => {
		await insertDeclaration({
			status: "submitted",
			submitted_at: new Date("2026-03-10T08:00:00.000Z"),
			declarant_id: null,
		});

		const data = await buildRepresentationPdfData(SIREN, YEAR, NOW);

		expect(data.declarantRows).toEqual([]);
	});

	it.each([
		"draft",
		"not_subject",
	])("refuses a %s declaration, which transmitted no gap", async (status) => {
		await insertDeclaration({ status, current_step: 3 });

		await expect(
			buildRepresentationPdfData(SIREN, YEAR, NOW),
		).rejects.toBeInstanceOf(RepresentationDeclarationNotFoundError);
	});

	it("refuses a year with no declaration at all", async () => {
		await expect(
			buildRepresentationPdfData(SIREN, YEAR, NOW),
		).rejects.toBeInstanceOf(RepresentationDeclarationNotFoundError);
	});
});
