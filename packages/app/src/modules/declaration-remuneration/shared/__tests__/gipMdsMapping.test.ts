import { describe, expect, it } from "vitest";
import {
	DIVERGENT_HOURLY_MEDIAN,
	makeGipRow,
	nullGipStep2,
	nullGipStep3,
} from "~/test/gipGapFixtures";
import type { GipMdsRow } from "../gipMdsMapping";
import { mapGipToFormData } from "../gipMdsMapping";

/** Row from the bug report: 37 F / 33 H annual, 34 F / 32 H hourly, all nb set. */
function makeBugRepoRow(): GipMdsRow {
	return makeGipRow({
		womenCountAnnualGlobal: "37",
		menCountAnnualGlobal: "33",
		womenCountHourlyGlobal: "34",
		menCountHourlyGlobal: "32",
		annualQuartileThreshold1: "25000",
		annualQuartileThreshold2: "30000",
		annualQuartileThreshold3: "35000",
		annualQuartile1WomenCount: "11",
		annualQuartile2WomenCount: "10",
		annualQuartile3WomenCount: "8",
		annualQuartile4WomenCount: "8",
		annualQuartile1MenCount: "7",
		annualQuartile2MenCount: "8",
		annualQuartile3MenCount: "9",
		annualQuartile4MenCount: "9",
		hourlyQuartileThreshold1: "13.74",
		hourlyQuartileThreshold2: "17.58",
		hourlyQuartileThreshold3: "21.98",
		hourlyQuartile1WomenCount: "10",
		hourlyQuartile2WomenCount: "9",
		hourlyQuartile3WomenCount: "8",
		hourlyQuartile4WomenCount: "7",
		hourlyQuartile1MenCount: "8",
		hourlyQuartile2MenCount: "8",
		hourlyQuartile3MenCount: "8",
		hourlyQuartile4MenCount: "8",
	});
}

