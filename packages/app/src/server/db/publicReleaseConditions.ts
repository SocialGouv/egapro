import "server-only";

import { sql } from "drizzle-orm";

import { campaignDeadlines, representationDeclarations } from "./schema";

// Miroir SQL d'`isYearPubliclyReleased` : Drizzle ne peut pas appeler la
// fonction domaine, et une date absente doit valoir « jamais publiée ».
export function publiclyReleasedCampaignCondition() {
	return sql<boolean>`(${campaignDeadlines.publicDataReleaseDate} IS NOT NULL
		AND ${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE)`;
}

// Miroir SQL de `getRepresentationCampaignYear` : joindre sur l'année de
// référence elle-même lirait la campagne précédente, déjà publiée.
export function releasedRepresentationCampaignJoin() {
	return sql<boolean>`(${campaignDeadlines.year} = ${representationDeclarations.year} + 1
		AND ${publiclyReleasedCampaignCondition()})`;
}
