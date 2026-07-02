import { and, eq } from "drizzle-orm";
import { AUDIT_ACTIONS, type AuditActionKey } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { validateFileName } from "~/modules/shared/fileNameValidation";
import { parseSiren } from "~/modules/shared/parseSiren";
import {
	ALLOWED_UPLOAD_MIME_TYPES,
	type FlowType,
} from "~/modules/shared/uploadConfig";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { declarations } from "~/server/db/schema";
import { getActiveLock } from "~/server/services/declarationLockService";
import {
	runUploadPipeline,
	type UploadPipelineResult,
} from "~/server/services/uploadPipeline";
import {
	mapFailureToHttp,
	uploadAuditMetadataSchema,
	writeFailure,
} from "./uploadAudit";

const FLOW_TO_ACTION: Record<FlowType, AuditActionKey> = {
	cse_opinion: AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE,
	joint_evaluation: AUDIT_ACTIONS.JOINT_EVALUATION_UPLOAD_FILE,
};

function isFlowType(value: string | null): value is FlowType {
	return value !== null && value in FLOW_TO_ACTION;
}

/**
 * POST /api/upload
 *
 * Unified upload endpoint for both CSE opinion and joint evaluation files.
 * The target flow is selected via the `X-Flow-Type` header. The handler runs
 * the full pipeline (auth → pre-validation → stream with ClamAV + S3 → DB
 * insert → compensating delete on failure) server-side in one request, so
 * there is no orphan blob window and no bandwidth waste on pre-validation
 * failures.
 *
 * Error taxonomy:
 *  - 401 — no session or no SIREN
 *  - 400 — missing/invalid headers, wrong type, too large, empty file
 *  - 403 — declaration for current year not found (not owned by session SIREN)
 *  - 400 — cse_opinion max files reached
 *  - 422 — ClamAV detected a virus (body includes `virus` name)
 *  - 499 — client closed the request before the upload finished
 *  - 503 — ClamAV unreachable / timed out (transient, user should retry)
 *  - 500 — S3 or DB failure after stream; compensating delete attempted
 *
 * Exactly one row is written to `audit.action_log` per request, using the
 * flow-specific action key (`cse_opinion.upload_file` or
 * `joint_evaluation.upload_file`) so the retention and queryability match
 * what the tRPC mutations used to produce.
 */
