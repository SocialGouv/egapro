import { type SQL, sql as sqlExpr } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import type { RepresentationDeclarationStatus } from "~/modules/domain";
import {
	getPublicRepresentationsBySiren,
	NON_DIFFUSIBLE_LABEL,
	publicRepresentationDTOSchema,
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
const YEAR_JOIN_OFFSET_GUARD = 2130;
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
const JOIN_OFFSET_GUARD_CAMPAIGN_YEARS = [
	YEAR_JOIN_OFFSET_GUARD,
	YEAR_JOIN_OFFSET_GUARD + 1,
];

// Dates computed by Postgres so that today does not depend on the machine time zone.
const PARIS_TODAY = sqlExpr`(now() AT TIME ZONE 'Europe/Paris')::date`;
const YESTERDAY = sqlExpr`${PARIS_TODAY} - 1`;
const TODAY = sqlExpr`${PARIS_TODAY}`;
const TOMORROW = sqlExpr`${PARIS_TODAY} + 1`;

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
	await sql`DELETE FROM app_campaign_deadline WHERE year IN ${sql([...CAMPAIGN_YEARS, ...JOIN_OFFSET_GUARD_CAMPAIGN_YEARS])}`;
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

		const [dto] = await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE);

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
	] as const)("excludes a %s declaration from the company history", async (status) => {
		await db.insert(representationDeclarations).values([
			declarationRow({
				siren: SIREN_DIFFUSIBLE,
				year: YEAR_RELEASED,
				status,
			}),
			declarationRow({ siren: SIREN_OTHER, year: YEAR_RELEASED }),
		]);

		expect(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).toEqual([]);
		expect(
			(await getPublicRepresentationsBySiren(SIREN_OTHER)).map((d) => d.siren),
		).toEqual([SIREN_OTHER]);
	});

	it("masks identity and location for a non-diffusible company but keeps the gaps (S27)", async () => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_HIDDEN, year: YEAR_RELEASED })]);

		const [dto] = await getPublicRepresentationsBySiren(SIREN_HIDDEN);

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

		const [dto] = await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE);

		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
		expect(dto).toMatchObject({
			executiveWomenPercent: null,
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
			notComputableReasonExecutives: null,
		});
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

		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED_TODAY, YEAR_RELEASED]);
	});

	it("keeps the unreleased year out of a limited history", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_OLDEST }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_MIDDLE }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_RELEASED }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: YEAR_FUTURE }),
			]);

		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE, 4)).map(
				(d) => d.year,
			),
		).toEqual([YEAR_RELEASED, YEAR_MIDDLE, YEAR_OLDEST]);
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
	] as const)("hides a submitted year whose campaign release date is %s", async (_label, year) => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_DIFFUSIBLE, year })]);

		expect(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).toEqual([]);
	});

	it("reads the campaign of the reference year + 1, not the campaign of the reference year", async () => {
		await db
			.insert(campaignDeadlines)
			.values([
				campaignRow(YEAR_JOIN_OFFSET_GUARD, YESTERDAY),
				campaignRow(YEAR_JOIN_OFFSET_GUARD + 1, TOMORROW),
			]);
		await db.insert(representationDeclarations).values([
			declarationRow({
				siren: SIREN_DIFFUSIBLE,
				year: YEAR_JOIN_OFFSET_GUARD,
			}),
		]);

		expect(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).toEqual([]);
	});
});
