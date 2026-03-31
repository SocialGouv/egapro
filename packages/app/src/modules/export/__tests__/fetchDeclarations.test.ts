import { describe, expect, it } from "vitest";

import type { CseRow, IndicatorGEntry } from "../fetchDeclarations";
import {
	assembleDeclaration,
	buildIndicatorG,
	buildIndicators,
} from "../fetchDeclarations";

// Minimal DeclarationRow used by buildIndicators / assembleDeclaration
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
	// Indicator A
	indicatorAAnnualWomen: "35000",
	indicatorAAnnualMen: "38000",
	indicatorAHourlyWomen: "18.50",
	indicatorAHourlyMen: "19.20",
	// Indicator B
	indicatorBAnnualWomen: "2500",
	indicatorBAnnualMen: "3200",
	indicatorBHourlyWomen: "1.30",
	indicatorBHourlyMen: "1.60",
	// Indicator C
	indicatorCAnnualWomen: "33500",
	indicatorCAnnualMen: "36000",
	indicatorCHourlyWomen: "17.80",
	indicatorCHourlyMen: "18.50",
	// Indicator D
	indicatorDAnnualWomen: "2200",
	indicatorDAnnualMen: "2800",
	indicatorDHourlyWomen: "1.15",
	indicatorDHourlyMen: "1.40",
	// Indicator E
	indicatorEWomen: "95",
	indicatorEMen: "110",
	// Indicator F — annual
	indicatorFAnnualThreshold1: "22000",
	indicatorFAnnualWomen1: 35,
	indicatorFAnnualMen1: 28,
	indicatorFAnnualThreshold2: "28000",
	indicatorFAnnualWomen2: 30,
	indicatorFAnnualMen2: 32,
	indicatorFAnnualThreshold3: "36000",
	indicatorFAnnualWomen3: 28,
	indicatorFAnnualMen3: 33,
	indicatorFAnnualThreshold4: null,
	indicatorFAnnualWomen4: 27,
	indicatorFAnnualMen4: 35,
	// Indicator F — hourly
	indicatorFHourlyThreshold1: "11.50",
	indicatorFHourlyWomen1: 40,
	indicatorFHourlyMen1: 25,
	indicatorFHourlyThreshold2: "14.00",
	indicatorFHourlyWomen2: 32,
	indicatorFHourlyMen2: 30,
	indicatorFHourlyThreshold3: "18.00",
	indicatorFHourlyWomen3: 28,
	indicatorFHourlyMen3: 33,
	indicatorFHourlyThreshold4: null,
	indicatorFHourlyWomen4: 20,
	indicatorFHourlyMen4: 37,
};

describe("buildIndicators", () => {
	it("should map indicator A columns", () => {
		const result = buildIndicators(baseRow);

		expect(result.A.annualWomen).toBe("35000");
		expect(result.A.annualMen).toBe("38000");
		expect(result.A.hourlyWomen).toBe("18.50");
		expect(result.A.hourlyMen).toBe("19.20");
	});

	it("should map indicator B columns", () => {
		const result = buildIndicators(baseRow);

		expect(result.B.annualWomen).toBe("2500");
		expect(result.B.annualMen).toBe("3200");
	});

	it("should map indicator C and D columns", () => {
		const result = buildIndicators(baseRow);

		expect(result.C.annualWomen).toBe("33500");
		expect(result.D.hourlyMen).toBe("1.40");
	});

	it("should map indicator E columns", () => {
		const result = buildIndicators(baseRow);

		expect(result.E.women).toBe("95");
		expect(result.E.men).toBe("110");
	});

	it("should map indicator F quartiles with 4 entries per period", () => {
		const result = buildIndicators(baseRow);

		expect(result.F.annual).toHaveLength(4);
		expect(result.F.annual[0]).toEqual({
			threshold: "22000",
			women: 35,
			men: 28,
		});
		expect(result.F.annual[3]).toEqual({
			threshold: null,
			women: 27,
			men: 35,
		});
		expect(result.F.hourly).toHaveLength(4);
		expect(result.F.hourly[0]).toEqual({
			threshold: "11.50",
			women: 40,
			men: 25,
		});
	});

	it("should handle all null indicator columns gracefully", () => {
		const nullRow = {
			...baseRow,
			indicatorAAnnualWomen: null,
			indicatorAAnnualMen: null,
			indicatorAHourlyWomen: null,
			indicatorAHourlyMen: null,
			indicatorEWomen: null,
			indicatorEMen: null,
			indicatorFAnnualThreshold1: null,
			indicatorFAnnualWomen1: null,
			indicatorFAnnualMen1: null,
			indicatorFHourlyThreshold1: null,
			indicatorFHourlyWomen1: null,
			indicatorFHourlyMen1: null,
		};

		const result = buildIndicators(nullRow);

		expect(result.A.annualWomen).toBeNull();
		expect(result.E.women).toBeNull();
		expect(result.F.annual[0]).toEqual({
			threshold: null,
			women: null,
			men: null,
		});
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
	it("should assemble a full declaration with all sections", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.siren).toBe("123456789");
		expect(result.companyName).toBe("ACME Corp");
		expect(result.declarant.email).toBe("jean@acme.fr");
		expect(result.indicators.G).toBeNull();
		expect(result.secondDeclaration.correction).toBeNull();
		expect(result.cseOpinions).toEqual([]);
		expect(result.createdAt).toBe("2027-03-15T10:00:00.000Z");
	});

	it("should include indicator A–F values from declaration columns", () => {
		const result = assembleDeclaration(baseRow, [], []);

		expect(result.indicators.A.annualWomen).toBe("35000");
		expect(result.indicators.B.hourlyMen).toBe("1.60");
		expect(result.indicators.E.women).toBe("95");
		expect(result.indicators.F.annual).toHaveLength(4);
		expect(result.indicators.F.annual[0]?.threshold).toBe("22000");
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

		const result = assembleDeclaration(baseRow, indicatorG, []);

		expect(result.indicators.G).toHaveLength(1);
		expect(result.indicators.G?.[0]?.womenCount).toBe(50);
		expect(result.secondDeclaration.correction).toHaveLength(1);
		expect(result.secondDeclaration.correction?.[0]?.womenCount).toBe(52);
	});

	it("should map CSE opinions", () => {
		const opinions: CseRow[] = [
			{ type: "initial", opinion: "favorable", opinionDate: "2027-01-15" },
		];

		const result = assembleDeclaration(baseRow, [], opinions);

		expect(result.cseOpinions).toHaveLength(1);
		expect(result.cseOpinions[0]).toEqual({
			type: "initial",
			opinion: "favorable",
			date: "2027-01-15",
		});
	});

	it("should handle null dates", () => {
		const rowWithNullDates = { ...baseRow, createdAt: null, updatedAt: null };
		const result = assembleDeclaration(rowWithNullDates, [], []);

		expect(result.createdAt).toBeNull();
		expect(result.updatedAt).toBeNull();
	});
});
