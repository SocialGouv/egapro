import { describe, expect, it } from "vitest";
import type { GipMdsRow } from "../gipMdsMapping";
import { mapGipToFormData } from "../gipMdsMapping";

/** Minimal GipMdsRow with all fields null except the ones we set. */
function makeRow(overrides: Partial<GipMdsRow> = {}): GipMdsRow {
	return {
		siren: "123456789",
		year: 2026,
		importedAt: null,
		periodStart: "2026-01-01",
		periodEnd: "2026-12-31",
		workforceEma: null,
		menCountAnnualGlobal: null,
		womenCountAnnualGlobal: null,
		menCountHourlyGlobal: null,
		womenCountHourlyGlobal: null,
		menCountAnnualVariable: null,
		womenCountAnnualVariable: null,
		globalAnnualMeanGap: null,
		globalAnnualMeanWomen: null,
		globalAnnualMeanMen: null,
		globalHourlyMeanGap: null,
		globalHourlyMeanWomen: null,
		globalHourlyMeanMen: null,
		variableAnnualMeanGap: null,
		variableAnnualMeanWomen: null,
		variableAnnualMeanMen: null,
		variableHourlyMeanGap: null,
		variableHourlyMeanWomen: null,
		variableHourlyMeanMen: null,
		globalAnnualMedianGap: null,
		globalAnnualMedianWomen: null,
		globalAnnualMedianMen: null,
		globalHourlyMedianGap: null,
		globalHourlyMedianWomen: null,
		globalHourlyMedianMen: null,
		variableAnnualMedianGap: null,
		variableAnnualMedianWomen: null,
		variableAnnualMedianMen: null,
		variableHourlyMedianGap: null,
		variableHourlyMedianWomen: null,
		variableHourlyMedianMen: null,
		variableProportionWomen: null,
		variableProportionMen: null,
		annualQuartileThreshold1: null,
		annualQuartileThreshold2: null,
		annualQuartileThreshold3: null,
		annualQuartile1ProportionWomen: null,
		annualQuartile2ProportionWomen: null,
		annualQuartile3ProportionWomen: null,
		annualQuartile4ProportionWomen: null,
		annualQuartile1ProportionMen: null,
		annualQuartile2ProportionMen: null,
		annualQuartile3ProportionMen: null,
		annualQuartile4ProportionMen: null,
		annualQuartile1WomenCount: null,
		annualQuartile2WomenCount: null,
		annualQuartile3WomenCount: null,
		annualQuartile4WomenCount: null,
		annualQuartile1MenCount: null,
		annualQuartile2MenCount: null,
		annualQuartile3MenCount: null,
		annualQuartile4MenCount: null,
		hourlyQuartileThreshold1: null,
		hourlyQuartileThreshold2: null,
		hourlyQuartileThreshold3: null,
		hourlyQuartile1ProportionWomen: null,
		hourlyQuartile2ProportionWomen: null,
		hourlyQuartile3ProportionWomen: null,
		hourlyQuartile4ProportionWomen: null,
		hourlyQuartile1ProportionMen: null,
		hourlyQuartile2ProportionMen: null,
		hourlyQuartile3ProportionMen: null,
		hourlyQuartile4ProportionMen: null,
		hourlyQuartile1WomenCount: null,
		hourlyQuartile2WomenCount: null,
		hourlyQuartile3WomenCount: null,
		hourlyQuartile4WomenCount: null,
		hourlyQuartile1MenCount: null,
		hourlyQuartile2MenCount: null,
		hourlyQuartile3MenCount: null,
		hourlyQuartile4MenCount: null,
		confidenceIndex: null,
		confidenceExoticContracts: null,
		confidenceUnitMeasure: null,
		confidenceSuspensionRatio: null,
		confidenceLongSuspensions: null,
		confidenceNoEndSuspensions: null,
		confidenceSickLeaveRatio: null,
		confidenceLongSickLeave: null,
		confidenceNoSickLeave: null,
		confidenceQuota250: null,
		confidenceQuota0: null,
		confidenceMultiYear: null,
		confidenceFpRatio: null,
		confidenceExtremeRemuneration: null,
		confidenceExtremeRate: null,
		...overrides,
	};
}

