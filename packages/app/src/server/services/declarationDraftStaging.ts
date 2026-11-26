import "server-only";

import { and, eq } from "drizzle-orm";

import {
	parseStagedJointUpload,
	parseStagedSecondDeclaration,
	STAGED_JOINT_UPLOAD_KIND,
	STAGED_JOINT_UPLOAD_STEP,
	STAGED_SECOND_DECLARATION_KIND,
	STAGED_SECOND_DECLARATION_STEP,
	type StagedJointUpload,
	type StagedSecondDeclaration,
} from "~/modules/declaration-remuneration";
import { DRAFT_EXPIRY_DAYS } from "~/modules/domain";
import type { DB } from "~/server/db";
import { declarations, files } from "~/server/db/schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type DbOrTx = DB | Tx;

/** The two draft columns of a declaration row, already read under lock. */
export type DraftSnapshot = {
	draft: unknown;
	draftUpdatedAt: Date | null;
};

const DRAFT_TTL_MS = DRAFT_EXPIRY_DAYS * 24 * 3600 * 1000;

function isExpired(snapshot: DraftSnapshot): boolean {
	return (
		!(snapshot.draftUpdatedAt instanceof Date) ||
		Date.now() - snapshot.draftUpdatedAt.getTime() > DRAFT_TTL_MS
	);
}

function asRecord(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

function mergeDraftStep(
	snapshot: DraftSnapshot,
	kind: string,
	step: string,
	data: Record<string, unknown>,
): Record<string, unknown> {
	// An expired draft is dead: it is not shown by `declarationDraft.get`, so it
	// must not be merged into either.
	const current = isExpired(snapshot) ? {} : asRecord(snapshot.draft);
	const kindData = asRecord(current[kind]);
	return { ...current, [kind]: { ...kindData, [step]: data } };
}

/**
 * A closed démarche keeps its transmitted data readable while the déposant
 * edits it: the edit is staged in `declarations.draft` under its own step, so
 * the canonical rows (and therefore the PDF, the exports and the admin views)
 * only change when the déposant transmits again.
 */
export function readStagedSecondDeclaration(
	snapshot: DraftSnapshot,
): StagedSecondDeclaration | null {
	if (isExpired(snapshot)) return null;
	return parseStagedSecondDeclaration(snapshot.draft);
}

export function readStagedJointUpload(
	snapshot: DraftSnapshot,
): StagedJointUpload | null {
	if (isExpired(snapshot)) return null;
	return parseStagedJointUpload(snapshot.draft);
}

export async function writeStagedSecondDeclaration(
	database: DbOrTx,
	declarationId: string,
	snapshot: DraftSnapshot,
	staged: StagedSecondDeclaration,
): Promise<void> {
	await database
		.update(declarations)
		.set({
			draft: mergeDraftStep(
				snapshot,
				STAGED_SECOND_DECLARATION_KIND,
				STAGED_SECOND_DECLARATION_STEP,
				staged,
			),
			draftUpdatedAt: new Date(),
		})
		.where(eq(declarations.id, declarationId));
}

/**
 * Stages a joint-evaluation report without touching the transmitted row.
 * Returns the S3 path of the previously staged report, if any, so the caller
 * can best-effort delete the blob it replaces.
 */
export async function writeStagedJointUpload(
	database: DbOrTx,
	declarationId: string,
	snapshot: DraftSnapshot,
	staged: StagedJointUpload,
): Promise<string | null> {
	const previous = isExpired(snapshot) ? null : readStagedJointUpload(snapshot);

	await database
		.update(declarations)
		.set({
			draft: mergeDraftStep(
				snapshot,
				STAGED_JOINT_UPLOAD_KIND,
				STAGED_JOINT_UPLOAD_STEP,
				staged,
			),
			draftUpdatedAt: new Date(),
		})
		.where(eq(declarations.id, declarationId));

	return previous?.filePath ?? null;
}

export async function loadDraftSnapshot(
	database: DbOrTx,
	declarationId: string,
): Promise<DraftSnapshot> {
	const [row] = await database
		.select({
			draft: declarations.draft,
			draftUpdatedAt: declarations.draftUpdatedAt,
		})
		.from(declarations)
		.where(eq(declarations.id, declarationId))
		.limit(1);
	return {
		draft: row?.draft ?? null,
		draftUpdatedAt: row?.draftUpdatedAt ?? null,
	};
}

export type StagedJointPromotion = {
	promoted: boolean;
	replacedFilePath: string | null;
};

/**
 * Turns the staged report into the transmitted one: the previous row is
 * replaced so the partial unique index (`file_joint_eval_unique`) keeps
 * holding, and the caller deletes the replaced S3 object after commit.
 */
export async function promoteStagedJointEvaluation(
	tx: Tx,
	declarationId: string,
	snapshot: DraftSnapshot,
): Promise<StagedJointPromotion> {
	const staged = readStagedJointUpload(snapshot);
	if (!staged) return { promoted: false, replacedFilePath: null };

	const [existing] = await tx
		.select({ id: files.id, filePath: files.filePath })
		.from(files)
		.where(
			and(
				eq(files.declarationId, declarationId),
				eq(files.type, "joint_evaluation"),
			),
		)
		.limit(1);

	if (existing) {
		await tx.delete(files).where(eq(files.id, existing.id));
	}

	await tx.insert(files).values({
		id: staged.fileId,
		declarationId,
		fileName: staged.fileName,
		filePath: staged.filePath,
		type: "joint_evaluation",
		uploadedAt: new Date(staged.uploadedAt),
	});

	return { promoted: true, replacedFilePath: existing?.filePath ?? null };
}
