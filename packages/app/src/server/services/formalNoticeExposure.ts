import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type { DB } from "~/server/db";
import { cseOpinions, declarations, files } from "~/server/db/schema";
import {
	canApplyAction,
	type Facts,
	isKnownRulesVersion,
	loadRules,
} from "~/server/rules/engine";

export const FORMAL_NOTICE_ACTION = "submit_formal_notice_joint_evaluation";

type Reader = Pick<DB, "select">;

type DeclarationRow = typeof declarations.$inferSelect;

export type FormalNoticeDeclaration = Pick<
	DeclarationRow,
	| "id"
	| "status"
	| "rulesVersion"
	| "cseRequired"
	| "firstDeclarationPathChoice"
	| "secondDeclarationPathChoice"
>;

export type GapCseOpinions = {
	first: string | null;
	second: string | null;
};

const NO_GAP_OPINIONS: GapCseOpinions = { first: null, second: null };

export function buildFormalNoticeFacts(
	declaration: FormalNoticeDeclaration,
	gapOpinions: GapCseOpinions,
): Facts {
	return {
		currentState: declaration.status,
		cseRequired: declaration.cseRequired,
		firstDeclarationPathChoice: declaration.firstDeclarationPathChoice,
		secondDeclarationPathChoice: declaration.secondDeclarationPathChoice,
		firstDeclarationGapCseOpinion: gapOpinions.first,
		secondDeclarationGapCseOpinion: gapOpinions.second,
	};
}

export function isFormalNoticeAvailable(
	declaration: FormalNoticeDeclaration,
	gapOpinions: GapCseOpinions,
): boolean {
	if (!isKnownRulesVersion(declaration.rulesVersion)) return false;
	return canApplyAction(
		buildFormalNoticeFacts(declaration, gapOpinions),
		FORMAL_NOTICE_ACTION,
		loadRules(declaration.rulesVersion),
	);
}

export async function loadGapCseOpinions(
	database: Reader,
	declarationIds: string[],
): Promise<Map<string, GapCseOpinions>> {
	const opinionsByDeclaration = new Map<string, GapCseOpinions>();
	if (declarationIds.length === 0) return opinionsByDeclaration;

	const rows = await database
		.select({
			declarationId: cseOpinions.declarationId,
			declarationNumber: cseOpinions.declarationNumber,
			opinion: cseOpinions.opinion,
		})
		.from(cseOpinions)
		.where(
			and(
				inArray(cseOpinions.declarationId, declarationIds),
				eq(cseOpinions.type, "gap"),
			),
		);

	for (const row of rows) {
		const current =
			opinionsByDeclaration.get(row.declarationId) ?? NO_GAP_OPINIONS;
		opinionsByDeclaration.set(
			row.declarationId,
			row.declarationNumber === 1
				? { ...current, first: row.opinion }
				: { ...current, second: row.opinion },
		);
	}
	return opinionsByDeclaration;
}

export async function loadGapCseOpinionsFor(
	database: Reader,
	declarationId: string,
): Promise<GapCseOpinions> {
	const opinions = await loadGapCseOpinions(database, [declarationId]);
	return opinions.get(declarationId) ?? NO_GAP_OPINIONS;
}

export async function isFormalNoticeAvailableFor(
	database: Reader,
	declarationId: string,
): Promise<boolean> {
	const [declaration] = await database
		.select({
			id: declarations.id,
			status: declarations.status,
			rulesVersion: declarations.rulesVersion,
			cseRequired: declarations.cseRequired,
			firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
			secondDeclarationPathChoice: declarations.secondDeclarationPathChoice,
		})
		.from(declarations)
		.where(eq(declarations.id, declarationId))
		.limit(1);
	if (!declaration) return false;
	return isFormalNoticeAvailable(
		declaration,
		await loadGapCseOpinionsFor(database, declarationId),
	);
}

export async function findFormalNoticeFile(
	database: Reader,
	declarationId: string,
): Promise<{ id: string; fileName: string; uploadedAt: Date } | null> {
	const [file] = await database
		.select({
			id: files.id,
			fileName: files.fileName,
			uploadedAt: files.uploadedAt,
		})
		.from(files)
		.where(
			and(
				eq(files.declarationId, declarationId),
				eq(files.type, "formal_notice_joint_evaluation"),
			),
		)
		.limit(1);
	return file ?? null;
}
