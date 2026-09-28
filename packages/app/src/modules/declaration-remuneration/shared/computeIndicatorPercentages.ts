import type { GipGapReference } from "~/modules/domain";
import {
	computeWorkforceTotal,
	proportionOf,
	resolveGapRatio,
	variablePayProportion,
} from "~/modules/domain";
import type { GipMdsRow } from "./gipMdsMapping";

type DeclarationRowSubset = {
	totalWomen: number | null;
	totalMen: number | null;
	indicatorAAnnualWomen: string | null;
	indicatorAAnnualMen: string | null;
	indicatorAHourlyWomen: string | null;
	indicatorAHourlyMen: string | null;
	indicatorBAnnualWomen: string | null;
	indicatorBAnnualMen: string | null;
	indicatorBHourlyWomen: string | null;
	indicatorBHourlyMen: string | null;
	indicatorCAnnualWomen: string | null;
	indicatorCAnnualMen: string | null;
	indicatorCHourlyWomen: string | null;
	indicatorCHourlyMen: string | null;
	indicatorDAnnualWomen: string | null;
	indicatorDAnnualMen: string | null;
	indicatorDHourlyWomen: string | null;
	indicatorDHourlyMen: string | null;
	indicatorEWomen: string | null;
	indicatorEMen: string | null;
	indicatorFAnnualWomen1: number | null;
	indicatorFAnnualWomen2: number | null;
	indicatorFAnnualWomen3: number | null;
	indicatorFAnnualWomen4: number | null;
	indicatorFAnnualMen1: number | null;
	indicatorFAnnualMen2: number | null;
	indicatorFAnnualMen3: number | null;
	indicatorFAnnualMen4: number | null;
	indicatorFHourlyWomen1: number | null;
	indicatorFHourlyWomen2: number | null;
	indicatorFHourlyWomen3: number | null;
	indicatorFHourlyWomen4: number | null;
	indicatorFHourlyMen1: number | null;
	indicatorFHourlyMen2: number | null;
	indicatorFHourlyMen3: number | null;
	indicatorFHourlyMen4: number | null;
};

type ComputedPercentages = {
	globalAnnualMeanGap: number | null;
	globalHourlyMeanGap: number | null;
	variableAnnualMeanGap: number | null;
	variableHourlyMeanGap: number | null;
	globalAnnualMedianGap: number | null;
	globalHourlyMedianGap: number | null;
	variableAnnualMedianGap: number | null;
	variableHourlyMedianGap: number | null;
	variableProportionWomen: number | null;
	variableProportionMen: number | null;
	annualQuartile1ProportionWomen: number | null;
	annualQuartile2ProportionWomen: number | null;
	annualQuartile3ProportionWomen: number | null;
	annualQuartile4ProportionWomen: number | null;
	annualQuartile1ProportionMen: number | null;
	annualQuartile2ProportionMen: number | null;
	annualQuartile3ProportionMen: number | null;
	annualQuartile4ProportionMen: number | null;
	hourlyQuartile1ProportionWomen: number | null;
	hourlyQuartile2ProportionWomen: number | null;
	hourlyQuartile3ProportionWomen: number | null;
	hourlyQuartile4ProportionWomen: number | null;
	hourlyQuartile1ProportionMen: number | null;
	hourlyQuartile2ProportionMen: number | null;
	hourlyQuartile3ProportionMen: number | null;
	hourlyQuartile4ProportionMen: number | null;
};

function gapOrNull(
	women: string | null,
	men: string | null,
	reference: GipGapReference | null,
): number | null {
	if (women === null || men === null) return null;
	return resolveGapRatio(women, men, reference);
}

/** Build the GIP reference for one indicator block, or `null` when no GIP row is available. */
function gipGap(
	gip: GipMdsRow | null | undefined,
	women: keyof GipMdsRow,
	men: keyof GipMdsRow,
	gap: keyof GipMdsRow,
): GipGapReference | null {
	if (!gip) return null;
	return {
		women: asNumericString(gip[women]),
		men: asNumericString(gip[men]),
		gap: asNumericString(gip[gap]),
	};
}

/** Drizzle numeric columns come back as strings; anything else (dates, numbers) is not an operand. */
function asNumericString(value: GipMdsRow[keyof GipMdsRow]): string | null {
	return typeof value === "string" ? value : null;
}

function proportionFromCounts(
	women: number | null,
	men: number | null,
): { women: number | null; men: number | null } {
	if (women === null || men === null) return { women: null, men: null };
	const total = computeWorkforceTotal(women, men);
	if (total === 0) return { women: null, men: null };
	return {
		women: Math.round(proportionOf(women, total) * 10_000) / 10_000,
		men: Math.round(proportionOf(men, total) * 10_000) / 10_000,
	};
}

/**
 * Derives the percentage columns persisted on a declaration.
 *
 * The 8 gaps are resolved rather than recomputed: while the declarant has not touched an
 * indicator's operands, the GIP `*_ecart` value stays authoritative — the GIP computes it on
 * full-precision figures but publishes the operands rounded to 2 decimals, so recomputing from
 * those operands drifts (up to ~9 points on hourly variable pay). Passing no `gip` row falls
 * back to recomputing everything.
 */
