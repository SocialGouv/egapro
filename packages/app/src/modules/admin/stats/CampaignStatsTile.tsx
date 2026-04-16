"use client";

import {
	type CompanySizeRange,
	formatCount,
	formatGap,
} from "~/modules/domain";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";

type Props = {
	year: number;
	sizeRange: CompanySizeRange | undefined;
};

function computeDelta(
	submissionRate: number | null,
	previousYearRate: number | null,
): number | null {
	if (submissionRate === null || previousYearRate === null) return null;
	return submissionRate - previousYearRate;
}

/**
 * K1 — live declaration rate tile for the admin stats dashboard.
 *
 * Owns the tRPC query for the currently-selected filters and renders the
 * reusable `<AdminKpiTile>`. Loading / error states keep the tile skeleton
 * visible so the layout doesn't jump while the admin changes filters.
 */
export function CampaignStatsTile({ year, sizeRange }: Props) {
	const { data, isLoading, isError } = api.admin.getCampaignStats.useQuery({
		year,
		sizeRange,
	});

	if (isLoading || !data) {
		return (
			<AdminKpiTile
				title={`Taux de déclaration ${year}`}
				value={isError ? "—" : "…"}
			/>
		);
	}

	const delta = computeDelta(data.submissionRate, data.previousYearRate);
	const subtitle = `${formatCount(data.totalSubmitted)} / ${formatCount(
		data.totalObligated,
	)} entreprises`;

	return (
		<AdminKpiTile
			deltaLabel={`vs ${year - 1}`}
			deltaPoints={delta}
			subtitle={subtitle}
			title={`Taux de déclaration ${year}`}
			value={formatGap(data.submissionRate)}
		/>
	);
}
