import "server-only";

/**
 * Guard for SUIT-only `/api/v1/*` endpoints.
 *
 * APISIX (the gateway fronting SUIT traffic — see
 * `.kontinuous/templates/apisix-suit.yaml`) injects the `X-Gateway-Forwarded`
 * header on every proxied request. The Edge middleware
 * (`src/middleware.ts`) already rejects empty or mismatched values with 403,
 * so by the time the request reaches here the header is either absent
 * (session / public call) or a valid secret. An absent (or empty) header
 * means the caller reached the app pod directly and bypassed APISIX's
 * Bearer auth + rate-limit — reject with 403.
 *
 * Mixed endpoints that must serve both APISIX (SUIT) and browser
 * (admin / user) — e.g. `/api/v1/files/:fileId` — do **not** call this
 * guard; they dispatch on `isGatewayForwarded(request)` instead.
 */
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
