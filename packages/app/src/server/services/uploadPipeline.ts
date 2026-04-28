import "server-only";

import { and, count, eq } from "drizzle-orm";

import { MAX_CSE_FILES } from "~/modules/cseOpinion/types";
import {
	ALLOWED_UPLOAD_MIME_TYPES,
	type FlowType,
	UPLOAD_REQUEST_TIMEOUT_MS,
} from "~/modules/shared/uploadConfig";
import { db } from "~/server/db";
import { declarations, files } from "~/server/db/schema";

import { handleStreamingUpload, type UploadFailureReason } from "./fileUpload";
import { deleteFile as deleteS3File } from "./s3";

export type { FlowType };

export type PipelineFailureReason =
	| UploadFailureReason
	| "not_found"
	| "max_files"
	| "server_error";

type SuccessResult = {
	ok: true;
	fileId: string;
	fileName: string;
	filePath: string;
};

type FailureResult = {
	ok: false;
	reason: PipelineFailureReason;
	error: string;
	virusName?: string;
	/**
	 * Indicates whether a compensating delete of the newly-committed S3 object
	 * was needed (DB insert failed after the stream), and whether it succeeded.
	 * Omitted when no S3 object was committed.
	 */
	s3Cleanup?: "ok" | "failed";
};

export type UploadPipelineResult = SuccessResult | FailureResult;

export type UploadPipelineInput = {
	siren: string;
	year: number;
	fileName: string;
	contentType: string;
	stream: ReadableStream<Uint8Array>;
	flowType: FlowType;
	/**
	 * Abort signal from the HTTP request. Combined with a pipeline-level
	 * timeout and forwarded to clamd + S3 so a client disconnect or hung
	 * socket aborts the whole stream instead of tying up the request.
	 */
	signal?: AbortSignal;
};

/**
 * Server-side atomic upload pipeline.
 *
 * Runs, in order:
 *   1. Resolve the current declaration for `(siren, year)` (404 on miss).
 *   2. Pre-validate flow-specific constraints (`cse_opinion` → max 4 files).
 *   3. Stream the file through {@link handleStreamingUpload} (magic bytes,
 *      ClamAV INSTREAM in parallel with S3 multipart).
 *   4. On a clean scan, insert the `files` row in a transaction that also
 *      applies the flow-specific write semantics:
 *        - `cse_opinion`: re-check the file count inside the tx, then insert.
 *        - `joint_evaluation`: delete any existing row, then insert (upsert).
 *   5. If the DB write fails *after* the S3 commit, best-effort
 *      {@link deleteS3File} the newly-committed object so no orphan blob is
 *      left behind, and surface the failure as `server_error` with a
 *      `s3Cleanup` status.
 *   6. For joint evaluation only: after a successful commit, best-effort
 *      delete the replaced S3 object (outside the tx) so the previous file is
 *      cleaned up.
 *
 * This function is the single source of truth for upload correctness. The
 * HTTP route handler is intentionally thin — it only maps the result to an
 * HTTP status code and writes one audit row.
 */
export async function runUploadPipeline(
	input: UploadPipelineInput,
): Promise<UploadPipelineResult> {
	const declaration = await findCurrentDeclaration(input.siren, input.year);
	if (!declaration) {
		return {
			ok: false,
			reason: "not_found",
			error: "Déclaration introuvable pour l'année en cours.",
		};
	}

	// Pre-validate flow-specific constraints BEFORE streaming. Cheap DB read
	// that saves bandwidth when the constraint is already violated.
	if (input.flowType === "cse_opinion") {
		const existingCount = await countFilesByType(declaration.id, "cse_opinion");
		if (existingCount >= MAX_CSE_FILES) {
			return {
				ok: false,
				reason: "max_files",
				error: `Vous avez atteint la limite de ${MAX_CSE_FILES} fichiers. Supprimez-en un avant d'en ajouter un nouveau.`,
			};
		}
	}

	const pipelineSignal = combineSignals(input.signal);

	const streamResult = await handleStreamingUpload(input.stream, {
		siren: input.siren,
		year: input.year,
		fileName: input.fileName,
		contentType: input.contentType,
		allowedMimeTypes: ALLOWED_UPLOAD_MIME_TYPES,
		signal: pipelineSignal,
	});

	if (!streamResult.ok) {
		return {
			ok: false,
			reason: streamResult.reason,
			error: streamResult.error,
			virusName: streamResult.virusName,
		};
	}

	// S3 object is now committed. Any failure from here on must trigger a
	// compensating delete to avoid orphan blobs.
	try {
		const { fileId, replacedFilePath } = await commitFileRow({
			declarationId: declaration.id,
			flowType: input.flowType,
			fileId: streamResult.fileId,
			fileName: input.fileName,
			filePath: streamResult.key,
		});

		// Best-effort cleanup of the file that was replaced by the upsert.
		// A failure here does not fail the upload — the new file is already
		// the source of truth and the old blob becomes a harmless orphan.
		if (replacedFilePath) {
			void deleteS3File(replacedFilePath).catch((err) => {
				console.error(
					"[uploadPipeline] best-effort delete of replaced file failed",
					{ filePath: replacedFilePath, err },
				);
			});
		}

		return {
			ok: true,
			fileId,
			fileName: input.fileName,
			filePath: streamResult.key,
		};
	} catch (dbError) {
		console.error("[uploadPipeline] DB write failed after S3 commit", dbError);

		let s3Cleanup: "ok" | "failed" = "ok";
		try {
			await deleteS3File(streamResult.key);
		} catch (deleteError) {
			s3Cleanup = "failed";
			console.error(
				"[uploadPipeline] compensating delete failed — S3 object orphaned",
				{ key: streamResult.key, err: deleteError },
			);
		}

		return {
			ok: false,
			reason: "server_error",
			error: "Erreur lors de l'enregistrement du fichier.",
			s3Cleanup,
		};
	}
}