/** Row from the bug report: 37 F / 33 H annual, 34 F / 32 H hourly, all nb set. */
function makeBugRepoRow(): GipMdsRow {
	return makeRow({
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

	it("maps step1 workforce from annual global counts", () => {
		const row = makeRow({
			womenCountAnnualGlobal: "120.5",
			menCountAnnualGlobal: "80.3",
		});
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: 121,
			totalMen: 80,
		});
	});

	it("returns null workforce when values are null", () => {
		const row = makeRow();
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: null,
			totalMen: null,
		});
	});

	it("maps step2 pay gap (indicators A+C)", () => {
		const row = makeRow({
			globalAnnualMeanWomen: "35000.00",
			globalAnnualMeanMen: "38000.00",
			globalHourlyMeanWomen: "18.50",
			globalHourlyMeanMen: "20.00",
			globalAnnualMedianWomen: "33000.00",
			globalAnnualMedianMen: "36000.00",
			globalHourlyMedianWomen: "17.50",
			globalHourlyMedianMen: "19.00",
		});
		const result = mapGipToFormData(row);
		expect(result?.step2).toEqual({
			annualMeanWomen: "35000.00",
			annualMeanMen: "38000.00",
			hourlyMeanWomen: "18.50",
			hourlyMeanMen: "20.00",
			annualMedianWomen: "33000.00",
			annualMedianMen: "36000.00",
			hourlyMedianWomen: "17.50",
			hourlyMedianMen: "19.00",
		});
	});

	it("maps step3 variable pay (indicators B+D+E)", () => {
		const row = makeRow({
			variableAnnualMeanWomen: "5000.00",
			variableAnnualMeanMen: "7000.00",
			variableHourlyMeanWomen: "2.50",
			variableHourlyMeanMen: "3.50",
			variableAnnualMedianWomen: "4000.00",
			variableAnnualMedianMen: "6000.00",
			variableHourlyMedianWomen: "2.00",
			variableHourlyMedianMen: "3.00",
			womenCountAnnualVariable: "90.2",
			menCountAnnualVariable: "70.8",
		});
		const result = mapGipToFormData(row);
		expect(result?.step3).toEqual({
			annualMeanWomen: "5000.00",
			annualMeanMen: "7000.00",
			hourlyMeanWomen: "2.50",
			hourlyMeanMen: "3.50",
			annualMedianWomen: "4000.00",
			annualMedianMen: "6000.00",
			hourlyMedianWomen: "2.00",
			hourlyMedianMen: "3.00",
			beneficiaryCountWomen: 90,
			beneficiaryCountMen: 71,
		});
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
		const row = makeRow({
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
		const row = makeRow({
			annualQuartile1WomenCount: "11",
			annualQuartile2WomenCount: "10",
			annualQuartile1MenCount: "7",
		});
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts).toEqual([11, 10, null, null]);
		expect(result?.step4.annual.menCounts).toEqual([7, null, null, null]);
	});

	it("rounds a non-integer nb value to the nearest integer", () => {
		const row = makeRow({ annualQuartile1WomenCount: "10.6" });
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts[0]).toBe(11);
	});

	it("returns null count for a non-numeric nb value (toInt NaN branch)", () => {
		const row = makeRow({ annualQuartile1WomenCount: "N/A" });
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts[0]).toBeNull();
	});

	it("returns null reference headcount when the block's global counts are null", () => {
		const row = makeRow();
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.referenceWomen).toBeNull();
		expect(result?.step4.annual.referenceMen).toBeNull();
		expect(result?.step4.hourly.referenceWomen).toBeNull();
		expect(result?.step4.hourly.referenceMen).toBeNull();
	});

	it("returns 3-element thresholds tuple (Q1-Q3 only, no Q4)", () => {
		const row = makeRow({
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
		const row = makeRow({
			confidenceIndex: "0.85",
			periodEnd: "2026-12-31",
		});
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("0.85");
		expect(result?.periodEnd).toBe("2026-12-31");
	});

	it("returns all null step2 fields when row has no indicator A/C data", () => {
		const row = makeRow();
		const result = mapGipToFormData(row);
		expect(result?.step2).toEqual({
			annualMeanWomen: null,
			annualMeanMen: null,
			hourlyMeanWomen: null,
			hourlyMeanMen: null,
			annualMedianWomen: null,
			annualMedianMen: null,
			hourlyMedianWomen: null,
			hourlyMedianMen: null,
		});
	});

	it("returns all null step3 fields when row has no indicator B/D/E data", () => {
		const row = makeRow();
		const result = mapGipToFormData(row);
		expect(result?.step3).toEqual({
			annualMeanWomen: null,
			annualMeanMen: null,
			hourlyMeanWomen: null,
			hourlyMeanMen: null,
			annualMedianWomen: null,
			annualMedianMen: null,
			hourlyMedianWomen: null,
			hourlyMedianMen: null,
			beneficiaryCountWomen: null,
			beneficiaryCountMen: null,
		});
	});

	it("handles zero workforce for variable pay beneficiaries", () => {
		const row = makeRow({
			womenCountAnnualVariable: "0",
			menCountAnnualVariable: "0",
		});
		const result = mapGipToFormData(row);
		expect(result?.step3.beneficiaryCountWomen).toBe(0);
		expect(result?.step3.beneficiaryCountMen).toBe(0);
	});

	it("maps step1 with zero workforce", () => {
		const row = makeRow({
			womenCountAnnualGlobal: "0",
			menCountAnnualGlobal: "180",
		});
		const result = mapGipToFormData(row);
		expect(result?.step1).toEqual({
			totalWomen: 0,
			totalMen: 180,
		});
	});

	it("handles confidence index at 0", () => {
		const row = makeRow({ confidenceIndex: "0" });
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("0");
	});

	it("handles confidence index at 1", () => {
		const row = makeRow({ confidenceIndex: "1" });
		const result = mapGipToFormData(row);
		expect(result?.confidenceIndex).toBe("1");
	});

	it("returns null for non-numeric workforce string (toInt NaN branch)", () => {
		const row = makeRow({ womenCountAnnualGlobal: "N/A" });
		const result = mapGipToFormData(row);
		expect(result?.step1.totalWomen).toBeNull();
	});
});
