"use client";

import type { CompanySizeRange } from "~/modules/domain";
import { buildCampaignRateTileProps } from "~/modules/domain";
import {
	CampaignRateTileError,
	CampaignRateTileLoading,
} from "~/modules/shared";
import { api } from "~/trpc/react";

import { AdminKpiTile } from "./AdminKpiTile";

type Props = {
	year: number;
	sizeRange: CompanySizeRange | undefined;
};

export function CampaignRateTile({ year, sizeRange }: Props) {
	const query = api.adminStats.getCampaignStats.useQuery(
		{ year, sizeRange },
		{ placeholderData: (prev) => prev },
	);

	if (query.isLoading && !query.data) return <CampaignRateTileLoading />;
	if (query.isError) return <CampaignRateTileError />;

	const data = query.data;
	if (!data) return null;

	return <AdminKpiTile {...buildCampaignRateTileProps(data, year, year - 1)} />;
}
