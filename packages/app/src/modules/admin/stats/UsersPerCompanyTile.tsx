"use client";

import { formatCount, formatDecimal } from "~/modules/domain";
import {
	CampaignRateTileError,
	CampaignRateTileLoading,
} from "~/modules/shared";
import { api } from "~/trpc/react";
import { AdminKpiTile } from "./AdminKpiTile";

export function UsersPerCompanyTile() {
	const query = api.adminStats.getUsersPerCompany.useQuery(undefined, {
		placeholderData: (prev) => prev,
	});

	if (query.isLoading && !query.data) return <CampaignRateTileLoading />;
	if (query.isError) return <CampaignRateTileError />;

	const data = query.data;
	if (!data) return null;

	const avgLabel = formatDecimal(data.avgPerCompany);

	return (
		<AdminKpiTile
			delta={null}
			subtitle={`${formatCount(data.totalCompanies)} entreprises · ${formatCount(data.multi)} multi-utilisateurs · max ${formatCount(data.maxUsers)}`}
			title="Utilisateurs par entreprise"
			value={avgLabel}
		/>
	);
}
