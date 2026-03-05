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
		await expect(buildPdfData("123456789", 2026)).rejects.toThrow(
			"Déclaration introuvable",
		);
	});

	it("throws when declaration is not submitted", async () => {
		resetMocks();
		queryResults.push([
			{ siren: "123456789", year: 2026, status: "draft" },
		]);

		const { buildPdfData } = await import("../buildPdfData");
		await expect(buildPdfData("123456789", 2026)).rejects.toThrow(
			"La déclaration n'est pas encore soumise",
		);
	});

	it("returns transformed data for a submitted declaration", async () => {
		resetMocks();
		queryResults.push([
			{
				siren: "123456789",
				year: 2026,
				status: "submitted",
				totalWomen: 50,
				totalMen: 60,
			},
		]);
		queryResults.push([{ siren: "123456789", name: "Acme Corp" }]);
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
			{
				step: 5,
				categoryName: "cat:0:name:Ingénieurs",
				womenCount: 5,
				menCount: 8,
				womenValue: "55000",
				menValue: "58000",
				womenMedianValue: null,
				menMedianValue: null,
			},
		]);

		const { buildPdfData } = await import("../buildPdfData");
		const result = await buildPdfData("123456789", 2026);

		expect(result.companyName).toBe("Acme Corp");
		expect(result.siren).toBe("123456789");
		expect(result.year).toBe(2026);
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

		expect(result.step5Categories).toHaveLength(1);
		expect(result.step5Categories[0]?.name).toBe("cat:0:name:Ingénieurs");
	});

	it("falls back to default company name when company not found", async () => {
		resetMocks();
		queryResults.push([
			{
				siren: "999999999",
				year: 2026,
				status: "submitted",
				totalWomen: null,
				totalMen: null,
			},
		]);
		queryResults.push([]);
		queryResults.push([]);

		const { buildPdfData } = await import("../buildPdfData");
		const result = await buildPdfData("999999999", 2026);

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
