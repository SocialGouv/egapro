import { eq } from "drizzle-orm";
import type { CampaignDeadlines } from "~/modules/domain";
import {
	formatFrenchDate,
	getDefaultCampaignDeadlines,
} from "~/modules/domain";

import { db } from ".";
import { campaignDeadlines } from "./schema";

/** Fetches campaign deadlines for a given year from the DB, falling back to hardcoded defaults. */
export async function getCampaignDeadlines(
	year: number,
): Promise<CampaignDeadlines> {
	const rows = await db
		.select()
		.from(campaignDeadlines)
		.where(eq(campaignDeadlines.year, year))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return getDefaultCampaignDeadlines(year);
	}

	return {
		decl1ModificationDeadline: formatFrenchDate(row.decl1ModificationDeadline),
		decl1JustificationDeadline: formatFrenchDate(
			row.decl1JustificationDeadline,
		),
		decl1JointEvaluationDeadline: formatFrenchDate(
			row.decl1JointEvaluationDeadline,
		),
		decl2ModificationDeadline: formatFrenchDate(row.decl2ModificationDeadline),
		decl2JustificationDeadline: formatFrenchDate(
			row.decl2JustificationDeadline,
		),
		decl2JointEvaluationDeadline: formatFrenchDate(
			row.decl2JointEvaluationDeadline,
		),
	};
}
