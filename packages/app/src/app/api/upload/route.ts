import { AUDIT_ACTIONS, type AuditActionKey } from "~/modules/audit";
import { getCurrentYear } from "~/modules/domain";
import { parseSiren } from "~/modules/shared/parseSiren";
import {
	ALLOWED_UPLOAD_MIME_TYPES,
	type FlowType,
} from "~/modules/shared/uploadConfig";
import { logAction } from "~/server/audit/log";
import {
	buildRequestContext,
	type RequestContext,
} from "~/server/audit/requestContext";
import { auth } from "~/server/auth";
import {
	type PipelineFailureReason,
	runUploadPipeline,
	type UploadPipelineResult,
} from "~/server/services/uploadPipeline";

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

	const year = getCurrentYear();

	let result: UploadPipelineResult;
	try {
		result = await runUploadPipeline({
			siren,
			year,
			fileName,
			contentType,
			stream: request.body,
			flowType,
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
			metadata: {
				flowType,
				fileId: result.fileId,
				fileName: result.fileName,
			},
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});
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

function mapFailureToHttp(reason: PipelineFailureReason): {
	status: number;
	errorMessage: string;
} {
	switch (reason) {
		case "not_found":
			return { status: 403, errorMessage: "HTTP 403 declaration_not_found" };
		case "max_files":
			return { status: 400, errorMessage: "HTTP 400 max_files" };
		case "too_large":
			return { status: 400, errorMessage: "HTTP 400 too_large" };
		case "wrong_type":
			return { status: 400, errorMessage: "HTTP 400 wrong_type" };
		case "empty":
			return { status: 400, errorMessage: "HTTP 400 empty_file" };
		case "virus":
			return { status: 422, errorMessage: "HTTP 422 virus_detected" };
		case "scan_unavailable":
			return { status: 503, errorMessage: "HTTP 503 antivirus_unavailable" };
		case "server_error":
			return { status: 500, errorMessage: "HTTP 500 server_error" };
	}
}

type AuditFailureInput = {
	action: AuditActionKey;
	flowType: FlowType;
	fileName: string | null;
	fileId: string | null;
	errorMessage: string;
	userId: string | null;
	userEmail: string | null;
	siren: string | null;
	requestContext: RequestContext;
	startedAt: number;
	virusName?: string | null;
	s3Cleanup?: "ok" | "failed" | null;
};

function writeFailure({
	action,
	flowType,
	fileName,
	fileId,
	errorMessage,
	userId,
	userEmail,
	siren,
	requestContext,
	startedAt,
	virusName = null,
	s3Cleanup = null,
}: AuditFailureInput): void {
	const metadata: Record<string, unknown> = { flowType };
	if (fileName) metadata.fileName = fileName;
	if (fileId) metadata.fileId = fileId;
	if (virusName) metadata.virusName = virusName;
	if (s3Cleanup) metadata.s3Cleanup = s3Cleanup;

	void logAction({
		action,
		status: "failure",
		userId,
		userEmail,
		siren,
		metadata,
		errorMessage,
		ipAddress: requestContext.ipAddress,
		userAgent: requestContext.userAgent,
		durationMs: Date.now() - startedAt,
	});
}
