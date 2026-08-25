import type {
	GipMdsRow,
	GipPrefillData,
	PayGapReferences,
} from "~/modules/declaration-remuneration";

/**
 * Fixtures for the GIP-supplied pay gaps, shared by every suite that renders a
 * pay-gap surface (steps 2/3/6, recap, admin recap, PDF) or builds a
 * `GipPrefillData`. Kept in one place so the `PayGapReferences` tuple shape and
 * the divergent real-world row have a single definition across the suites.
 */

/** No GIP gap on any of the 4 rows — every gap falls back to being recomputed. */
export function noPayGapReferences(): PayGapReferences {
	return [undefined, undefined, undefined, undefined];
}

/** A `GipPrefillData["step2"]` block with no GIP data at all. */
export function nullGipStep2(): GipPrefillData["step2"] {
	return {
		annualMeanWomen: null,
		annualMeanMen: null,
		annualMeanGap: null,
		hourlyMeanWomen: null,
		hourlyMeanMen: null,
		hourlyMeanGap: null,
		annualMedianWomen: null,
		annualMedianMen: null,
		annualMedianGap: null,
		hourlyMedianWomen: null,
		hourlyMedianMen: null,
		hourlyMedianGap: null,
	};
}

/** A `GipPrefillData["step3"]` block with no GIP data at all. */
export function nullGipStep3(): GipPrefillData["step3"] {
	return {
		...nullGipStep2(),
		beneficiaryCountWomen: null,
		beneficiaryCountMen: null,
	};
}

function nullGipQuartile(): GipPrefillData["step4"]["annual"] {
	return {
		thresholds: [null, null, null],
		womenCounts: [null, null, null, null],
		menCounts: [null, null, null, null],
	};
}

/** A `GipPrefillData["step4"]` block with no GIP quartile data at all. */
export function nullGipStep4(): GipPrefillData["step4"] {
	return { annual: nullGipQuartile(), hourly: nullGipQuartile() };
}

/**
 * The prefilled `GipPrefillData["step4"]` block shared by every suite that
 * renders a GIP-populated quartile table: annual thresholds 25 000 / 32 000 /
 * 40 000 spreading 90 women and 110 men, hourly thresholds 13,74 / 17,58 /
 * 21,98 spreading 80 women and 120 men.
 */
export function prefilledGipStep4(): GipPrefillData["step4"] {
	return {
		annual: {
			thresholds: ["25000", "32000", "40000"],
			womenCounts: [30, 25, 20, 15],
			menCounts: [20, 25, 30, 35],
		},
		hourly: {
			thresholds: ["13.74", "17.58", "21.98"],
			womenCounts: [28, 22, 18, 12],
			menCounts: [22, 28, 32, 38],
		},
	};
}

/**
 * Representative fixture for the case where both operands round to the same
 * value (0,10 €/h) yet the GIP — which computed the gap on full-precision
 * figures — publishes 7,19 %, above the 5 % alert threshold. Recomputing
 * from the published operands yields 0 %, so reading the GIP gap is essential.
 * The single most load-bearing fixture of this behaviour: reading versus
 * recomputing flips the "écart significatif" badge.
 * Values are independently maintained; they no longer appear verbatim in the
 * generated mock CSV (which now enforces ecart = f(rounded operands)).
 */
export const DIVERGENT_HOURLY_MEDIAN = {
	women: "0.10",
	men: "0.10",
	gap: "0.0719",
} as const;

/**
 * Representative fixture: mean block where the GIP-published gap (18,44 %)
 * diverges from the recomputed value (18,18 %) derived from the rounded
 * operands 0,09 / 0,11. Values are independently maintained.
 */
export const DIVERGENT_HOURLY_MEAN = {
	women: "0.09",
	men: "0.11",
	gap: "0.1844",
} as const;

/** A `GipMdsRow` with every field null except the ones the caller sets. */
export function makeGipRow(overrides: Partial<GipMdsRow> = {}): GipMdsRow {
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
