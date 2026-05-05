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
	// `.date` columns are stored as "YYYY-MM-DD" in Europe/Paris civil time, so
	// we compare them against the Paris calendar date. We force the timezone
	// explicitly because production containers run in UTC — relying on the
	// system locale would flip the result across midnight for ~2h each night
	// (Paris in summer is UTC+2). `sv-SE` renders dates as ISO "YYYY-MM-DD".
	const today = new Date().toLocaleDateString("sv-SE", {
		timeZone: "Europe/Paris",
	});

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
