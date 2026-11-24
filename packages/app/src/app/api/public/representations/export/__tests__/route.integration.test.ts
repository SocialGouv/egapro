import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	gipMdsData,
	representationDeclarations,
	users,
} from "~/server/db/schema";

const DECLARANT_ID = "representation-export-declarant";
const DIFFUSIBLE_SIREN = "810000101";
const NON_DIFFUSIBLE_SIREN = "810000102";
const CAMPAIGNS = 11;

function campaignYear(index: number) {
	return 2100 + index;
}

function deadlineRow(year: number) {
	const filler = "2000-01-01";
	return {
		year,
		publicDataReleaseDate: filler,
		decl1ModificationDeadline: filler,
		decl1JustificationDeadline: filler,
		decl1JointEvaluationDeadline: filler,
		decl2ModificationDeadline: filler,
		decl2JustificationDeadline: filler,
		decl2JointEvaluationDeadline: filler,
		decl2CseOpinionDeadline: filler,
	};
}

async function cleanup(sql: ReturnType<typeof postgres>) {
	await sql`DELETE FROM app_representation_declaration WHERE siren IN (${DIFFUSIBLE_SIREN}, ${NON_DIFFUSIBLE_SIREN})`;
	await sql`DELETE FROM app_gip_mds_data WHERE siren IN (${DIFFUSIBLE_SIREN}, ${NON_DIFFUSIBLE_SIREN})`;
	await sql`DELETE FROM app_campaign_deadline WHERE year BETWEEN ${campaignYear(0)} AND ${campaignYear(CAMPAIGNS)}`;
	await sql`DELETE FROM app_company WHERE siren IN (${DIFFUSIBLE_SIREN}, ${NON_DIFFUSIBLE_SIREN})`;
	await sql`DELETE FROM app_user WHERE id = ${DECLARANT_ID}`;
}

async function callGet(search: string) {
	const { GET } = await import("../route");
	return GET(
		new Request(`http://localhost/api/public/representations/export${search}`),
	);
}

function csvRows(csv: string) {
	const [header, ...lines] = csv.split("\n");
	return {
		header: header?.split(";") ?? [],
		lines: lines.map((l) => l.split(";")),
	};
}

