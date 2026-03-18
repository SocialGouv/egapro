import { describe, expect, it } from "vitest";

import type {
	CategoryRow,
	CseRow,
	IndicatorGEntry,
} from "../fetchDeclarations";
import {
	assembleDeclaration,
	buildIndicatorG,
	buildIndicators,
} from "../fetchDeclarations";

const makeCategory = (
	step: number,
	name: string,
	womenValue: string | null = null,
	menValue: string | null = null,
	womenCount: number | null = null,
	menCount: number | null = null,
): CategoryRow => ({
	step,
	categoryName: name,
	womenValue,
	menValue,
	womenCount,
	menCount,
	womenMedianValue: null,
	menMedianValue: null,
});

describe("buildIndicators", () => {
	it("should split step 2 into A (means) and C (medians)", () => {
		const categories: CategoryRow[] = [
			makeCategory(2, "Annuelle brute moyenne", "35000", "38000"),
			makeCategory(2, "Horaire brute moyenne", "18.50", "19.20"),
			makeCategory(2, "Annuelle brute médiane", "33500", "36000"),
			makeCategory(2, "Horaire brute médiane", "17.80", "18.50"),
		];

		const result = buildIndicators(categories);

		expect(result.A).toHaveLength(2);
		expect(result.A[0]).toEqual({
			category: "Annuelle brute moyenne",
			womenValue: "35000",
			menValue: "38000",
		});
		expect(result.C).toHaveLength(2);
		expect(result.C[0]).toEqual({
			category: "Annuelle brute médiane",
			womenValue: "33500",
			menValue: "36000",
		});
	});

	it("should split step 3 into B (means), D (medians), E (beneficiaries)", () => {
		const categories: CategoryRow[] = [
			makeCategory(3, "Annuelle brute moyenne", "2500", "3200"),
			makeCategory(3, "Horaire brute moyenne", "1.30", "1.60"),
			makeCategory(3, "Annuelle brute médiane", "2200", "2800"),
			makeCategory(3, "Horaire brute médiane", "1.15", "1.40"),
			makeCategory(3, "Bénéficiaires", "95", "110"),
		];

		const result = buildIndicators(categories);

		expect(result.B).toHaveLength(2);
		expect(result.D).toHaveLength(2);
		expect(result.E).toHaveLength(1);
		expect(result.E[0]).toEqual({
			category: "Bénéficiaires",
			womenValue: "95",
			menValue: "110",
		});
	});

	it("should map step 4 to F with counts and threshold", () => {
		const categories: CategoryRow[] = [
			makeCategory(4, "annual:1er quartile", "22000", null, 35, 28),
			makeCategory(4, "hourly:4e quartile", "24.50", null, 27, 35),
		];

		const result = buildIndicators(categories);

		expect(result.F).toHaveLength(2);
		expect(result.F[0]).toEqual({
			category: "annual:1er quartile",
			womenCount: 35,
			menCount: 28,
			womenValue: "22000",
		});
	});

	it("should return empty arrays when no categories", () => {
		const result = buildIndicators([]);

		expect(result.A).toEqual([]);
		expect(result.B).toEqual([]);
		expect(result.C).toEqual([]);
		expect(result.D).toEqual([]);
		expect(result.E).toEqual([]);
		expect(result.F).toEqual([]);
	});
});

