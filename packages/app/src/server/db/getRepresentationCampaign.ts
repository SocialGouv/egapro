import { eq } from "drizzle-orm";
import { cache } from "react";

import type { RepresentationCampaign } from "~/modules/domain";
import { getDefaultRepresentationCampaign } from "~/modules/domain";

import { db } from ".";
import { representationCampaigns } from "./schema";

function parseDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00`);
}

export const getRepresentationCampaign = cache(
	async (campaignYear: number): Promise<RepresentationCampaign> => {
		const rows = await db
			.select()
			.from(representationCampaigns)
			.where(eq(representationCampaigns.year, campaignYear))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return getDefaultRepresentationCampaign(campaignYear);
		}

		return {
			campaignStartDate: parseDate(row.campaignStartDate),
			campaignEndDate: parseDate(row.campaignEndDate),
			declarationDeadline: parseDate(row.declarationDeadline),
		};
	},
);