describe("GET /api/public/representations/export (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup(sql);
		await db.insert(users).values({
			id: DECLARANT_ID,
			email: "[EMAIL_REDACTED]",
		});
		await db.insert(companies).values([
			{
				siren: DIFFUSIBLE_SIREN,
				name: "Société Démo",
				address: "1 rue de la Paix, 75002 Paris",
				region: "Île-de-France",
				departmentCode: "75",
				departmentLabel: "Paris",
				countryCode: null,
				countryLabel: "FRANCE",
				nafCode: "7022Z",
				nafLabel: "Conseil pour les affaires",
				statutDiffusion: "O",
			},
			{
				siren: NON_DIFFUSIBLE_SIREN,
				name: "Société Secrète",
				address: "2 rue Cachée, 69001 Lyon",
				region: "Auvergne-Rhône-Alpes",
				departmentCode: "69",
				departmentLabel: "Rhône",
				countryCode: "99100",
				countryLabel: "ALLEMAGNE",
				nafCode: "6202A",
				nafLabel: "Conseil informatique",
				statutDiffusion: "N",
			},
		]);

		for (let index = 0; index < CAMPAIGNS; index += 1) {
			const campaign = campaignYear(index);
			await db.insert(campaignDeadlines).values(deadlineRow(campaign));
			await db.insert(representationDeclarations).values({
				id: `representation-export-${campaign}`,
				siren: DIFFUSIBLE_SIREN,
				year: campaign - 1,
				declarantId: DECLARANT_ID,
				status: "submitted",
				executiveWomenPercent: "35.50",
				executiveMenPercent: "64.50",
				memberWomenPercent: "42.00",
				memberMenPercent: "58.00",
			});
		}

		await db.insert(representationDeclarations).values([
			{
				id: "representation-export-non-diffusible",
				siren: NON_DIFFUSIBLE_SIREN,
				year: campaignYear(CAMPAIGNS - 1) - 1,
				declarantId: DECLARANT_ID,
				status: "submitted",
				executiveWomenPercent: "25.00",
				executiveMenPercent: "75.00",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			},
			{
				id: "representation-export-draft",
				siren: NON_DIFFUSIBLE_SIREN,
				year: campaignYear(CAMPAIGNS - 1) - 2,
				declarantId: DECLARANT_ID,
				status: "draft",
			},
		]);

		await db.insert(gipMdsData).values([
			{
				siren: DIFFUSIBLE_SIREN,
				year: campaignYear(CAMPAIGNS - 1) - 1,
				workforceEma: "250.00",
			},
			{
				siren: DIFFUSIBLE_SIREN,
				year: campaignYear(CAMPAIGNS - 1) - 2,
				workforceEma: "190.00",
			},
		]);
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup(sql);
		await sql.end();
	});

	it("limits the file to the 10 most recent campaign years without year", async () => {
		const response = await callGet("?format=csv&q=" + DIFFUSIBLE_SIREN);
		const { lines } = csvRows(await response.text());
		const years = lines.map((line) => Number(line[0]?.replaceAll('"', "")));

		expect(years).toHaveLength(10);
		expect(years).not.toContain(campaignYear(0));
		expect(years).toContain(campaignYear(CAMPAIGNS - 1));
	});

	it("filters on a single campaign year and names the file after it", async () => {
		const year = campaignYear(CAMPAIGNS - 1);
		const response = await callGet(
			`?format=csv&year=${year}&q=${DIFFUSIBLE_SIREN}`,
		);

		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="Indicateurs_representation_${year}.csv"`,
		);
		const { lines } = csvRows(await response.text());
		expect(lines).toHaveLength(1);
		expect(lines[0]?.[0]).toBe(`"${year}"`);
	});

	it("reads the workforce of the reference year, not the campaign year (S8)", async () => {
		const year = campaignYear(CAMPAIGNS - 1);
		const response = await callGet(
			`?format=csv&year=${year}&q=${DIFFUSIBLE_SIREN}`,
		);
		const { header, lines } = csvRows(await response.text());

		expect(lines[0]?.[header.indexOf('"Effectif_annuel_moyen"')]).toBe('"250"');
	});

	it("leaves the workforce empty when the reference year is missing (S8)", async () => {
		const year = campaignYear(CAMPAIGNS - 3);
		const response = await callGet(
			`?format=csv&year=${year}&q=${DIFFUSIBLE_SIREN}`,
		);
		const { header, lines } = csvRows(await response.text());

		expect(lines[0]?.[header.indexOf('"Effectif_annuel_moyen"')]).toBe('""');
	});

	it("masks identity, address and country of a non-diffusible company (S4)", async () => {
		const year = campaignYear(CAMPAIGNS - 1);
		const response = await callGet(
			`?format=csv&year=${year}&q=${NON_DIFFUSIBLE_SIREN}`,
		);
		const { header, lines } = csvRows(await response.text());
		const cell = (name: string) => lines[0]?.[header.indexOf(`"${name}"`)];

		expect(cell("SIREN")).toBe(`"${NON_DIFFUSIBLE_SIREN}"`);
		expect(cell("Raison_sociale")).toBe('"Non-diffusible"');
		expect(cell("Adresse")).toBe('"Non-diffusible"');
		expect(cell("Pays")).toBe('"Non-diffusible"');
		expect(cell("Cadres_pourcentage_F")).toBe('"25"');
	});

	it("never publishes a draft declaration (S7)", async () => {
		const year = campaignYear(CAMPAIGNS - 1) - 1;
		const response = await callGet(
			`?format=csv&year=${year}&q=${NON_DIFFUSIBLE_SIREN}`,
		);

		expect((await response.text()).split("\n")).toHaveLength(1);
	});

	it("builds an Excel workbook for the same filtered set", async () => {
		const year = campaignYear(CAMPAIGNS - 1);
		const response = await callGet(
			`?format=xlsx&year=${year}&q=${DIFFUSIBLE_SIREN}`,
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toContain(
			"spreadsheetml.sheet",
		);
	});
});
