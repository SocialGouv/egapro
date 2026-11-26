import { eq } from "drizzle-orm";
import { cache } from "react";

import type { RepresentationCampaign } from "~/modules/domain";
import { getDefaultRepresentationCampaign } from "~/modules/domain";

import { db } from ".";
import { parseCivilDate } from "./parseCivilDate";
import { representationCampaigns } from "./schema";

export const getRepresentationCampaign = cache(
	async (campaignYear: number): Promise<RepresentationCampaign> => {
		const defaults = getDefaultRepresentationCampaign(campaignYear);
		const rows = await db
			.select()
			.from(representationCampaigns)
			.where(eq(representationCampaigns.year, campaignYear))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return defaults;
		}

		// Only the declaration deadline is configurable from the back-office; the
		// campaign window is a domain rule (1 March → last day of February), so it
		// must not be read from a row written under the previous rule.
		return {
			...defaults,
			declarationDeadline: parseCivilDate(row.declarationDeadline),
		};
	},
);
