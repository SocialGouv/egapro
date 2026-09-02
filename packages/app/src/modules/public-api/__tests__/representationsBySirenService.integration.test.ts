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
import { companies, representationDeclarations } from "~/server/db/schema";

const SIREN_DIFFUSIBLE = "810000001";
const SIREN_HIDDEN = "810000002";
const SIREN_OTHER = "810000003";
const SIRENS = [SIREN_DIFFUSIBLE, SIREN_HIDDEN, SIREN_OTHER];

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
			.values([declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 })]);

		const dto = await getPublicRepresentationBySirenYear(
			SIREN_DIFFUSIBLE,
			2026,
		);

		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
		expect(dto).toMatchObject({
			siren: SIREN_DIFFUSIBLE,
			year: 2026,
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
				year: 2026,
				status,
			}),
			declarationRow({ siren: SIREN_OTHER, year: 2026 }),
		]);

		const search = await searchPublicRepresentations({ limit: 10, offset: 0 });
		expect(search.count).toBe(1);
		expect(search.data.map((d) => d.siren)).toEqual([SIREN_OTHER]);

		expect(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).toEqual([]);
		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, 2026),
		).toBeNull();
	});

	it("masks identity and location for a non-diffusible company but keeps the gaps (S27)", async () => {
		await db
			.insert(representationDeclarations)
			.values([declarationRow({ siren: SIREN_HIDDEN, year: 2026 })]);

		const dto = await getPublicRepresentationBySirenYear(SIREN_HIDDEN, 2026);

		expect(dto).toMatchObject({
			siren: SIREN_HIDDEN,
			year: 2026,
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
			.values([declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 })]);

		expect(
			await getPublicRepresentationBySirenYear(SIREN_DIFFUSIBLE, 2025),
		).toBeNull();
	});

	it("lists a siren's submitted declarations by descending year and honours the limit", async () => {
		await db
			.insert(representationDeclarations)
			.values([
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2024 }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 }),
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2025 }),
			]);

		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE)).map(
				(d) => d.year,
			),
		).toEqual([2026, 2025, 2024]);
		expect(
			(await getPublicRepresentationsBySiren(SIREN_DIFFUSIBLE, 2)).map(
				(d) => d.year,
			),
		).toEqual([2026, 2025]);
	});

	it("round-trips a non-computable declaration with null percentages", async () => {
		await db.insert(representationDeclarations).values([
			declarationRow({
				siren: SIREN_DIFFUSIBLE,
				year: 2026,
				executiveWomenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			}),
		]);

		const dto = await getPublicRepresentationBySirenYear(
			SIREN_DIFFUSIBLE,
			2026,
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
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 }),
				declarationRow({ siren: SIREN_OTHER, year: 2026 }),
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
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 }),
				declarationRow({ siren: SIREN_HIDDEN, year: 2026 }),
				declarationRow({ siren: SIREN_OTHER, year: 2025 }),
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
			year: 2025,
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
				declarationRow({ siren: SIREN_DIFFUSIBLE, year: 2026 }),
				declarationRow({ siren: SIREN_HIDDEN, year: 2026 }),
				declarationRow({ siren: SIREN_OTHER, year: 2026 }),
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
});
