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
				// Indicator A (step 2 — mean)
				indicatorAAnnualWomen: "45000",
				indicatorAAnnualMen: "50000",
				indicatorAHourlyWomen: "22",
				indicatorAHourlyMen: "24",
				// Indicator C (step 2 — median)
				indicatorCAnnualWomen: "44000",
				indicatorCAnnualMen: "49000",
				indicatorCHourlyWomen: "21",
				indicatorCHourlyMen: "23",
				// Indicator B (step 3 — variable mean)
				indicatorBAnnualWomen: "5000",
				indicatorBAnnualMen: "6000",
				indicatorBHourlyWomen: "2",
				indicatorBHourlyMen: "3",
				// Indicator D (step 3 — variable median)
				indicatorDAnnualWomen: "4800",
				indicatorDAnnualMen: "5800",
				indicatorDHourlyWomen: "1.9",
				indicatorDHourlyMen: "2.9",
				// Indicator E (step 3 — beneficiaries)
				indicatorEWomen: "80",
				indicatorEMen: "75",
				// Indicator F annual (step 4)
				indicatorFAnnualThreshold1: "40000",
				indicatorFAnnualThreshold2: "50000",
				indicatorFAnnualThreshold3: "60000",
				indicatorFAnnualThreshold4: "70000",
				indicatorFAnnualWomen1: 10,
				indicatorFAnnualWomen2: 12,
				indicatorFAnnualWomen3: 14,
				indicatorFAnnualWomen4: 14,
				indicatorFAnnualMen1: 15,
				indicatorFAnnualMen2: 13,
				indicatorFAnnualMen3: 12,
				indicatorFAnnualMen4: 10,
				// Indicator F hourly (step 4)
				indicatorFHourlyThreshold1: null,
				indicatorFHourlyThreshold2: null,
				indicatorFHourlyThreshold3: null,
				indicatorFHourlyThreshold4: null,
				indicatorFHourlyWomen1: null,
				indicatorFHourlyWomen2: null,
				indicatorFHourlyWomen3: null,
				indicatorFHourlyWomen4: null,
				indicatorFHourlyMen1: null,
				indicatorFHourlyMen2: null,
				indicatorFHourlyMen3: null,
				indicatorFHourlyMen4: null,
			},
		]);
		// Query 2: companies
		queryResults.push([{ siren: "123456789", name: "Acme Corp" }]);
		// Query 3: jobCategories (empty — mapToEmployeeCategoryRows is mocked)
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

		// step1Categories is empty: per-category workforce breakdown is not stored in flat columns
		expect(result.step1Categories).toEqual([]);

		expect(result.step2Rows).toEqual([
			{
				label: "Annuelle brute moyenne",
				womenValue: "45000",
				menValue: "50000",
			},
			{ label: "Horaire brute moyenne", womenValue: "22", menValue: "24" },
			{
				label: "Annuelle brute médiane",
				womenValue: "44000",
				menValue: "49000",
			},
			{ label: "Horaire brute médiane", womenValue: "21", menValue: "23" },
		]);

		expect(result.step3Data.beneficiaryWomen).toBe("80");
		expect(result.step3Data.beneficiaryMen).toBe("75");
		expect(result.step3Data.rows).toEqual([
			{ label: "Annuelle brute moyenne", womenValue: "5000", menValue: "6000" },
			{ label: "Horaire brute moyenne", womenValue: "2", menValue: "3" },
			{ label: "Annuelle brute médiane", womenValue: "4800", menValue: "5800" },
			{ label: "Horaire brute médiane", womenValue: "1.9", menValue: "2.9" },
		]);

		expect(result.step4Categories).toEqual([
			{
				name: "annual:1er quartile",
				womenCount: 10,
				menCount: 15,
				womenValue: "40000",
			},
			{
				name: "annual:2e quartile",
				womenCount: 12,
				menCount: 13,
				womenValue: "50000",
			},
			{
				name: "annual:3e quartile",
				womenCount: 14,
				menCount: 12,
				womenValue: "60000",
			},
			{
				name: "annual:4e quartile",
				womenCount: 14,
				menCount: 10,
				womenValue: "70000",
			},
			{
				name: "hourly:1er quartile",
				womenCount: undefined,
				menCount: undefined,
				womenValue: undefined,
			},
			{
				name: "hourly:2e quartile",
				womenCount: undefined,
				menCount: undefined,
				womenValue: undefined,
			},
			{
				name: "hourly:3e quartile",
				womenCount: undefined,
				menCount: undefined,
				womenValue: undefined,
			},
			{
				name: "hourly:4e quartile",
				womenCount: undefined,
				menCount: undefined,
				womenValue: undefined,
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
		// Query 3: jobCategories (empty)
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
		expect(result.step2Rows).toEqual([
			{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
			{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
			{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
			{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
		]);
		expect(result.step3Data.rows).toEqual([
			{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
			{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
			{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
			{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
		]);
		expect(result.step3Data.beneficiaryWomen).toBe("");
		expect(result.step3Data.beneficiaryMen).toBe("");
	});
});
