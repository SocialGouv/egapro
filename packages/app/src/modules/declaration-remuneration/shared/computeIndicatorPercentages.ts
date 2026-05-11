import { computeGapRatio } from "~/modules/domain";

type DeclarationRowSubset = {
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

function gapOrNull(women: string | null, men: string | null): number | null {
	if (women === null || men === null) return null;
	return computeGapRatio(women, men);
}

function proportionFromCounts(
	women: number | null,
	men: number | null,
): { women: number | null; men: number | null } {
	if (women === null || men === null) return { women: null, men: null };
	const total = women + men;
	if (total === 0) return { women: null, men: null };
	return {
		women: Math.round((women / total) * 10_000) / 10_000,
		men: Math.round((men / total) * 10_000) / 10_000,
	};
}

function proportionFromStrings(
	women: string | null,
	men: string | null,
): { women: number | null; men: number | null } {
	if (women === null || men === null) return { women: null, men: null };
	const w = Number(women);
	const m = Number(men);
	if (Number.isNaN(w) || Number.isNaN(m)) return { women: null, men: null };
	const total = w + m;
	if (total === 0) return { women: null, men: null };
	return {
		women: w / total,
		men: m / total,
	};
}

export function computeIndicatorPercentages(
	row: DeclarationRowSubset,
): ComputedPercentages {
	const eProps = proportionFromStrings(row.indicatorEWomen, row.indicatorEMen);

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
		),
		globalHourlyMeanGap: gapOrNull(
			row.indicatorAHourlyWomen,
			row.indicatorAHourlyMen,
		),
		variableAnnualMeanGap: gapOrNull(
			row.indicatorBAnnualWomen,
			row.indicatorBAnnualMen,
		),
		variableHourlyMeanGap: gapOrNull(
			row.indicatorBHourlyWomen,
			row.indicatorBHourlyMen,
		),
		globalAnnualMedianGap: gapOrNull(
			row.indicatorCAnnualWomen,
			row.indicatorCAnnualMen,
		),
		globalHourlyMedianGap: gapOrNull(
			row.indicatorCHourlyWomen,
			row.indicatorCHourlyMen,
		),
		variableAnnualMedianGap: gapOrNull(
			row.indicatorDAnnualWomen,
			row.indicatorDAnnualMen,
		),
		variableHourlyMedianGap: gapOrNull(
			row.indicatorDHourlyWomen,
			row.indicatorDHourlyMen,
		),
		variableProportionWomen: eProps.women,
		variableProportionMen: eProps.men,
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
