"use client";

import {
	CampaignRateTileError,
	CampaignRateTileLoading,
} from "~/modules/shared";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";
import { formatCount } from "./formatters";

type Props = {
	year: number;
};

export function CseStatusConfirmationsTile({ year }: Props) {
	const query = api.adminStats.getMatomoCseStatusConfirmations.useQuery(
		{ year },
		{ placeholderData: (prev) => prev },
	);

	if (query.isLoading && !query.data) return <CampaignRateTileLoading />;
	if (query.isError) return <CampaignRateTileError />;

	const data = query.data;
	if (!data) return null;

	return (
		<AdminKpiTile
			delta={null}
			subtitle={`${formatCount(data.yes)} « oui » · ${formatCount(data.no)} « non »`}
			title={`Confirmations de statut CSE (${year})`}
			value={formatCount(data.total)}
		/>
	);
}
