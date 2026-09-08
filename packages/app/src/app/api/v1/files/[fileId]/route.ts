import { AUDIT_ACTIONS, type AuditActionKey } from "~/modules/audit";
import { isAdminMfaFresh, parseSiren } from "~/modules/domain";
import { fetchFileById, fetchFileBySiren } from "~/modules/export";
import { logAction } from "~/server/audit/log";
import {
	buildRequestContext,
	type RequestContext,
} from "~/server/audit/requestContext";
import { auth } from "~/server/auth";
import { streamStoredFile } from "~/server/services/fileStreaming";
import { isGatewayForwarded } from "~/server/services/gatewaySource";

/**
 * GET /api/v1/files/:fileId
 *
 * Unified file-streaming endpoint serving three caller types:
 *  - SUIT REST API consumers (via APISIX gateway, attachment, no SIREN scope)
 *  - Admin backoffice users (NextAuth session + isAdmin, attachment, no SIREN
 *    scope — but only while the double authentication is fresh, see below)
 *  - In-app authenticated users (NextAuth session, inline, SIREN-scoped)
 *
 * Caller detection:
 *  - `X-Gateway-Forwarded` header present → SUIT (injected by APISIX's
 *    `proxy-rewrite` plugin; validated by the Edge middleware)
 *  - otherwise → session-based (admin vs. regular decided by `isAdmin` flag)
 *
 * The admin SIREN-scope bypass is the platform's most discreet privilege —
 * it is gated on `isAdminMfaFresh` (epic #4405). Past the 8h window the
 * admin is not refused outright: they are demoted to their own SIREN scope,
 * same as a declarant (S8), and only a request that falls outside that
 * scope is refused, explicitly naming the double authentication to redo
 * (S13). The gateway and regular-user branches are untouched.
 *
 * Each branch logs to the audit trail with its own action key.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ fileId: string }> },
) {
	const { fileId } = await params;

	return isGatewayForwarded(request)
		? handleSuitDownload(request, fileId)
		: handleSessionDownload(request, fileId);
}

async function handleSuitDownload(
	request: Request,
	fileId: string,
): Promise<Response> {
	const startedAt = Date.now();
	const requestContext = buildRequestContext(request.headers);

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
		console.error(
			"[api/v1/files/:fileId][suit]",
			error instanceof Error ? error.message : "unknown error",
		);
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
 * Session-based download: dispatches to admin (no SIREN scope, MFA-gated) or
 * regular user (SIREN-scoped) based on `isAdmin` flag.
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
		return isAdminMfaFresh(session.user.adminMfaAt, new Date())
			? handleAdminDownload(fileId, session, requestContext)
			: handleAdminDownloadDemoted(fileId, session, requestContext);
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
		console.error(
			"[api/v1/files/:fileId][admin]",
			error instanceof Error ? error.message : "unknown error",
		);
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

/**
 * Named after S13: a habilitated agent refused an out-of-scope attachment
 * because the window lapsed must be told so — never the same silent
 * "not found" a never-habilitated user gets.
 */
const ADMIN_MFA_EXPIRED_ERROR =
	"Cette pièce jointe est hors de votre périmètre : la double authentification doit être refaite pour y accéder.";

/**
 * Admin session whose double authentication has fallen out of the 8h window
 * (`isAdminMfaFresh`, epic #4405). The SIREN-scope bypass is the privilege
 * being guarded, so it is withdrawn — but the admin is also a declarant
 * (S8), so the demotion is to their own SIREN scope, not a blanket refusal:
 * a file within it is served exactly as it would be for a regular user, and
 * only a request that falls outside it is refused, explicitly naming the
 * double authentication to redo (S13). Logged under the admin download
 * action key — this is still the admin bypass surface, just gated — per the
 * ticket's instruction not to invent a new audit category for the refusal.
 */
async function handleAdminDownloadDemoted(
	fileId: string,
	session: {
		user: { id?: string | null; email?: string | null; siret?: string | null };
	},
	requestContext: RequestContext,
): Promise<Response> {
	const startedAt = Date.now();
	const siren = parseSiren(session.user.siret);

	try {
		const file = siren ? await fetchFileBySiren(fileId, siren) : undefined;
		if (!file) {
			writeAuditFailure({
				action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
				fileId,
				errorMessage: "HTTP 403 admin_mfa_expired",
				requestContext,
				startedAt,
				userId: session.user.id ?? null,
				userEmail: session.user.email ?? null,
				siren,
			});
			return Response.json({ error: ADMIN_MFA_EXPIRED_ERROR }, { status: 403 });
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
		console.error(
			"[api/v1/files/:fileId][admin-demoted]",
			error instanceof Error ? error.message : "unknown error",
		);
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
		console.error(
			"[api/v1/files/:fileId][session]",
			error instanceof Error ? error.message : "unknown error",
		);
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
