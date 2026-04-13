import { AUDIT_ACTIONS, type AuditActionKey } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { fetchFileById, fetchFileBySiren } from "~/modules/export";
import { logAction } from "~/server/audit/log";
import {
	buildRequestContext,
	type RequestContext,
} from "~/server/audit/requestContext";
import { auth } from "~/server/auth";
import { streamStoredFile } from "~/server/services/fileStreaming";
import { verifySuitAuth } from "~/server/services/suitApiAuth";

/**
 * GET /api/v1/files/:fileId
 *
 * Unified file-streaming endpoint serving three caller types:
 *  - SUIT REST API consumers (signed request + Bearer key, attachment, no SIREN scope)
 *  - Admin backoffice users (NextAuth session + isAdmin, attachment, no SIREN scope)
 *  - In-app authenticated users (NextAuth session, inline, SIREN-scoped)
 *
 * Caller detection:
 *  - `x-signature` header → SUIT (always signs, browsers never do)
 *  - otherwise → session-based (admin vs. regular decided by `isAdmin` flag)
 *
 * Each branch logs to the audit trail with its own action key.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ fileId: string }> },
) {
	const { fileId } = await params;

	return isSuitCall(request)
		? handleSuitDownload(request, fileId)
		: handleSessionDownload(request, fileId);
}

function isSuitCall(request: Request): boolean {
	return request.headers.has("x-signature");
}

async function handleSuitDownload(
	request: Request,
	fileId: string,
): Promise<Response> {
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);

	const authError = verifySuitAuth(request);
	if (authError) {
		writeAuditFailure({
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			fileId,
			errorMessage: `HTTP ${authError.status}`,
			requestContext,
			startedAt,
		});
		return authError;
	}

	try {
		const file = await fetchFileById(fileId);
		if (!file) {
			writeAuditFailure({
				action: AUDIT_ACTIONS.EXPORT_API_FILES,
				fileId,
				errorMessage: "HTTP 404",
				requestContext,
				startedAt,
			});
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const response = await streamStoredFile({
			filePath: file.filePath,
			fileName: file.fileName,
			disposition: "attachment",
			cacheControl: "private, max-age=3600",
		});

		void logAction({
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			status: "success",
			metadata: { fileId, fileName: file.fileName },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return response;
	} catch (error) {
		console.error("[api/v1/files/:fileId][suit]", error);
		writeAuditFailure({
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			fileId,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			requestContext,
			startedAt,
		});
		return Response.json(
			{ error: "Erreur lors du téléchargement du fichier" },
			{ status: 500 },
		);
	}
}

/**
 * Session-based download: dispatches to admin (no SIREN scope) or regular user
 * (SIREN-scoped) based on `isAdmin` flag.
 */
async function handleSessionDownload(
	request: Request,
	fileId: string,
): Promise<Response> {
	const requestContext = buildRequestContext(request.headers);

	const session = await auth();
	if (!session?.user) {
		writeAuditFailure({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			fileId,
			errorMessage: "HTTP 401",
			requestContext,
			startedAt: Date.now(),
		});
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	if (session.user.isAdmin) {
		return handleAdminDownload(fileId, session, requestContext);
	}

	const siren = parseSiren(session.user.siret);
	if (!siren) {
		writeAuditFailure({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			fileId,
			errorMessage: "HTTP 401",
			requestContext,
			startedAt: Date.now(),
			userId: session.user.id ?? null,
			userEmail: session.user.email ?? null,
		});
		return Response.json({ error: "Non authentifié" }, { status: 401 });
	}

	return handleUserDownload(fileId, session, siren, requestContext);
}

async function handleAdminDownload(
	fileId: string,
	session: { user: { id?: string | null; email?: string | null } },
	requestContext: RequestContext,
): Promise<Response> {
	const startedAt = Date.now();

	try {
		const file = await fetchFileById(fileId);
		if (!file) {
			writeAuditFailure({
				action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
				fileId,
				errorMessage: "HTTP 404",
				requestContext,
				startedAt,
				userId: session.user.id ?? null,
				userEmail: session.user.email ?? null,
			});
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const response = await streamStoredFile({
			filePath: file.filePath,
			fileName: file.fileName,
			disposition: "attachment",
			cacheControl: "private, max-age=3600",
		});

		void logAction({
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			status: "success",
			userId: session.user.id ?? null,
			userEmail: session.user.email ?? null,
			metadata: { fileId, fileName: file.fileName },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return response;
	} catch (error) {
		console.error("[api/v1/files/:fileId][admin]", error);
		writeAuditFailure({
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			fileId,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			requestContext,
			startedAt,
			userId: session.user.id ?? null,
			userEmail: session.user.email ?? null,
		});
		return Response.json(
			{ error: "Erreur lors du téléchargement du fichier" },
			{ status: 500 },
		);
	}
}

async function handleUserDownload(
	fileId: string,
	session: { user: { id?: string | null; email?: string | null } },
	siren: string,
	requestContext: RequestContext,
): Promise<Response> {
	const startedAt = Date.now();

	try {
		const file = await fetchFileBySiren(fileId, siren);
		if (!file) {
			writeAuditFailure({
				action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
				fileId,
				errorMessage: "HTTP 404",
				requestContext,
				startedAt,
				userId: session.user.id ?? null,
				userEmail: session.user.email ?? null,
				siren,
			});
			return Response.json({ error: "Fichier non trouvé" }, { status: 404 });
		}

		const response = await streamStoredFile({
			filePath: file.filePath,
			fileName: file.fileName,
			disposition: "inline",
			cacheControl: "private, no-store",
		});

		void logAction({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			status: "success",
			userId: session.user.id ?? null,
			userEmail: session.user.email ?? null,
			siren,
			metadata: { fileId, fileName: file.fileName },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return response;
	} catch (error) {
		console.error("[api/v1/files/:fileId][session]", error);
		writeAuditFailure({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			fileId,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			requestContext,
			startedAt,
			userId: session.user.id ?? null,
			userEmail: session.user.email ?? null,
			siren,
		});
		return Response.json(
			{ error: "Erreur lors de la récupération du fichier" },
			{ status: 500 },
		);
	}
}

type AuditFailureInput = {
	action: AuditActionKey;
	fileId: string;
	errorMessage: string;
	requestContext: RequestContext;
	startedAt: number;
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
};

function writeAuditFailure({
	action,
	fileId,
	errorMessage,
	requestContext,
	startedAt,
	userId = null,
	userEmail = null,
	siren = null,
}: AuditFailureInput): void {
	void logAction({
		action,
		status: "failure",
		userId,
		userEmail,
		siren,
		metadata: { fileId },
		errorMessage,
		ipAddress: requestContext.ipAddress,
		userAgent: requestContext.userAgent,
		durationMs: Date.now() - startedAt,
	});
}
