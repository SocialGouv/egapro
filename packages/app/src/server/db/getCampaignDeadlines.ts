import { eq } from "drizzle-orm";
import { cache } from "react";

import type { CampaignDeadlines } from "~/modules/domain";
import {
	getDefaultCampaignDeadlines,
	getPathChoiceDeadline,
	getPathChoiceRound1Deadline,
} from "~/modules/domain";

import { db } from ".";
import { parseCivilDate } from "./parseCivilDate";
import { campaignDeadlines } from "./schema";

function parseNullableDate(dateStr: string | null): Date | null {
	return dateStr ? parseCivilDate(dateStr) : null;
}

/**
 * Fetches campaign deadlines for a given year, falling back to hardcoded defaults.
 *
 * Wrapped in React `cache()` to deduplicate calls within a single request:
 * multiple server components calling this for the same year hit the DB only once.
 */
export const getCampaignDeadlines = cache(
	async (year: number): Promise<CampaignDeadlines> => {
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
			gipPublicationDate: parseNullableDate(row.gipPublicationDate),
			campaignStartDate: parseNullableDate(row.campaignStartDate),
			decl1ModificationDeadline: parseCivilDate(row.decl1ModificationDeadline),
			decl1JustificationDeadline: parseCivilDate(
				row.decl1JustificationDeadline,
			),
			decl1JointEvaluationDeadline: parseCivilDate(
				row.decl1JointEvaluationDeadline,
			),
			decl2ModificationDeadline: parseCivilDate(row.decl2ModificationDeadline),
			decl2JustificationDeadline: parseCivilDate(
				row.decl2JustificationDeadline,
			),
			decl2JointEvaluationDeadline: parseCivilDate(
				row.decl2JointEvaluationDeadline,
			),
			pathChoiceDeadline: getPathChoiceDeadline(year),
			pathChoiceRound1Deadline: getPathChoiceRound1Deadline(year),
		};
	},
);