function sum(values: Array<number | null>): number {
	return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

describe("mapGipToFormData", () => {
	it("returns null when input is null", () => {
		expect(mapGipToFormData(null)).toBeNull();
	});

	it("maps step1 workforce from the annual and hourly global counts", () => {
		const row = makeGipRow({
			womenCountAnnualGlobal: "120.5",
			menCountAnnualGlobal: "80.3",
			womenCountHourlyGlobal: "118.4",
			menCountHourlyGlobal: "79.6",
		});
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: 121,
			totalMen: 80,
			hourlyWomen: 118,
			hourlyMen: 80,
		});
	});

	it("returns null workforce when values are null", () => {
		const row = makeGipRow();
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: null,
			totalMen: null,
			hourlyWomen: null,
			hourlyMen: null,
		});
	});

	it("maps step2 pay gap (indicators A+C) with each block's GIP gap", () => {
		const row = makeGipRow({
			globalAnnualMeanWomen: "35000.00",
			globalAnnualMeanMen: "38000.00",
			globalAnnualMeanGap: "0.0789",
			globalHourlyMeanWomen: "18.50",
			globalHourlyMeanMen: "20.00",
			globalHourlyMeanGap: "0.0750",
			globalAnnualMedianWomen: "33000.00",
			globalAnnualMedianMen: "36000.00",
			globalAnnualMedianGap: "0.0833",
			globalHourlyMedianWomen: "17.50",
			globalHourlyMedianMen: "19.00",
			globalHourlyMedianGap: "0.0789",
		});
		const result = mapGipToFormData(row);
		expect(result?.step2).toEqual({
			annualMeanWomen: "35000.00",
			annualMeanMen: "38000.00",
			annualMeanGap: "0.0789",
			hourlyMeanWomen: "18.50",
			hourlyMeanMen: "20.00",
			hourlyMeanGap: "0.0750",
			annualMedianWomen: "33000.00",
			annualMedianMen: "36000.00",
			annualMedianGap: "0.0833",
			hourlyMedianWomen: "17.50",
			hourlyMedianMen: "19.00",
			hourlyMedianGap: "0.0789",
		});
	});

	it("maps step3 variable pay (indicators B+D+E) with each block's GIP gap", () => {
		const row = makeGipRow({
			variableAnnualMeanWomen: "5000.00",
			variableAnnualMeanMen: "7000.00",
			variableAnnualMeanGap: "0.2857",
			variableHourlyMeanWomen: "2.50",
			variableHourlyMeanMen: "3.50",
			variableHourlyMeanGap: "0.2857",
			variableAnnualMedianWomen: "4000.00",
			variableAnnualMedianMen: "6000.00",
			variableAnnualMedianGap: "0.3333",
			variableHourlyMedianWomen: "2.00",
			variableHourlyMedianMen: "3.00",
			variableHourlyMedianGap: "0.3333",
			womenCountAnnualVariable: "90.2",
			menCountAnnualVariable: "70.8",
		});
		const result = mapGipToFormData(row);
		expect(result?.step3).toEqual({
			annualMeanWomen: "5000.00",
			annualMeanMen: "7000.00",
			annualMeanGap: "0.2857",
			hourlyMeanWomen: "2.50",
			hourlyMeanMen: "3.50",
			hourlyMeanGap: "0.2857",
			annualMedianWomen: "4000.00",
			annualMedianMen: "6000.00",
			annualMedianGap: "0.3333",
			hourlyMedianWomen: "2.00",
			hourlyMedianMen: "3.00",
			hourlyMedianGap: "0.3333",
			beneficiaryCountWomen: 90,
			beneficiaryCountMen: 71,
		});
	});

	it("carries the GIP gap even when it diverges from the rounded operands", () => {
		const row = makeGipRow({
			variableHourlyMedianWomen: DIVERGENT_HOURLY_MEDIAN.women,
			variableHourlyMedianMen: DIVERGENT_HOURLY_MEDIAN.men,
			variableHourlyMedianGap: DIVERGENT_HOURLY_MEDIAN.gap,
		});
		const result = mapGipToFormData(row);
		expect(result?.step3.hourlyMedianGap).toBe(DIVERGENT_HOURLY_MEDIAN.gap);
	});

	it("reads step4 quartile counts verbatim from the GIP nb columns", () => {
		const result = mapGipToFormData(makeBugRepoRow());
		expect(result?.step4.annual.thresholds).toEqual([
			"25000",
			"30000",
			"35000",
		]);
		// nb columns are the source of truth: never the proportion-derived 42/30
		expect(result?.step4.annual.womenCounts).toEqual([11, 10, 8, 8]);
		expect(result?.step4.annual.menCounts).toEqual([7, 8, 9, 9]);
		expect(result?.step4.hourly.womenCounts).toEqual([10, 9, 8, 7]);
		expect(result?.step4.hourly.menCounts).toEqual([8, 8, 8, 8]);
	});

	it("sums each table's counts back to its own reference headcount", () => {
		const result = mapGipToFormData(makeBugRepoRow());
		const annual = result?.step4.annual;
		const hourly = result?.step4.hourly;
		expect(sum(annual?.womenCounts ?? [])).toBe(annual?.referenceWomen);
		expect(sum(annual?.menCounts ?? [])).toBe(annual?.referenceMen);
		expect(sum(hourly?.womenCounts ?? [])).toBe(hourly?.referenceWomen);
		expect(sum(hourly?.menCounts ?? [])).toBe(hourly?.referenceMen);
	});

	it("exposes a distinct reference headcount per table (annual vs hourly)", () => {
		const result = mapGipToFormData(makeBugRepoRow());
		expect(result?.step4.annual.referenceWomen).toBe(37);
		expect(result?.step4.annual.referenceMen).toBe(33);
		expect(result?.step4.hourly.referenceWomen).toBe(34);
		expect(result?.step4.hourly.referenceMen).toBe(32);
	});

	it("leaves quartile cells empty when the GIP row has no nb columns (no proportion fallback)", () => {
		const row = makeGipRow({
			womenCountAnnualGlobal: "100",
			menCountAnnualGlobal: "100",
			annualQuartileThreshold1: "25000",
			// proportions present but nb absent: must NOT be recomputed from proportions
			annualQuartile1ProportionWomen: "0.6",
			annualQuartile1ProportionMen: "0.4",
		});
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts).toEqual([null, null, null, null]);
		expect(result?.step4.annual.menCounts).toEqual([null, null, null, null]);
		expect(result?.step4.hourly.womenCounts).toEqual([null, null, null, null]);
		expect(result?.step4.hourly.menCounts).toEqual([null, null, null, null]);
	});

	it("keeps a partially filled nb column as-is (only the filled cells)", () => {
		const row = makeGipRow({
			annualQuartile1WomenCount: "11",
			annualQuartile2WomenCount: "10",
			annualQuartile1MenCount: "7",
		});
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts).toEqual([11, 10, null, null]);
		expect(result?.step4.annual.menCounts).toEqual([7, null, null, null]);
	});

	it("rounds a non-integer nb value to the nearest integer", () => {
		const row = makeGipRow({ annualQuartile1WomenCount: "10.6" });
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts[0]).toBe(11);
	});

	it("returns null count for a non-numeric nb value (toInt NaN branch)", () => {
		const row = makeGipRow({ annualQuartile1WomenCount: "N/A" });
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts[0]).toBeNull();
	});

	it("returns null reference headcount when the block's global counts are null", () => {
		const row = makeGipRow();
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.referenceWomen).toBeNull();
		expect(result?.step4.annual.referenceMen).toBeNull();
		expect(result?.step4.hourly.referenceWomen).toBeNull();
		expect(result?.step4.hourly.referenceMen).toBeNull();
	});

	it("returns 3-element thresholds tuple (Q1-Q3 only, no Q4)", () => {
		const row = makeGipRow({
			annualQuartileThreshold1: "25000",
			annualQuartileThreshold2: "32000",
			annualQuartileThreshold3: "40000",
		});
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.thresholds).toEqual([
			"25000",
			"32000",
			"40000",
		]);
	});

	it("maps confidence index and period end", () => {
		const row = makeGipRow({
			confidenceIndex: "0.85",
			periodEnd: "2026-12-31",
		});
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("0.85");
		expect(result?.periodEnd).toBe("2026-12-31");
	});

	it("returns all null step2 fields when row has no indicator A/C data", () => {
		const row = makeGipRow();
		const result = mapGipToFormData(row);
		expect(result?.step2).toEqual(nullGipStep2());
	});

	it("returns all null step3 fields when row has no indicator B/D/E data", () => {
		const row = makeGipRow();
		const result = mapGipToFormData(row);
		expect(result?.step3).toEqual(nullGipStep3());
	});

	it("handles zero workforce for variable pay beneficiaries", () => {
		const row = makeGipRow({
			womenCountAnnualVariable: "0",
			menCountAnnualVariable: "0",
		});
		const result = mapGipToFormData(row);
		expect(result?.step3.beneficiaryCountWomen).toBe(0);
		expect(result?.step3.beneficiaryCountMen).toBe(0);
	});

	it("maps step1 with zero workforce", () => {
		const row = makeGipRow({
			womenCountAnnualGlobal: "0",
			menCountAnnualGlobal: "180",
			womenCountHourlyGlobal: "0",
			menCountHourlyGlobal: "178",
		});
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: 0,
			totalMen: 180,
			hourlyWomen: 0,
			hourlyMen: 178,
		});
	});

	it("handles confidence index at 0", () => {
		const row = makeGipRow({ confidenceIndex: "0" });
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("0");
	});

	it("handles confidence index at 1", () => {
		const row = makeGipRow({ confidenceIndex: "1" });
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("1");
	});

	it("returns null for non-numeric workforce string (toInt NaN branch)", () => {
		const row = makeGipRow({ womenCountAnnualGlobal: "N/A" });
		const result = mapGipToFormData(row);
		expect(result?.step1.totalWomen).toBeNull();
	});
});
