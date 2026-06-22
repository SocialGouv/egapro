import { describe, expect, it } from "vitest";

import { computeIndicatorPercentages } from "../shared/computeIndicatorPercentages";

const nominalRow = {
	indicatorAAnnualWomen: "100",
	indicatorAAnnualMen: "110",
	indicatorAHourlyWomen: "20",
	indicatorAHourlyMen: "22",
	indicatorBAnnualWomen: "50",
	indicatorBAnnualMen: "55",
	indicatorBHourlyWomen: "10",
	indicatorBHourlyMen: "11",
	indicatorCAnnualWomen: "95",
	indicatorCAnnualMen: "105",
	indicatorCHourlyWomen: "18",
	indicatorCHourlyMen: "20",
	indicatorDAnnualWomen: "45",
	indicatorDAnnualMen: "50",
	indicatorDHourlyWomen: "9",
	indicatorDHourlyMen: "10",
	indicatorEWomen: "30",
	indicatorEMen: "70",
	indicatorFAnnualWomen1: 10,
	indicatorFAnnualWomen2: 20,
	indicatorFAnnualWomen3: 30,
	indicatorFAnnualWomen4: 40,
	indicatorFAnnualMen1: 90,
	indicatorFAnnualMen2: 80,
	indicatorFAnnualMen3: 70,
	indicatorFAnnualMen4: 60,
	indicatorFHourlyWomen1: 5,
	indicatorFHourlyWomen2: 15,
	indicatorFHourlyWomen3: 25,
	indicatorFHourlyWomen4: 35,
	indicatorFHourlyMen1: 95,
	indicatorFHourlyMen2: 85,
	indicatorFHourlyMen3: 75,
	indicatorFHourlyMen4: 65,
};

