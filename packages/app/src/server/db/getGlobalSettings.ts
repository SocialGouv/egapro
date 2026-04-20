import { cache } from "react";

import { getCurrentYear } from "~/modules/domain";

import { db } from ".";
import { globalSettings } from "./schema";

/** Singleton row ID for the `global_setting` table (there is only ever one). */
export const GLOBAL_SETTINGS_ID = 1;

/**
 * Fetches the active campaign year configured in the backoffice.
 *
 * Falls back to the current calendar year when no row is configured yet.
 * Wrapped in React `cache()` to deduplicate calls within a single request.
 */
export const getActiveCampaignYear = cache(async (): Promise<number> => {
	const rows = await db
		.select({ activeCampaignYear: globalSettings.activeCampaignYear })
		.from(globalSettings)
		.limit(1);

	return rows[0]?.activeCampaignYear ?? getCurrentYear();
});
