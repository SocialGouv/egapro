import { and, desc, isNotNull, lte } from "drizzle-orm";
import { cache } from "react";

import {
	getCurrentYear,
	getTodayInParisCivilDateString,
} from "~/modules/domain";

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
 *
 * Deliberately NOT rewired onto the E2E clock seam (issue #4022): its only
 * caller is AidePage.tsx, outside the declaration path, and with no
 * `campaignStartDate` configured it already falls back to getCurrentYear() —
 * which honours the override. Do not "fix" it to read globalThis directly.
 */
export const getActiveCampaignYear = cache(async (): Promise<number> => {
	const today = getTodayInParisCivilDateString();

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
