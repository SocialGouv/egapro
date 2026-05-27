"use client";

import { buildCampaignRateTileProps } from "~/modules/domain";
import {
	CampaignRateTileError,
	CampaignRateTileLoading,
} from "~/modules/shared";
import { api } from "~/trpc/react";

import { PublicKpiTile } from "./PublicKpiTile";

export function CurrentCampaignRateTile() {
	const query = api.publicStats.getCurrentCampaignRate.useQuery(undefined, {
		placeholderData: (prev) => prev,
	});

	if (query.isLoading && !query.data) return <CampaignRateTileLoading />;
	if (query.isError) return <CampaignRateTileError />;

	const data = query.data;
	if (!data) return null;

	return (
		<PublicKpiTile
			{...buildCampaignRateTileProps(data, data.year, data.year - 1)}
		/>
	);
}