describe("buildIndicatorG", () => {
	it("should separate initial and correction entries", () => {
		const entries: IndicatorGEntry[] = [
			{
				categoryName: "Ouvriers",
				detail: "Opérateurs",
				declarationType: "initial",
				womenCount: 40,
				menCount: 45,
				annualBaseWomen: "24000",
				annualBaseMen: "25500",
				annualVariableWomen: "1200",
				annualVariableMen: "1500",
				hourlyBaseWomen: "12.50",
				hourlyBaseMen: "13.20",
				hourlyVariableWomen: "0.62",
				hourlyVariableMen: "0.78",
			},
			{
				categoryName: "Ouvriers",
				detail: "Opérateurs",
				declarationType: "correction",
				womenCount: 42,
				menCount: 44,
				annualBaseWomen: "24800",
				annualBaseMen: "25200",
				annualVariableWomen: "1350",
				annualVariableMen: "1400",
				hourlyBaseWomen: "12.90",
				hourlyBaseMen: "13.10",
				hourlyVariableWomen: "0.70",
				hourlyVariableMen: "0.73",
			},
		];

		const result = buildIndicatorG(entries);

		expect(result.initial).toHaveLength(1);
		expect(result.correction).toHaveLength(1);
		expect(result.initial[0]?.categoryName).toBe("Ouvriers");
		expect(result.initial[0]?.womenCount).toBe(40);
		expect(result.correction[0]?.womenCount).toBe(42);
	});

	it("should return empty arrays when no entries", () => {
		const result = buildIndicatorG([]);

		expect(result.initial).toEqual([]);
		expect(result.correction).toEqual([]);
	});
});

describe("assembleDeclaration", () => {
	const baseRow = {
		declarationId: "decl-1",
		siren: "123456789",
		year: 2027,
		status: "submitted",
		compliancePath: null,
		totalWomen: 100,
		totalMen: 150,
		secondDeclarationStatus: null,
		secondDeclReferencePeriodStart: null,
		secondDeclReferencePeriodEnd: null,
		createdAt: new Date("2027-03-15T10:00:00Z"),
		updatedAt: new Date("2027-03-15T12:00:00Z"),
		companyName: "ACME Corp",
		workforce: 250,
		nafCode: "62.02",
		address: "1 rue test",
		hasCse: true,
		declarantFirstName: "Jean",
		declarantLastName: "Dupont",
		declarantEmail: "jean@acme.fr",
		declarantPhone: "0612345678",
	};

	it("should assemble a full declaration with all sections", () => {
		const result = assembleDeclaration(baseRow, [], [], []);

		expect(result.siren).toBe("123456789");
		expect(result.companyName).toBe("ACME Corp");
		expect(result.declarant.email).toBe("jean@acme.fr");
		expect(result.indicators.G).toBeNull();
		expect(result.secondDeclaration.correction).toBeNull();
		expect(result.cseOpinions).toEqual([]);
		expect(result.createdAt).toBe("2027-03-15T10:00:00.000Z");
	});

	it("should include indicator G initial in indicators and correction in secondDeclaration", () => {
		const indicatorG: IndicatorGEntry[] = [
			{
				categoryName: "Cadres",
				detail: null,
				declarationType: "initial",
				womenCount: 50,
				menCount: 60,
				annualBaseWomen: "52000",
				annualBaseMen: "56000",
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			},
			{
				categoryName: "Cadres",
				detail: null,
				declarationType: "correction",
				womenCount: 52,
				menCount: 58,
				annualBaseWomen: "53000",
				annualBaseMen: "55000",
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			},
		];

		const result = assembleDeclaration(baseRow, [], indicatorG, []);

		expect(result.indicators.G).toHaveLength(1);
		expect(result.indicators.G?.[0]?.womenCount).toBe(50);
		expect(result.secondDeclaration.correction).toHaveLength(1);
		expect(result.secondDeclaration.correction?.[0]?.womenCount).toBe(52);
	});

	it("should map CSE opinions", () => {
		const opinions: CseRow[] = [
			{ type: "initial", opinion: "favorable", opinionDate: "2027-01-15" },
		];

		const result = assembleDeclaration(baseRow, [], [], opinions);

		expect(result.cseOpinions).toHaveLength(1);
		expect(result.cseOpinions[0]).toEqual({
			type: "initial",
			opinion: "favorable",
			date: "2027-01-15",
		});
	});

	it("should handle null dates", () => {
		const rowWithNullDates = { ...baseRow, createdAt: null, updatedAt: null };
		const result = assembleDeclaration(rowWithNullDates, [], [], []);

		expect(result.createdAt).toBeNull();
		expect(result.updatedAt).toBeNull();
	});
});
