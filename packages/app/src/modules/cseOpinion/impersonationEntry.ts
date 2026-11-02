import type { CseOpinionStepRoute } from "~/modules/routes";
import { cseOpinionStepHref } from "~/modules/routes";
import { type DbOpinionRow, mapOpinionsFromDb } from "./mapOpinionsFromDb";

export function getImpersonationCseOpinionEntryHref(
	rows: DbOpinionRow[],
): CseOpinionStepRoute {
	return cseOpinionStepHref(mapOpinionsFromDb(rows) ? 2 : 1);
}
