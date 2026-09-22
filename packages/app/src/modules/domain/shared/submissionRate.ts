import { formatCount, formatFixedPercentage, NARROW_NBSP } from "./format";

export function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

export function computeRate(submitted: number, obligated: number): number {
	if (obligated === 0) return 0;
	return roundOneDecimal((submitted / obligated) * 100);
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
		value: `${formatFixedPercentage(data.submissionRate)}${NARROW_NBSP}%`,
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
