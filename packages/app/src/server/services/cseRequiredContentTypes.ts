import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import {
	computeJustificationRequirements,
	computeRequiredContentTypes,
} from "~/modules/cseOpinion/contentTypeColumns";
import type { ContentTypeKey } from "~/modules/cseOpinion/types";
import { computeGapHighFlags } from "~/modules/domain";
import { getCurrentRound } from "~/server/api/routers/statusHistoryHelpers";
import type { db as database } from "~/server/db";
import {
	cseOpinionFiles,
	declarations,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

/** The root client or an open transaction — both expose the reads used here. */
type Database = Pick<typeof database, "select">;
type WritableDatabase = Pick<typeof database, "select" | "delete">;

export async function getJustificationRequirements(
	db: Database,
	declarationId: string,
) {
	const [declaration] = await db
		.select({
			firstDeclarationGapJustification:
				declarations.firstDeclarationGapJustification,
			secondDeclarationGapJustification:
				declarations.secondDeclarationGapJustification,
		})
		.from(declarations)
		.where(eq(declarations.id, declarationId))
		.limit(1);

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

	return computeJustificationRequirements({
		firstDeclarationGapJustification:
			declaration?.firstDeclarationGapJustification ?? null,
		secondDeclarationGapJustification:
			declaration?.secondDeclarationGapJustification ?? null,
		...computeGapHighFlags(categories),
	});
}

export async function getRequiredContentTypes(
	db: Database,
	declarationId: string,
): Promise<ContentTypeKey[]> {
	const requirements = await getJustificationRequirements(db, declarationId);
	const hasSecondDeclaration = (await getCurrentRound(db, declarationId)) === 2;

	return computeRequiredContentTypes({
		hasSecondDeclaration,
		...requirements,
	});
}

export function contentTypeKey(declarationNumber: number, type: string) {
	return `${declarationNumber}:${type}`;
}

type StoredAssociation = {
	id: string;
	declarationNumber: number;
	type: string;
};

export function findStaleAssociationIds(
	required: ContentTypeKey[],
	associations: StoredAssociation[],
): string[] {
	const requiredKeys = new Set(
		required.map((spec) => contentTypeKey(spec.declarationNumber, spec.type)),
	);
	return associations
		.filter(
			(association) =>
				!requiredKeys.has(
					contentTypeKey(association.declarationNumber, association.type),
				),
		)
		.map((association) => association.id);
}

export async function pruneStaleContentTypeAssociations(
	db: WritableDatabase,
	declarationId: string,
): Promise<void> {
	const required = await getRequiredContentTypes(db, declarationId);

	const associations = await db
		.select({
			id: cseOpinionFiles.id,
			declarationNumber: cseOpinionFiles.declarationNumber,
			type: cseOpinionFiles.type,
		})
		.from(cseOpinionFiles)
		.where(eq(cseOpinionFiles.declarationId, declarationId));

	const staleIds = findStaleAssociationIds(required, associations);
	if (staleIds.length === 0) return;

	await db
		.delete(cseOpinionFiles)
		.where(
			and(
				eq(cseOpinionFiles.declarationId, declarationId),
				inArray(cseOpinionFiles.id, staleIds),
			),
		);
}
