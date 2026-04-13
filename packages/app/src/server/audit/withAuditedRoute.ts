import "server-only";

import type { AuditActionKey, AuditMetadata } from "~/modules/audit";
import { logAction } from "./log";
import { buildRequestContext } from "./requestContext";

type AuditedRouteOptions = {
	action: AuditActionKey;
	/**
	 * Compute audit context from the incoming request before calling the
	 * handler. Runs even if the handler throws — make it cheap and never
	 * throwing (use try/catch internally if needed).
	 */
	resolveContext?: (
		request: Request,
	) => Promise<AuditedRouteContext> | AuditedRouteContext;
};

export type AuditedRouteContext = {
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
	resourceType?: string | null;
	resourceId?: string | null;
	metadata?: AuditMetadata | null;
};

type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Wrap a Next.js Route Handler so every call writes an entry to
 * `audit.action_log`.
 *
 * - `success` when the handler returns a 2xx Response
 * - `failure` when the handler throws OR returns a non-2xx Response
 * - errors are re-thrown unchanged so the caller's behavior is unaffected
 *
 * The wrapper deliberately gives the caller full control over the audit
 * context (user/siren/metadata) via `resolveContext`, since route handlers
 * have very different shapes (auth via session, signed API auth, public
 * routes…).
 */
export function withAuditedRoute(
	options: AuditedRouteOptions,
	handler: RouteHandler,
): RouteHandler {
	return async function auditedHandler(request: Request): Promise<Response> {
		const startedAt = Date.now();
		const requestContext = buildRequestContext(request.headers);

		let auditContext: AuditedRouteContext = {};
		if (options.resolveContext) {
			try {
				auditContext = await options.resolveContext(request);
			} catch (resolveError) {
				console.error("[audit] resolveContext threw", {
					action: options.action,
					error: resolveError,
				});
			}
		}

		try {
			const response = await handler(request);
			const isSuccess = response.status >= 200 && response.status < 300;
			void logAction({
				action: options.action,
				status: isSuccess ? "success" : "failure",
				userId: auditContext.userId ?? null,
				userEmail: auditContext.userEmail ?? null,
				siren: auditContext.siren ?? null,
				resourceType: auditContext.resourceType ?? null,
				resourceId: auditContext.resourceId ?? null,
				metadata: auditContext.metadata ?? null,
				errorMessage: isSuccess ? null : `HTTP ${response.status}`,
				ipAddress: requestContext.ipAddress,
				userAgent: requestContext.userAgent,
				durationMs: Date.now() - startedAt,
			});
			return response;
		} catch (error) {
			void logAction({
				action: options.action,
				status: "failure",
				userId: auditContext.userId ?? null,
				userEmail: auditContext.userEmail ?? null,
				siren: auditContext.siren ?? null,
				resourceType: auditContext.resourceType ?? null,
				resourceId: auditContext.resourceId ?? null,
				metadata: auditContext.metadata ?? null,
				errorMessage: error instanceof Error ? error.message : "Unknown error",
				ipAddress: requestContext.ipAddress,
				userAgent: requestContext.userAgent,
				durationMs: Date.now() - startedAt,
			});
			throw error;
		}
	};
}
