import { and, desc, isNotNull, lte } from "drizzle-orm";
import { cache } from "react";

import { getCurrentYear } from "~/modules/domain";

import { db } from ".";
import { campaignDeadlines } from "./schema";

/** Singleton row ID for the `global_setting` table (there is only ever one). */
export const GLOBAL_SETTINGS_ID = 1;

/**
 * Returns the active campaign year — the most recent `campaign_deadline` row
 * whose `campaignStartDate` is in the past. Admins no longer pick a year
 * directly; it is deduced from the campaign configuration they maintain.
 *
 * Falls back to the current calendar year when no campaign has started yet.
 * Wrapped in React `cache()` to deduplicate calls within a single request.
 */
export const getActiveCampaignYear = cache(async (): Promise<number> => {
	// `.date` columns are serialised as "YYYY-MM-DD" strings, safe to compare lexicographically.
	const today = new Date().toISOString().slice(0, 10);

	const rows = await db
		.select({ year: campaignDeadlines.year })
		.from(campaignDeadlines)
		.where(
			and(
				isNotNull(campaignDeadlines.campaignStartDate),
				lte(campaignDeadlines.campaignStartDate, today),
			),
		)
		.orderBy(desc(campaignDeadlines.year))
		.limit(1);

	return rows[0]?.year ?? getCurrentYear();
});
