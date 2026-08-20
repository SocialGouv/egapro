import { eq } from "drizzle-orm";
import { cache } from "react";

import type { RepresentationCampaign } from "~/modules/domain";
import { getDefaultRepresentationCampaign } from "~/modules/domain";

import { db } from ".";
import { parseCivilDate } from "./parseCivilDate";
import { representationCampaigns } from "./schema";

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
			campaignStartDate: parseCivilDate(row.campaignStartDate),
			campaignEndDate: parseCivilDate(row.campaignEndDate),
			declarationDeadline: parseCivilDate(row.declarationDeadline),
		};
	},
);
