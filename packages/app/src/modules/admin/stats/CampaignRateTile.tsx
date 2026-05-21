"use client";

import type { CompanySizeRange } from "~/modules/domain";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";

const NARROW_NBSP = " ";

type Props = {
	year: number;
	sizeRange: CompanySizeRange | undefined;
};

function formatRate(rate: number): string {
	return rate.toFixed(1).replace(".", ",");
}

function formatCount(count: number): string {
	return count.toLocaleString("fr-FR").replace(/ /g, NARROW_NBSP);
}

export function CampaignRateTile({ year, sizeRange }: Props) {
	const query = api.adminStats.getCampaignStats.useQuery(
		{ year, sizeRange },
		{ placeholderData: (prev) => prev },
	);

	if (query.isLoading && !query.data) {
		return (
			<p aria-live="polite" className="fr-text--sm">
				Chargement du taux de déclaration…
			</p>
		);
	}

	if (query.isError) {
		return (
			<div aria-live="polite" className="fr-alert fr-alert--error">
				<p>
					Une erreur est survenue lors du chargement du taux de déclaration.
				</p>
			</div>
		);
	}

	const data = query.data;
	if (!data) return null;

	const delta =
		data.previousYearRate === null
			? null
			: {
					points:
						Math.round((data.submissionRate - data.previousYearRate) * 10) / 10,
					comparisonLabel: `vs ${year - 1}`,
				};

	return (
		<AdminKpiTile
			delta={delta}
			subtitle={`${formatCount(data.totalSubmitted)} / ${formatCount(data.totalObligated)} entreprises`}
			title={`Taux de déclaration ${year}`}
			value={`${formatRate(data.submissionRate)}${NARROW_NBSP}%`}
		/>
	);
}