describe("computeIndicatorPercentages", () => {
	describe("S1 — nominal case, all values present", () => {
		it("computes globalAnnualMeanGap correctly", () => {
			const result = computeIndicatorPercentages(nominalRow);
			expect(result.globalAnnualMeanGap).toBeCloseTo((110 - 100) / 110);
		});

		it("computes all 8 gaps with no nulls", () => {
			const result = computeIndicatorPercentages(nominalRow);
			expect(result.globalAnnualMeanGap).not.toBeNull();
			expect(result.globalHourlyMeanGap).not.toBeNull();
			expect(result.variableAnnualMeanGap).not.toBeNull();
			expect(result.variableHourlyMeanGap).not.toBeNull();
			expect(result.globalAnnualMedianGap).not.toBeNull();
			expect(result.globalHourlyMedianGap).not.toBeNull();
			expect(result.variableAnnualMedianGap).not.toBeNull();
			expect(result.variableHourlyMedianGap).not.toBeNull();
		});

		it("computes variableProportionWomen and variableProportionMen", () => {
			const result = computeIndicatorPercentages(nominalRow);
			expect(result.variableProportionWomen).toBeCloseTo(30 / 100);
			expect(result.variableProportionMen).toBeCloseTo(70 / 100);
		});

		it("computes annual quartile 1 proportions", () => {
			const result = computeIndicatorPercentages(nominalRow);
			expect(result.annualQuartile1ProportionWomen).toBeCloseTo(10 / 100);
			expect(result.annualQuartile1ProportionMen).toBeCloseTo(90 / 100);
		});

		it("computes all 16 F proportions with no nulls", () => {
			const result = computeIndicatorPercentages(nominalRow);
			expect(result.annualQuartile1ProportionWomen).not.toBeNull();
			expect(result.annualQuartile2ProportionWomen).not.toBeNull();
			expect(result.annualQuartile3ProportionWomen).not.toBeNull();
			expect(result.annualQuartile4ProportionWomen).not.toBeNull();
			expect(result.annualQuartile1ProportionMen).not.toBeNull();
			expect(result.annualQuartile2ProportionMen).not.toBeNull();
			expect(result.annualQuartile3ProportionMen).not.toBeNull();
			expect(result.annualQuartile4ProportionMen).not.toBeNull();
			expect(result.hourlyQuartile1ProportionWomen).not.toBeNull();
			expect(result.hourlyQuartile2ProportionWomen).not.toBeNull();
			expect(result.hourlyQuartile3ProportionWomen).not.toBeNull();
			expect(result.hourlyQuartile4ProportionWomen).not.toBeNull();
			expect(result.hourlyQuartile1ProportionMen).not.toBeNull();
			expect(result.hourlyQuartile2ProportionMen).not.toBeNull();
			expect(result.hourlyQuartile3ProportionMen).not.toBeNull();
			expect(result.hourlyQuartile4ProportionMen).not.toBeNull();
		});
	});

	describe("S3 (révisé) — signed ratio for 4.5% gap", () => {
		it("globalAnnualMeanGap is positive ratio when men > women", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorAAnnualWomen: "105",
				indicatorAAnnualMen: "110",
			});
			expect(result.globalAnnualMeanGap).toBeCloseTo((110 - 105) / 110);
		});
	});

	describe("S4 — NULL inputs yield NULL outputs", () => {
		it("returns null for globalAnnualMeanGap when women is null", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorAAnnualWomen: null,
			});
			expect(result.globalAnnualMeanGap).toBeNull();
		});

		it("returns null for globalAnnualMeanGap when men is null", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorAAnnualMen: null,
			});
			expect(result.globalAnnualMeanGap).toBeNull();
		});

		it("other gaps remain computed when one gap has null inputs", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorAAnnualWomen: null,
			});
			expect(result.globalHourlyMeanGap).not.toBeNull();
			expect(result.variableAnnualMeanGap).not.toBeNull();
		});

		it("returns null proportions for quartile with total zero", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorFAnnualWomen1: 0,
				indicatorFAnnualMen1: 0,
			});
			expect(result.annualQuartile1ProportionWomen).toBeNull();
			expect(result.annualQuartile1ProportionMen).toBeNull();
		});

		it("other quartile proportions remain when one quartile is zero total", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorFAnnualWomen1: 0,
				indicatorFAnnualMen1: 0,
			});
			expect(result.annualQuartile2ProportionWomen).not.toBeNull();
		});

		it("returns null E proportions when total is zero", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorEWomen: "0",
				indicatorEMen: "0",
			});
			expect(result.variableProportionWomen).toBeNull();
			expect(result.variableProportionMen).toBeNull();
		});

		it("returns null for F proportions when count inputs are null", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorFAnnualWomen1: null,
			});
			expect(result.annualQuartile1ProportionWomen).toBeNull();
			expect(result.annualQuartile1ProportionMen).toBeNull();
		});

		it("returns null E proportions when women count is null", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorEWomen: null,
			});
			expect(result.variableProportionWomen).toBeNull();
			expect(result.variableProportionMen).toBeNull();
		});

		it("returns null E proportions when men count is null", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorEMen: null,
			});
			expect(result.variableProportionWomen).toBeNull();
			expect(result.variableProportionMen).toBeNull();
		});

		it("returns null E proportions for non-numeric string inputs", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorEWomen: "abc",
			});
			expect(result.variableProportionWomen).toBeNull();
			expect(result.variableProportionMen).toBeNull();
		});
	});

	describe("sign — negative gap when women earn more", () => {
		it("variableAnnualMeanGap is negative when women > men", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorBAnnualWomen: "120",
				indicatorBAnnualMen: "100",
			});
			expect(result.variableAnnualMeanGap).toBeCloseTo(-0.2);
		});
	});

	describe("rounding — F proportions rounded to 4 decimal places", () => {
		it("proportion of 1/3 rounds to 0.3333", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorFAnnualWomen1: 1,
				indicatorFAnnualMen1: 2,
			});
			expect(result.annualQuartile1ProportionWomen).toBe(0.3333);
		});

		it("proportion of 2/3 rounds to 0.6667", () => {
			const result = computeIndicatorPercentages({
				...nominalRow,
				indicatorFAnnualWomen1: 1,
				indicatorFAnnualMen1: 2,
			});
			expect(result.annualQuartile1ProportionMen).toBe(0.6667);
		});
	});
});
