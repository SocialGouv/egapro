import "server-only";

import { eq } from "drizzle-orm";

import { computeRequiredContentTypes } from "~/modules/cseOpinion/contentTypeColumns";
import { computeGapHighFlags } from "~/modules/cseOpinion/gapHighFlags";
import type { ContentTypeKey } from "~/modules/cseOpinion/types";
import { getCurrentRound } from "~/server/api/routers/statusHistoryHelpers";
import type { db as database } from "~/server/db";
import {
	cseOpinions,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

/** The root client or an open transaction — both expose the reads used here. */
type Database = Pick<typeof database, "select">;

/**
 * Content types the parcours requires for a declaration, read from the DB.
 *
 * Single source of truth shared by the finalize guard (every required type must
 * be associated) and the upload quota (never more files than required types):
 * the matrix rendered in Step 2 offers exactly these columns, so neither guard
 * can drift from what the user is shown.
 */
export async function getRequiredContentTypes(
	db: Database,
	declarationId: string,
): Promise<ContentTypeKey[]> {
	const opinions = await db
		.select({
			declarationNumber: cseOpinions.declarationNumber,
			type: cseOpinions.type,
			gapConsulted: cseOpinions.gapConsulted,
		})
		.from(cseOpinions)
		.where(eq(cseOpinions.declarationId, declarationId));

	// Same gap >= 5% signal as the Step 2 matrix (page.tsx): the Justification
	// type is only required when the declaration actually has a gap, so the
	// guards never demand an association the matrix does not offer.
	const categories = await db
		.select({
			declarationType: employeeCategories.declarationType,
			annualBaseWomen: employeeCategories.annualBaseWomen,
			annualBaseMen: employeeCategories.annualBaseMen,
			annualVariableWomen: employeeCategories.annualVariableWomen,
			annualVariableMen: employeeCategories.annualVariableMen,
			hourlyBaseWomen: employeeCategories.hourlyBaseWomen,
			hourlyBaseMen: employeeCategories.hourlyBaseMen,
			hourlyVariableWomen: employeeCategories.hourlyVariableWomen,
			hourlyVariableMen: employeeCategories.hourlyVariableMen,
		})
		.from(employeeCategories)
		.innerJoin(
			jobCategories,
			eq(employeeCategories.jobCategoryId, jobCategories.id),
		)
		.where(eq(jobCategories.declarationId, declarationId));

	// Same event as the Step 2 matrix (page.tsx reads
	// declarationData.hasSubmittedSecondDeclaration, sourced from this same
	// event): deriving it from cseOpinions rows instead drifted from the matrix
	// whenever the second declaration was submitted before Step 1 CSE opinions
	// were (re)saved with round-2 data, letting the page open a second-column
	// dropzone the quota still capped at round 1 (#4299).
	const hasSecondDeclaration = (await getCurrentRound(db, declarationId)) === 2;

	const gapConsultedFirst = opinions.find(
		(opinion) => opinion.declarationNumber === 1 && opinion.type === "gap",
	)?.gapConsulted;
	const gapConsultedSecond = opinions.find(
		(opinion) => opinion.declarationNumber === 2 && opinion.type === "gap",
	)?.gapConsulted;

	const { firstDeclGapHigh, secondDeclGapHigh } =
		computeGapHighFlags(categories);
	return computeRequiredContentTypes({
		hasSecondDeclaration,
		firstDeclGapConsulted: gapConsultedFirst ?? null,
		secondDeclGapConsulted: gapConsultedSecond ?? null,
		firstDeclGapHigh,
		secondDeclGapHigh,
	});
}
