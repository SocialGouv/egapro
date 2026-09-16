import { type SQL, sql as sqlExpr } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import type { RepresentationDeclarationStatus } from "~/modules/domain";
import {
	getPublicRepresentationBySirenYear,
	getPublicRepresentationsBySiren,
	NON_DIFFUSIBLE_LABEL,
	publicRepresentationDTOSchema,
	searchPublicRepresentations,
} from "~/modules/public-api";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	representationDeclarations,
} from "~/server/db/schema";

const SIREN_DIFFUSIBLE = "810000001";
const SIREN_HIDDEN = "810000002";
const SIREN_OTHER = "810000003";
const SIRENS = [SIREN_DIFFUSIBLE, SIREN_HIDDEN, SIREN_OTHER];

// Dedicated years, outside the 2100-2102 block used by the declarations suite.
const YEAR_OLDEST = 2110;
const YEAR_MIDDLE = 2111;
const YEAR_RELEASED = 2112;
const YEAR_RELEASED_TODAY = 2113;
const YEAR_FUTURE = 2114;
const YEAR_NULL_DATE = 2115;
const YEAR_NO_CAMPAIGN = 2116;
const REFERENCE_YEARS = [
	YEAR_OLDEST,
	YEAR_MIDDLE,
	YEAR_RELEASED,
	YEAR_RELEASED_TODAY,
	YEAR_FUTURE,
	YEAR_NULL_DATE,
	YEAR_NO_CAMPAIGN,
];
const CAMPAIGN_YEARS = REFERENCE_YEARS.map((year) => year + 1);

// Dates computed by Postgres so that today does not depend on the machine time zone.
const YESTERDAY = sqlExpr`CURRENT_DATE - 1`;
const TODAY = sqlExpr`CURRENT_DATE`;
const TOMORROW = sqlExpr`CURRENT_DATE + 1`;

function campaignRow(
	year: number,
	publicDataReleaseDate: SQL | null,
): typeof campaignDeadlines.$inferInsert {
	const filler = "2000-01-01";
	return {
		year,
		publicDataReleaseDate: publicDataReleaseDate as unknown as string | null,
		decl1ModificationDeadline: filler,
		decl1JustificationDeadline: filler,
		decl1JointEvaluationDeadline: filler,
		decl2ModificationDeadline: filler,
		decl2JustificationDeadline: filler,
		decl2JointEvaluationDeadline: filler,
		decl2CseOpinionDeadline: filler,
	};
}

type DeclarationRow = {
	siren: string;
	year: number;
	status?: RepresentationDeclarationStatus;
	executiveWomenPercent?: string | null;
	notComputableReasonMembers?: "aucune_instance_dirigeante" | null;
};

function declarationRow({
	siren,
	year,
	status = "submitted",
	executiveWomenPercent = "35.50",
	notComputableReasonMembers = null,
}: DeclarationRow) {
	return {
		id: `${siren}-${year}`,
		siren,
		year,
		status,
		referencePeriodStart: "2025-01-01",
		referencePeriodEnd: "2025-12-31",
		executiveWomenPercent,
		executiveMenPercent: "64.50",
		memberWomenPercent: notComputableReasonMembers ? null : "42.00",
		memberMenPercent: notComputableReasonMembers ? null : "58.00",
		notComputableReasonMembers,
		publishDate: "2026-02-15",
		publishUrl: "https://exemple.fr/egalite",
		publishModalities: null,
	};
}

async function cleanup(sql: ReturnType<typeof postgres>) {
	await sql`DELETE FROM app_representation_declaration WHERE siren IN ${sql(SIRENS)}`;
	await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
	await sql`DELETE FROM app_campaign_deadline WHERE year IN ${sql(CAMPAIGN_YEARS)}`;
}