export function computeIndicatorPercentages(
	row: DeclarationRowSubset,
	gip?: GipMdsRow | null,
): ComputedPercentages {
	const fAnnual1 = proportionFromCounts(
		row.indicatorFAnnualWomen1,
		row.indicatorFAnnualMen1,
	);
	const fAnnual2 = proportionFromCounts(
		row.indicatorFAnnualWomen2,
		row.indicatorFAnnualMen2,
	);
	const fAnnual3 = proportionFromCounts(
		row.indicatorFAnnualWomen3,
		row.indicatorFAnnualMen3,
	);
	const fAnnual4 = proportionFromCounts(
		row.indicatorFAnnualWomen4,
		row.indicatorFAnnualMen4,
	);

	const fHourly1 = proportionFromCounts(
		row.indicatorFHourlyWomen1,
		row.indicatorFHourlyMen1,
	);
	const fHourly2 = proportionFromCounts(
		row.indicatorFHourlyWomen2,
		row.indicatorFHourlyMen2,
	);
	const fHourly3 = proportionFromCounts(
		row.indicatorFHourlyWomen3,
		row.indicatorFHourlyMen3,
	);
	const fHourly4 = proportionFromCounts(
		row.indicatorFHourlyWomen4,
		row.indicatorFHourlyMen4,
	);

	return {
		globalAnnualMeanGap: gapOrNull(
			row.indicatorAAnnualWomen,
			row.indicatorAAnnualMen,
			gipGap(
				gip,
				"globalAnnualMeanWomen",
				"globalAnnualMeanMen",
				"globalAnnualMeanGap",
			),
		),
		globalHourlyMeanGap: gapOrNull(
			row.indicatorAHourlyWomen,
			row.indicatorAHourlyMen,
			gipGap(
				gip,
				"globalHourlyMeanWomen",
				"globalHourlyMeanMen",
				"globalHourlyMeanGap",
			),
		),
		variableAnnualMeanGap: gapOrNull(
			row.indicatorBAnnualWomen,
			row.indicatorBAnnualMen,
			gipGap(
				gip,
				"variableAnnualMeanWomen",
				"variableAnnualMeanMen",
				"variableAnnualMeanGap",
			),
		),
		variableHourlyMeanGap: gapOrNull(
			row.indicatorBHourlyWomen,
			row.indicatorBHourlyMen,
			gipGap(
				gip,
				"variableHourlyMeanWomen",
				"variableHourlyMeanMen",
				"variableHourlyMeanGap",
			),
		),
		globalAnnualMedianGap: gapOrNull(
			row.indicatorCAnnualWomen,
			row.indicatorCAnnualMen,
			gipGap(
				gip,
				"globalAnnualMedianWomen",
				"globalAnnualMedianMen",
				"globalAnnualMedianGap",
			),
		),
		globalHourlyMedianGap: gapOrNull(
			row.indicatorCHourlyWomen,
			row.indicatorCHourlyMen,
			gipGap(
				gip,
				"globalHourlyMedianWomen",
				"globalHourlyMedianMen",
				"globalHourlyMedianGap",
			),
		),
		variableAnnualMedianGap: gapOrNull(
			row.indicatorDAnnualWomen,
			row.indicatorDAnnualMen,
			gipGap(
				gip,
				"variableAnnualMedianWomen",
				"variableAnnualMedianMen",
				"variableAnnualMedianGap",
			),
		),
		variableHourlyMedianGap: gapOrNull(
			row.indicatorDHourlyWomen,
			row.indicatorDHourlyMen,
			gipGap(
				gip,
				"variableHourlyMedianWomen",
				"variableHourlyMedianMen",
				"variableHourlyMedianGap",
			),
		),
		variableProportionWomen: variablePayProportion(
			row.indicatorEWomen,
			row.totalWomen,
		),
		variableProportionMen: variablePayProportion(
			row.indicatorEMen,
			row.totalMen,
		),
		annualQuartile1ProportionWomen: fAnnual1.women,
		annualQuartile2ProportionWomen: fAnnual2.women,
		annualQuartile3ProportionWomen: fAnnual3.women,
		annualQuartile4ProportionWomen: fAnnual4.women,
		annualQuartile1ProportionMen: fAnnual1.men,
		annualQuartile2ProportionMen: fAnnual2.men,
		annualQuartile3ProportionMen: fAnnual3.men,
		annualQuartile4ProportionMen: fAnnual4.men,
		hourlyQuartile1ProportionWomen: fHourly1.women,
		hourlyQuartile2ProportionWomen: fHourly2.women,
		hourlyQuartile3ProportionWomen: fHourly3.women,
		hourlyQuartile4ProportionWomen: fHourly4.women,
		hourlyQuartile1ProportionMen: fHourly1.men,
		hourlyQuartile2ProportionMen: fHourly2.men,
		hourlyQuartile3ProportionMen: fHourly3.men,
		hourlyQuartile4ProportionMen: fHourly4.men,
	};
}
