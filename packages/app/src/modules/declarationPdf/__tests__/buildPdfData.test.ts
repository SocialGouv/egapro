import { describe, expect, it, vi } from "vitest";

const queryResults: unknown[][] = [];
let callIndex = 0;

vi.mock("~/server/db", () => {
	const makeChain = () => ({
		select: () => ({
			from: () => ({
				where: () => {
					const idx = callIndex++;
					const result = queryResults[idx] ?? [];
					return Object.assign(Promise.resolve(result), {
						limit: () => Promise.resolve(result),
					});
				},
			}),
		}),
	});
	return { db: makeChain() };
});

vi.mock("~/server/db/schema", () => ({
	declarations: { siren: "siren", year: "year" },
	declarationCategories: {
		siren: "siren",
		year: "year",
		step: "step",
		$inferSelect: {},
	},
	companies: { siren: "siren" },
	jobCategories: { declarationId: "declarationId" },
	employeeCategories: { jobCategoryId: "jobCategoryId" },
}));

vi.mock("~/server/api/routers/declarationHelpers", () => ({
	mapToEmployeeCategoryRows: (
		_jobs: unknown[],
		_empCats: unknown[],
		_type: string,
	) => [],
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => args,
	eq: (col: unknown, val: unknown) => ({ col, val }),
}));

function resetMocks() {
	callIndex = 0;
	queryResults.length = 0;
}

describe("buildPdfData", () => {
	it("throws when declaration not found", async () => {
		resetMocks();
		queryResults.push([]);

		const { buildPdfData } = await import("../buildPdfData");
		await expect(
			buildPdfData("123456789", 2026, new Date("2026-03-09")),
		).rejects.toThrow("Déclaration introuvable");
	});

	it("throws when declaration is not submitted", async () => {
		resetMocks();
		queryResults.push([{ siren: "123456789", year: 2026, status: "draft" }]);

		const { buildPdfData } = await import("../buildPdfData");
		await expect(
			buildPdfData("123456789", 2026, new Date("2026-03-09")),
		).rejects.toThrow("La déclaration n'est pas encore soumise");
	});

	it("returns transformed data for a submitted declaration", async () => {
		resetMocks();
		// Query 1: declarations
		queryResults.push([
			{
				id: "decl-uuid",
				siren: "123456789",
				year: 2026,
				status: "submitted",
				totalWomen: 50,
				totalMen: 60,
			},
		]);
		// Query 2: companies
		queryResults.push([{ siren: "123456789", name: "Acme Corp" }]);
		// Query 3: declarationCategories (steps 1-4 only, step 5 from new tables)
		queryResults.push([
			{
				step: 1,
				categoryName: "Cadres",
				womenCount: 20,
				menCount: 30,
				womenValue: null,
				menValue: null,
				womenMedianValue: null,
				menMedianValue: null,
			},
			{
				step: 2,
				categoryName: "Annuelle brute moyenne",
				womenCount: null,
				menCount: null,
				womenValue: "45000",
				menValue: "50000",
				womenMedianValue: null,
				menMedianValue: null,
			},
			{
				step: 3,
				categoryName: "Bénéficiaires",
				womenCount: null,
				menCount: null,
				womenValue: "80",
				menValue: "75",
				womenMedianValue: null,
				menMedianValue: null,
			},
			{
				step: 3,
				categoryName: "Annuelle brute moyenne",
				womenCount: null,
				menCount: null,
				womenValue: "5000",
				menValue: "6000",
				womenMedianValue: null,
				menMedianValue: null,
			},
			{
				step: 4,
				categoryName: "annual:Q1",
				womenCount: 10,
				menCount: 15,
				womenValue: "40000",
				menValue: "42000",
				womenMedianValue: null,
				menMedianValue: null,
			},
		]);
		// Query 4: jobCategories (empty — mapToEmployeeCategoryRows is mocked)
		queryResults.push([]);

		const { buildPdfData } = await import("../buildPdfData");
		const result = await buildPdfData(
			"123456789",
			2026,
			new Date("2026-03-09"),
		);

		expect(result.companyName).toBe("Acme Corp");
		expect(result.siren).toBe("123456789");
		expect(result.year).toBe(2026);
		expect(result.generatedAt).toBe("9 mars 2026");
		expect(result.totalWomen).toBe(50);
		expect(result.totalMen).toBe(60);

		expect(result.step1Categories).toEqual([
			{ name: "Cadres", women: 20, men: 30 },
		]);

		expect(result.step2Rows).toEqual([
			{
				label: "Annuelle brute moyenne",
				womenValue: "45000",
				menValue: "50000",
			},
		]);

		expect(result.step3Data.beneficiaryWomen).toBe("80");
		expect(result.step3Data.beneficiaryMen).toBe("75");
		expect(result.step3Data.rows).toEqual([
			{
				label: "Annuelle brute moyenne",
				womenValue: "5000",
				menValue: "6000",
			},
		]);

		expect(result.step4Categories).toEqual([
			{
				name: "annual:Q1",
				womenCount: 10,
				menCount: 15,
				womenValue: "40000",
				menValue: "42000",
				womenMedianValue: undefined,
				menMedianValue: undefined,
			},
		]);

		// step5Categories comes from mapToEmployeeCategoryRows mock (returns [])
		expect(result.step5Categories).toEqual([]);
	});

	it("falls back to default company name when company not found", async () => {
		resetMocks();
		// Query 1: declarations
		queryResults.push([
			{
				id: "decl-uuid-2",
				siren: "999999999",
				year: 2026,
				status: "submitted",
				totalWomen: null,
				totalMen: null,
			},
		]);
		// Query 2: companies (not found)
		queryResults.push([]);
		// Query 3: declarationCategories (empty)
		queryResults.push([]);
		// Query 4: jobCategories (empty)
		queryResults.push([]);

		const { buildPdfData } = await import("../buildPdfData");
		const result = await buildPdfData(
			"999999999",
			2026,
			new Date("2026-03-09"),
		);

		expect(result.companyName).toBe("Entreprise 999999999");
		expect(result.totalWomen).toBe(0);
		expect(result.totalMen).toBe(0);
		expect(result.step1Categories).toEqual([]);
		expect(result.step2Rows).toEqual([]);
		expect(result.step3Data.rows).toEqual([]);
		expect(result.step3Data.beneficiaryWomen).toBe("");
		expect(result.step3Data.beneficiaryMen).toBe("");
	});
});
