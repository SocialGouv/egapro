import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { cache } from "react";

import type { WorkforceHistoryEntry } from "~/modules/domain";
import {
	parseGipWorkforce,
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
} from "~/modules/domain";

import { db } from ".";
import { gipMdsData } from "./schema";

export const getRepresentationWorkforceHistory = cache(
	async (
		siren: string,
		referenceYear: number,
	): Promise<WorkforceHistoryEntry[]> => {
		const rows = await db
			.select({ year: gipMdsData.year, workforceEma: gipMdsData.workforceEma })
			.from(gipMdsData)
			.where(
				and(
					eq(gipMdsData.siren, siren),
					lte(gipMdsData.year, referenceYear),
					isNotNull(gipMdsData.workforceEma),
				),
			)
			.orderBy(desc(gipMdsData.year))
			.limit(REPRESENTATION_SUBJECTION_WINDOW_YEARS);

		return rows
			.map((row) => ({
				year: row.year,
				workforceEma: parseGipWorkforce(row.workforceEma),
			}))
			.filter(
				(entry): entry is WorkforceHistoryEntry => entry.workforceEma !== null,
			);
	},
);
