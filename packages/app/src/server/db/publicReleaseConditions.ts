import "server-only";

import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { REPRESENTATION_CAMPAIGN_YEAR_OFFSET } from "~/modules/domain";

import { campaignDeadlines, representationDeclarations } from "./schema";

// SQL mirror of isYearPubliclyReleased: a missing release date means never released.
export function publiclyReleasedCampaignCondition(
	campaignTable: { publicDataReleaseDate: AnyPgColumn } = campaignDeadlines,
) {
	return sql<boolean>`(${campaignTable.publicDataReleaseDate} IS NOT NULL
		AND ${campaignTable.publicDataReleaseDate} <= (now() AT TIME ZONE 'Europe/Paris')::date)`;
}

// SQL mirror of getRepresentationCampaignYear: joining on the reference year would read the previous, already released campaign.
export function representationCampaignYearExpression(
	referenceYearColumn: AnyPgColumn = representationDeclarations.year,
) {
	return sql<number>`${referenceYearColumn} + ${REPRESENTATION_CAMPAIGN_YEAR_OFFSET}`;
}

export function releasedRepresentationCampaignJoin() {
	return sql<boolean>`(${campaignDeadlines.year} = ${representationCampaignYearExpression()}
		AND ${publiclyReleasedCampaignCondition()})`;
}