async function findCurrentDeclaration(
	siren: string,
	year: number,
): Promise<{ id: string } | null> {
	const rows = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
		.limit(1);
	return rows[0] ?? null;
}

async function countFilesByType(
	declarationId: string,
	type: FlowType,
): Promise<number> {
	const rows = await db
		.select({ value: count() })
		.from(files)
		.where(and(eq(files.declarationId, declarationId), eq(files.type, type)));
	return rows[0]?.value ?? 0;
}

type CommitFileInput = {
	declarationId: string;
	flowType: FlowType;
	fileId: string;
	fileName: string;
	filePath: string;
};

type CommitFileResult = {
	fileId: string;
	/** S3 key of the previously-stored file that was replaced by the upsert. */
	replacedFilePath: string | null;
};

async function commitFileRow(
	input: CommitFileInput,
): Promise<CommitFileResult> {
	return db.transaction(async (tx) => {
		// Lock the declaration row for the duration of the transaction. Any
		// concurrent upload targeting the same declaration blocks here until
		// this tx commits — closing the TOCTOU race where two parallel CSE
		// uploads could both observe `count < MAX_CSE_FILES` and both insert.
		// Joint evaluation already has a partial unique index at the DB level
		// (`file_joint_eval_unique`), but the CSE quota has no such guard.
		await tx
			.select({ id: declarations.id })
			.from(declarations)
			.where(eq(declarations.id, input.declarationId))
			.for("update")
			.limit(1);

		let replacedFilePath: string | null = null;

		if (input.flowType === "joint_evaluation") {
			// Upsert: one file per declaration. Capture the previous path so the
			// caller can best-effort delete it from S3 after the tx commits.
			const existing = await tx
				.select({ id: files.id, filePath: files.filePath })
				.from(files)
				.where(
					and(
						eq(files.declarationId, input.declarationId),
						eq(files.type, "joint_evaluation"),
					),
				)
				.limit(1);
			if (existing[0]) {
				replacedFilePath = existing[0].filePath;
				await tx.delete(files).where(eq(files.id, existing[0].id));
			}
		} else {
			// Re-check the count under the same transaction — another concurrent
			// upload could have raced past the pre-validation.
			const rows = await tx
				.select({ value: count() })
				.from(files)
				.where(
					and(
						eq(files.declarationId, input.declarationId),
						eq(files.type, "cse_opinion"),
					),
				);
			const currentCount = rows[0]?.value ?? 0;
			if (currentCount >= MAX_CSE_FILES) {
				throw new MaxFilesReachedError();
			}
		}

		await tx.insert(files).values({
			id: input.fileId,
			declarationId: input.declarationId,
			fileName: input.fileName,
			filePath: input.filePath,
			type: input.flowType,
		});

		return { fileId: input.fileId, replacedFilePath };
	});
}

/**
 * Thrown inside the DB transaction when a concurrent upload has already filled
 * the CSE-opinion quota between the pre-check and the tx. Surfaced as a
 * `server_error` by the caller because the S3 object has already been
 * committed and must be compensated.
 */
export class MaxFilesReachedError extends Error {
	constructor() {
		super("Max files reached (race condition)");
	}
}

/**
 * Combine the incoming request signal with a pipeline-level timeout. Either
 * one firing aborts the clamd + S3 streams. Requires Node 20+ (native
 * AbortSignal.any + AbortSignal.timeout).
 */
function combineSignals(requestSignal: AbortSignal | undefined): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(UPLOAD_REQUEST_TIMEOUT_MS);
	if (!requestSignal) return timeoutSignal;
	return AbortSignal.any([requestSignal, timeoutSignal]);
}
