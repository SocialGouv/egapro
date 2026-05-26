export const NARROW_NBSP = " ";

export function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

export function computeRate(submitted: number, obligated: number): number {
	if (obligated === 0) return 0;
	return roundOneDecimal((submitted / obligated) * 100);
}

export function formatPointsAbs(points: number): string {
	const rounded = roundOneDecimal(Math.abs(points));
	return rounded.toFixed(1).replace(".", ",");
}

export function formatRate(rate: number): string {
	return rate.toFixed(1).replace(".", ",");
}

export function formatCount(count: number): string {
	return count.toLocaleString("fr-FR").replace(/ /g, NARROW_NBSP);
}

type CampaignRateData = {
	totalSubmitted: number;
	totalObligated: number;
	submissionRate: number;
	previousYearRate: number | null;
};

export type CampaignRateTileProps = {
	title: string;
	value: string;
	subtitle: string;
	delta: { points: number; comparisonLabel: string } | null;
};

export function buildCampaignRateTileProps(
	data: CampaignRateData,
	year: number,
	comparisonYear: number,
): CampaignRateTileProps {
	return {
		title: `Taux de déclaration ${year}`,
		value: `${formatRate(data.submissionRate)}${NARROW_NBSP}%`,
		subtitle: `${formatCount(data.totalSubmitted)} / ${formatCount(data.totalObligated)} entreprises`,
		delta:
			data.previousYearRate === null
				? null
				: {
						points: roundOneDecimal(
							data.submissionRate - data.previousYearRate,
						),
						comparisonLabel: `vs ${comparisonYear}`,
					},
	};
}