describe("public representation services (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup(sql);
		await db.insert(companies).values([
			{
				siren: SIREN_DIFFUSIBLE,
				name: "Alpha Industries",
				address: "1 rue Alpha",
				region: "11",
				departmentCode: "75",
				departmentLabel: "Paris",
				nafCode: "62.01Z",
				nafLabel: "Programmation",
				statutDiffusion: "O",
			},
			{
				siren: SIREN_HIDDEN,
				name: "Beta Confidentiel",
				address: "2 rue Beta",
				region: "84",
				departmentCode: "69",
				departmentLabel: "Rhône",
				nafCode: "70.10Z",
				nafLabel: "Sièges sociaux",
				statutDiffusion: "N",
			},
			{
				siren: SIREN_OTHER,
				name: "Gamma SA",
				region: "11",
				departmentCode: "92",
				nafCode: "62.01Z",
			},
		]);
		await db
			.insert(campaignDeadlines)
			.values([
				campaignRow(YEAR_OLDEST + 1, YESTERDAY),
				campaignRow(YEAR_MIDDLE + 1, YESTERDAY),
				campaignRow(YEAR_RELEASED + 1, YESTERDAY),
				campaignRow(YEAR_RELEASED_TODAY + 1, TODAY),
				campaignRow(YEAR_FUTURE + 1, TOMORROW),
				campaignRow(YEAR_NULL_DATE + 1, null),
			]);
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup(sql);
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_representation_declaration WHERE siren IN ${sql(SIRENS)}`;
	});

	it("returns the real column types the DTO contract promises", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
			]);

		const dto = await getPublicRepresentationBySirenYear(
			SIREN_DIFFUSIBLE,
			YEAR_RELEASED,
		);

		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
		expect(dto).toMatchObject({
			siren: SIREN_DIFFUSIBLE,
			year: YEAR_RELEASED,
			name: "Alpha Industries",
			referencePeriodStart: "2025-01-01",
			referencePeriodEnd: "2025-12-31",
			executiveWomenPercent: 35.5,
			executiveMenPercent: 64.5,
			memberWomenPercent: 42,
			memberMenPercent: 58,
			publishDate: "2026-02-15",
			publishUrl: "https://exemple.fr/egalite",
			publishModalities: null,
		});
		expect(typeof dto?.referencePeriodStart).toBe("string");
		expect(typeof dto?.executiveWomenPercent).toBe("number");
	});

	it.each([
		"draft",
		"not_subject",
	] as const)("excludes a %s declaration from all three read surfaces", async (status) => {
		await db.insert(representationDeclarations).values([
			declarationRow({
				siren: SIREN_DIFFUSIBLE,
				year: YEAR_RELEASED,
				status,
			}),
			declarationRow({ siren: SIREN_OTHER, year: YEAR_RELEASED }),
		]);

		const search = await searchPublicRepresentations({ limit: 10, offset: 0 });
		expect(search.count).toBe(1);
		expect(search.data.map((d) => d.siren)).toEqual([SIREN_OTHER]);

		expect(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).toEqual([]);
		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, YEAR_RELEASED),
		).toBeNull();
	});

	it("masks identity and location for a non-diffusible company but keeps the gaps (S27)", async () => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_HIDDEN, year: YEAR_RELEASED })]);

		const dto = await getPublicRepresentationBySirenYear(
			SIREN_HIDDEN,
			YEAR_RELEASED,
		);

		expect(dto).toMatchObject({
			siren: SIREN_HIDDEN,
			year: YEAR_RELEASED,
			name: NON_DIFFUSIBLE_LABEL,
			address: NON_DIFFUSIBLE_LABEL,
			region: NON_DIFFUSIBLE_LABEL,
			departmentCode: NON_DIFFUSIBLE_LABEL,
			departmentLabel: NON_DIFFUSIBLE_LABEL,
			nafCode: NON_DIFFUSIBLE_LABEL,
			nafLabel: NON_DIFFUSIBLE_LABEL,
			executiveWomenPercent: 35.5,
			memberWomenPercent: 42,
		});
	});

	it("returns null for a year that carries no submitted declaration", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
			]);

		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, YEAR_MIDDLE),
		).toBeNull();
	});

	it("lists a siren's submitted declarations by descending year and honours the limit", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_OLDEST }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_MIDDLE }),
			]);

		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED, YEAR_MIDDLE, YEAR_OLDEST]);
		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE, 2)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED, YEAR_MIDDLE]);
	});

	it("round-trips a non-computable declaration with null percentages", async () => {
		await db.insert(representationDeclarations).values([
			declarationRow({
				siren: SIREN_DIFFUSIBLE,
				year: YEAR_RELEASED,
				executiveWomenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			}),
		]);

		const dto = await getPublicRepresentationBySirenYear(
			SIREN_DIFFUSIBLE,
			YEAR_RELEASED,
		);

		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
		expect(dto).toMatchObject({
			executiveWomenPercent: null,
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
			notComputableReasonExecutives: null,
		});
	});

	it("matches the q term against the company name and the siren", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_OTHER, year: YEAR_RELEASED }),
			]);

		const byName = await searchPublicRepresentations({
			q: "alpha",
			limit: 10,
			offset: 0,
		});
		expect(byName.data.map((d) => d.siren)).toEqual([SIREN_DIFFUSIBLE]);

		const bySiren = await searchPublicRepresentations({
			q: SIREN_OTHER,
			limit: 10,
			offset: 0,
		});
		expect(bySiren.data.map((d) => d.siren)).toEqual([SIREN_OTHER]);
		expect(bySiren.data[0]?.name).toBe(NON_DIFFUSIBLE_LABEL);

		const hiddenByName = await searchPublicRepresentations({
			q: "beta",
			limit: 10,
			offset: 0,
		});
		expect(hiddenByName.data).toEqual([]);
	});

	it("filters the search by region, department, naf and year", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_HIDDEN, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_OTHER, year: YEAR_MIDDLE }),
			]);

		const byRegion = await searchPublicRepresentations({
			region: ["11"],
			limit: 10,
			offset: 0,
		});
		expect(byRegion.data.map((d) => d.siren)).toEqual([SIREN_DIFFUSIBLE]);

		const byDepartement = await searchPublicRepresentations({
			departement: ["69"],
			limit: 10,
			offset: 0,
		});
		expect(byDepartement.data).toEqual([]);

		const byNaf = await searchPublicRepresentations({
			naf: ["70.10Z"],
			limit: 10,
			offset: 0,
		});
		expect(byNaf.data).toEqual([]);

		const byYear = await searchPublicRepresentations({
			year: YEAR_MIDDLE,
			limit: 10,
			offset: 0,
		});
		expect(byYear.count).toBe(1);
		expect(byYear.data.map((d) => d.siren)).toEqual([SIREN_OTHER]);
	});

	it("paginates with limit and offset while keeping the full count", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_HIDDEN, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_OTHER, year: YEAR_RELEASED }),
			]);

		const firstPage = await searchPublicRepresentations({
			limit: 2,
			offset: 0,
		});
		expect(firstPage.count).toBe(3);
		expect(firstPage.data).toHaveLength(2);

		const secondPage = await searchPublicRepresentations({
			limit: 2,
			offset: 2,
		});
		expect(secondPage.count).toBe(3);
		expect(secondPage.data).toHaveLength(1);
	});
	it("serves only the reference years whose campaign release date is reached", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED_TODAY }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_FUTURE }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_NULL_DATE }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_NO_CAMPAIGN }),
			]);

		const search = await searchPublicRepresentations({ limit: 10, offset: 0 });

		expect(search.count).toBe(2);
		expect(search.data.map((d) => d.year)).toEqual([
			YEAR_RELEASED_TODAY,
			YEAR_RELEASED,
		]);
	});

	it("keeps the unreleased year out of the count and out of every page", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_OLDEST }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_MIDDLE }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_FUTURE }),
			]);

		const years: number[] = [];
		for (const offset of [0, 1, 2, 3]) {
			const page = await searchPublicRepresentations({ limit: 1, offset });
			expect(page.count).toBe(3);
			years.push(...page.data.map((d) => d.year));
		}

		expect(years).toEqual([YEAR_RELEASED, YEAR_MIDDLE, YEAR_OLDEST]);
	});

	it("limits the history to released years instead of returning nothing", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_FUTURE }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_NULL_DATE }),
			]);

		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED]);
		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE, 1)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED]);
	});

	it.each([
		["future", YEAR_FUTURE],
		["null", YEAR_NULL_DATE],
		["missing", YEAR_NO_CAMPAIGN],
	] as const)("hides the detail of a submitted year whose campaign release date is %s", async (_label, year) => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_DIFFUSIBLE, year })]);

		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, year),
		).toBeNull();
	});

	it("reads the campaign of the reference year + 1, not the campaign of the reference year", async () => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_FUTURE })]);

		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, YEAR_FUTURE),
		).toBeNull();
	});
});
