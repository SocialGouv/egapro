import "server-only";

// Defense in depth: `src/middleware.ts` already 403s a missing/wrong `X-Gateway-Forwarded` secret before this runs.
export function assertGatewaySource(request: Request): Response | null {
	if (!isGatewayForwarded(request)) {
		return Response.json(
			{ error: "Accès via la passerelle SUIT uniquement" },
			{ status: 403 },
		);
	}
	return null;
}

/**
 * Header presence test used by mixed endpoints (SUIT + browser) to
 * distinguish the gateway-forwarded branch from the session-based branch.
 * The middleware has already validated the secret if present, so a
 * non-empty presence check is sufficient here — explicitly rejecting the
 * empty-string case closes the in-cluster bypass where an attacker sends
 * `X-Gateway-Forwarded:` (empty) to pass `.has()` without triggering the
 * middleware's value compare.
 */
export function isGatewayForwarded(request: Request): boolean {
	const value = request.headers.get("x-gateway-forwarded");
	return value !== null && value.length > 0;
}
