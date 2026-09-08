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
 *    scope while the double authentication is fresh — past that window the
 *    admin's own SIREN scope applies instead, since they are also a
 *    declarant)
 *  - In-app authenticated users (NextAuth session, inline, SIREN-scoped)
 *
 * Caller detection:
 *  - `X-Gateway-Forwarded` header present → SUIT (injected by APISIX's
 *    `proxy-rewrite` plugin; validated by the Edge middleware)
 *  - otherwise → session-based (admin vs. regular decided by `isAdmin` flag)
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

type CallerIdentity = {
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
};

type ServeFileInput = CallerIdentity & {
	fileId: string;
	requestContext: RequestContext;
	fetchFile: () => Promise<{ filePath: string; fileName: string } | undefined>;
	disposition: "inline" | "attachment";
	cacheControl: string;
	logLabel: string;
	notFound: {
		action: AuditActionKey;
		status: number;
		error: string;
		auditMessage: string;
	};
	success: { action: AuditActionKey };
	failure: { action: AuditActionKey; error: string };
};

/**
 * Shared fetch → stream → audit sequence for the four caller branches
 * below. They differ only in how the file is looked up, its disposition,
 * and which audit action each outcome is tagged with — this centralises
 * everything else so the try/catch/log skeleton exists exactly once.
 */
async function serveFile({
	fileId,
	requestContext,
	userId = null,
	userEmail = null,
	siren = null,
	fetchFile,
	disposition,
	cacheControl,
	logLabel,
	notFound,
	success,
	failure,
}: ServeFileInput): Promise<Response> {
	const startedAt = Date.now();

	try {
		const file = await fetchFile();
		if (!file) {
			writeAuditFailure({
				action: notFound.action,
				fileId,
				errorMessage: notFound.auditMessage,
				requestContext,
				startedAt,
				userId,
				userEmail,
				siren,
			});
			return Response.json(
				{ error: notFound.error },
				{ status: notFound.status },
			);
		}

		const response = await streamStoredFile({
			filePath: file.filePath,
			fileName: file.fileName,
			disposition,
			cacheControl,
		});

		void logAction({
			action: success.action,
			status: "success",
			userId,
			userEmail,
			siren,
			metadata: { fileId, fileName: file.fileName },
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
		});

		return response;
	} catch (error) {
		console.error(
			`[api/v1/files/:fileId][${logLabel}]`,
			error instanceof Error ? error.message : "unknown error",
		);
		writeAuditFailure({
			action: failure.action,
			fileId,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			requestContext,
			startedAt,
			userId,
			userEmail,
			siren,
		});
		return Response.json({ error: failure.error }, { status: 500 });
	}
}

async function handleSuitDownload(
	request: Request,
	fileId: string,
): Promise<Response> {
	return serveFile({
		fileId,
		requestContext: buildRequestContext(request.headers),
		fetchFile: () => fetchFileById(fileId),
		disposition: "attachment",
		cacheControl: "private, max-age=3600",
		logLabel: "suit",
		notFound: {
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			status: 404,
			error: "Fichier non trouvé",
			auditMessage: "HTTP 404",
		},
		success: { action: AUDIT_ACTIONS.EXPORT_API_FILES },
		failure: {
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			error: "Erreur lors du téléchargement du fichier",
		},
	});
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
	return serveFile({
		fileId,
		requestContext,
		userId: session.user.id,
		userEmail: session.user.email,
		fetchFile: () => fetchFileById(fileId),
		disposition: "attachment",
		cacheControl: "private, max-age=3600",
		logLabel: "admin",
		notFound: {
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			status: 404,
			error: "Fichier non trouvé",
			auditMessage: "HTTP 404",
		},
		success: { action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD },
		failure: {
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			error: "Erreur lors du téléchargement du fichier",
		},
	});
}

// A habilitated agent refused an out-of-scope attachment because their
// window lapsed must be told so — never the same silent "not found" a
// never-habilitated user gets.
const ADMIN_MFA_EXPIRED_ERROR =
	"Cette pièce jointe est hors de votre périmètre : la double authentification doit être refaite pour y accéder.";

async function handleAdminDownloadDemoted(
	fileId: string,
	session: {
		user: {
			id?: string | null;
			email?: string | null;
			siret?: string | null;
		};
	},
	requestContext: RequestContext,
): Promise<Response> {
	const siren = parseSiren(session.user.siret);

	return serveFile({
		fileId,
		requestContext,
		userId: session.user.id,
		userEmail: session.user.email,
		siren,
		// No siren at all is refused the same way as one that doesn't match:
		// either way the admin's own scope doesn't cover this file.
		fetchFile: () =>
			siren ? fetchFileBySiren(fileId, siren) : Promise.resolve(undefined),
		disposition: "inline",
		cacheControl: "private, no-store",
		logLabel: "admin-demoted",
		notFound: {
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			status: 403,
			error: ADMIN_MFA_EXPIRED_ERROR,
			auditMessage: "HTTP 403 admin_mfa_expired",
		},
		// A file within the admin's own scope is served exactly like a regular
		// user's — only the refusal above is tagged as the admin surface being
		// denied.
		success: { action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD },
		failure: {
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			error: "Erreur lors de la récupération du fichier",
		},
	});
}

async function handleUserDownload(
	fileId: string,
	session: { user: { id?: string | null; email?: string | null } },
	siren: string,
	requestContext: RequestContext,
): Promise<Response> {
	return serveFile({
		fileId,
		requestContext,
		userId: session.user.id,
		userEmail: session.user.email,
		siren,
		fetchFile: () => fetchFileBySiren(fileId, siren),
		disposition: "inline",
		cacheControl: "private, no-store",
		logLabel: "session",
		notFound: {
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			status: 404,
			error: "Fichier non trouvé",
			auditMessage: "HTTP 404",
		},
		success: { action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD },
		failure: {
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			error: "Erreur lors de la récupération du fichier",
		},
	});
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
