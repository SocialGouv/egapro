import { describe, expect, it } from "vitest";
import type { GipMdsRow } from "../gipMdsMapping";
import { CSV_TO_SCHEMA_MAP, mapGipToFormData } from "../gipMdsMapping";

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
		annualQuartileThreshold4: null,
		annualQuartile1ProportionWomen: null,
		annualQuartile2ProportionWomen: null,
		annualQuartile3ProportionWomen: null,
		annualQuartile4ProportionWomen: null,
		annualQuartile1ProportionMen: null,
		annualQuartile2ProportionMen: null,
		annualQuartile3ProportionMen: null,
		annualQuartile4ProportionMen: null,
		hourlyQuartileThreshold1: null,
		hourlyQuartileThreshold2: null,
		hourlyQuartileThreshold3: null,
		hourlyQuartileThreshold4: null,
		hourlyQuartile1ProportionWomen: null,
		hourlyQuartile2ProportionWomen: null,
		hourlyQuartile3ProportionWomen: null,
		hourlyQuartile4ProportionWomen: null,
		hourlyQuartile1ProportionMen: null,
		hourlyQuartile2ProportionMen: null,
		hourlyQuartile3ProportionMen: null,
		hourlyQuartile4ProportionMen: null,
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

	it("maps step4 quartile data from proportions", () => {
		const row = makeRow({
			womenCountAnnualGlobal: "100",
			menCountAnnualGlobal: "100",
			annualQuartileThreshold1: "25000",
			annualQuartileThreshold2: "30000",
			annualQuartileThreshold3: "35000",
			annualQuartileThreshold4: "40000",
			annualQuartile1ProportionWomen: "0.6",
			annualQuartile2ProportionWomen: "0.5",
			annualQuartile3ProportionWomen: "0.4",
			annualQuartile4ProportionWomen: "0.3",
			annualQuartile1ProportionMen: "0.4",
			annualQuartile2ProportionMen: "0.5",
			annualQuartile3ProportionMen: "0.6",
			annualQuartile4ProportionMen: "0.7",
		});
		const result = mapGipToFormData(row);
		// totalAll = 200, quartileSize = 50
		expect(result?.step4.annual.thresholds).toEqual([
			"25000",
			"30000",
			"35000",
			"40000",
		]);
		expect(result?.step4.annual.womenCounts).toEqual([30, 25, 20, 15]);
		expect(result?.step4.annual.menCounts).toEqual([20, 25, 30, 35]);
	});

	it("handles null quartile proportions", () => {
		const row = makeRow({
			womenCountAnnualGlobal: "100",
			menCountAnnualGlobal: "100",
		});
		const result = mapGipToFormData(row);
		expect(result?.step4.annual.womenCounts).toEqual([null, null, null, null]);
		expect(result?.step4.annual.menCounts).toEqual([null, null, null, null]);
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

	it("computes zero quartile size when workforce is zero", () => {
		const row = makeRow({
			annualQuartile1ProportionWomen: "0.5",
			annualQuartile1ProportionMen: "0.5",
		});
		const result = mapGipToFormData(row);
		// totalAll = 0, quartileSize = 0, count = round(0.5 * 0) = 0
		expect(result?.step4.annual.womenCounts[0]).toBe(0);
		expect(result?.step4.annual.menCounts[0]).toBe(0);
	});
});

describe("CSV_TO_SCHEMA_MAP", () => {
	it("maps SIREN column to siren field", () => {
		expect(CSV_TO_SCHEMA_MAP.SIREN).toBe("siren");
	});

	it("maps workforce columns", () => {
		expect(CSV_TO_SCHEMA_MAP.Effectif_RCD).toBe("workforceEma");
		expect(CSV_TO_SCHEMA_MAP.Effectif_H_rem_annuelle_globale).toBe(
			"menCountAnnualGlobal",
		);
		expect(CSV_TO_SCHEMA_MAP.Effectif_F_rem_annuelle_globale).toBe(
			"womenCountAnnualGlobal",
		);
	});

	it("maps indicator A columns (global mean)", () => {
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_ecart).toBe(
			"globalAnnualMeanGap",
		);
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_F).toBe(
			"globalAnnualMeanWomen",
		);
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_H).toBe(
			"globalAnnualMeanMen",
		);
	});

	it("maps quartile columns (indicator F)", () => {
		expect(CSV_TO_SCHEMA_MAP.Seuil_Q1_Rem_globale).toBe(
			"annualQuartileThreshold1",
		);
		expect(CSV_TO_SCHEMA_MAP.Quartile1_Rem_globale_annuelle_proportion_F).toBe(
			"annualQuartile1ProportionWomen",
		);
	});

	it("maps confidence index columns", () => {
		expect(CSV_TO_SCHEMA_MAP.indice).toBe("confidenceIndex");
		expect(CSV_TO_SCHEMA_MAP.indice_nature_exo).toBe(
			"confidenceExoticContracts",
		);
	});

	it("contains expected number of mappings", () => {
		const keys = Object.keys(CSV_TO_SCHEMA_MAP);
		// 7 workforce + 24 indicator + 2 proportion + 16 quartile annual + 16 quartile hourly + 14 confidence + SIREN
		expect(keys.length).toBeGreaterThan(50);
	});
});