export async function POST(request: Request): Promise<Response> {
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);

	// Flow type is parsed first so the audit action key is known for every
	// failure path below. A missing/invalid flow header short-circuits with a
	// 400 and no audit row — it is a malformed request, not an authenticated
	// user action worth tracking.
	const flowHeader = request.headers.get("x-flow-type");
	const flowType = isFlowType(flowHeader) ? flowHeader : null;
	if (!flowType) {
		return Response.json(
			{
				error:
					"En-tête X-Flow-Type manquant ou invalide (cse_opinion | joint_evaluation)",
			},
			{ status: 400 },
		);
	}

	const action = FLOW_TO_ACTION[flowType];

	const session = await auth();
	const siren = parseSiren(session?.user?.siret);
	if (!session?.user || !siren) {
		writeFailure({
			action,
			flowType,
			fileName: request.headers.get("x-filename"),
			fileId: null,
			errorMessage: "HTTP 401",
			userId: session?.user?.id ?? null,
			userEmail: session?.user?.email ?? null,
			siren: null,
			requestContext,
			startedAt,
		});
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	const userId = session.user.id ?? null;
	const userEmail = session.user.email ?? null;

	// Admin impersonation is a read-only support mode: file uploads are
	// refused server-side (UI hides the button) so the admin cannot write
	// files in the user's name (issue #3230).
	if (session.user.impersonation) {
		writeFailure({
			action,
			flowType,
			fileName: request.headers.get("x-filename"),
			fileId: null,
			errorMessage: "HTTP 403 impersonation_read_only",
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{
				error:
					"Mode mimoquage actif : l'envoi de fichier est désactivé en lecture seule.",
			},
			{ status: 403 },
		);
	}

	const fileName = request.headers.get("x-filename");
	if (!fileName) {
		writeFailure({
			action,
			flowType,
			fileName: null,
			fileId: null,
			errorMessage: "HTTP 400 missing_filename",
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{ error: "En-tête X-Filename manquant" },
			{ status: 400 },
		);
	}

	if (!request.body) {
		writeFailure({
			action,
			flowType,
			fileName,
			fileId: null,
			errorMessage: "HTTP 400 empty_body",
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{ error: "Corps de la requête vide" },
			{ status: 400 },
		);
	}

	const contentType =
		request.headers.get("content-type") ?? "application/octet-stream";

	const isAllowedType = (
		ALLOWED_UPLOAD_MIME_TYPES as readonly string[]
	).includes(contentType);
	if (!isAllowedType) {
		writeFailure({
			action,
			flowType,
			fileName,
			fileId: null,
			errorMessage: "HTTP 400 wrong_content_type",
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{
				error: `Type de fichier non autorisé : ${contentType}. Types acceptés : ${ALLOWED_UPLOAD_MIME_TYPES.join(", ")}.`,
			},
			{ status: 400 },
		);
	}

	const fileNameValidation = validateFileName(fileName, contentType);
	if (!fileNameValidation.ok) {
		writeFailure({
			action,
			flowType,
			fileName,
			fileId: null,
			errorMessage: `HTTP 400 invalid_filename: ${fileNameValidation.reason}`,
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{ reason: "invalid_filename", error: fileNameValidation.message },
			{ status: 400 },
		);
	}

	// Persist the normalised (trimmed) name; validation already ran on it.
	const safeFileName = fileName.trim();
	const year = getCurrentYear();

	// Collaborative edit lock. This route is not tRPC, so the lock
	// is enforced inline against the service rather than via the
	// `declarationLockedWriteProcedure` middleware. The upload is refused when
	// another co-declarant holds an active lock on the same declaration; a free
	// lock (or one held by this user) lets the upload proceed. The check runs
	// before the body is streamed so no bandwidth is wasted on a locked target.
	const declarationRows = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
		.limit(1);
	const lockedDeclarationId = declarationRows[0]?.id;
	if (lockedDeclarationId) {
		const lock = await getActiveLock(db, lockedDeclarationId);
		if (lock && lock.userId !== userId) {
			writeFailure({
				action,
				flowType,
				fileName,
				fileId: null,
				errorMessage: "HTTP 409 locked_by_other",
				userId,
				userEmail,
				siren,
				requestContext,
				startedAt,
			});
			return Response.json(
				{ error: "Déclaration verrouillée par un autre utilisateur." },
				{ status: 409 },
			);
		}
	}

	let result: UploadPipelineResult;
	try {
		result = await runUploadPipeline({
			siren,
			year,
			fileName: safeFileName,
			contentType,
			stream: request.body,
			flowType,
			signal: request.signal,
		});
	} catch (error) {
		console.error("[api/upload]", error);
		writeFailure({
			action,
			flowType,
			fileName,
			fileId: null,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			userId,
			userEmail,
			siren,
			requestContext,
			startedAt,
		});
		return Response.json(
			{ error: "Erreur lors de l'upload du fichier" },
			{ status: 500 },
		);
	}

	if (result.ok) {
		void logAction({
			action,
			status: "success",
			userId,
			userEmail,
			siren,
			metadata: uploadAuditMetadataSchema.parse({
				flowType,
				fileId: result.fileId,
				fileName: result.fileName,
			}),
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
		if (userEmail) {
			void (async () => {
				if (flowType === "cse_opinion") {
					const { enqueueReceipt } = await import("~/modules/mail/server");
					await enqueueReceipt({
						kind: "cseOpinion",
						to: userEmail,
						siren,
						year,
						userId,
						isResend: false,
					});
					return;
				}
				if (flowType === "joint_evaluation") {
					const { enqueueReceipt } = await import("~/modules/mail/server");
					await enqueueReceipt({
						kind: "jointEvaluation",
						to: userEmail,
						siren,
						year,
						userId,
						isResend: false,
					});
				}
			})();
		}
		return Response.json({
			fileId: result.fileId,
			fileName: result.fileName,
		});
	}

	const { status, errorMessage } = mapFailureToHttp(result.reason);
	writeFailure({
		action,
		flowType,
		fileName,
		fileId: null,
		errorMessage,
		userId,
		userEmail,
		siren,
		requestContext,
		startedAt,
		virusName: result.virusName ?? null,
		s3Cleanup: result.s3Cleanup ?? null,
	});

	return Response.json(
		{
			error: result.error,
			reason: result.reason,
			virus: result.virusName,
		},
		{ status },
	);
}
