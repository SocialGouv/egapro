import "server-only";

import { sql } from "drizzle-orm";

import { campaignDeadlines, representationDeclarations } from "./schema";

// SQL mirror of isYearPubliclyReleased: a missing release date means never released.
export function publiclyReleasedCampaignCondition() {
	return sql<boolean>`(${campaignDeadlines.publicDataReleaseDate} IS NOT NULL
		AND ${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE)`;
}

// SQL mirror of getRepresentationCampaignYear: joining on the reference year would read the previous, already released campaign.
export function releasedRepresentationCampaignJoin() {
	return sql<boolean>`(${campaignDeadlines.year} = ${representationDeclarations.year} + 1
		AND ${publiclyReleasedCampaignCondition()})`;
}
