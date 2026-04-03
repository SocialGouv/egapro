import { eq } from "drizzle-orm";
import type { CampaignDeadlines } from "~/modules/domain";
import { getDefaultCampaignDeadlines } from "~/modules/domain";

import { db } from ".";
import { campaignDeadlines } from "./schema";

function parseDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00`);
}

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
		decl1ModificationDeadline: parseDate(row.decl1ModificationDeadline),
		decl1JustificationDeadline: parseDate(row.decl1JustificationDeadline),
		decl1JointEvaluationDeadline: parseDate(row.decl1JointEvaluationDeadline),
		decl2ModificationDeadline: parseDate(row.decl2ModificationDeadline),
		decl2JustificationDeadline: parseDate(row.decl2JustificationDeadline),
		decl2JointEvaluationDeadline: parseDate(row.decl2JointEvaluationDeadline),
	};
}
