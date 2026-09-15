import "server-only";

/**
 * Guard for endpoints with no legitimate caller besides the gateway or an
 * in-cluster CronJob: SUIT-only `/api/v1/*` routes, and `/api/receipts/retry`.
 *
 * Both send `X-Gateway-Forwarded: <EGAPRO_GATEWAY_SHARED_SECRET>` — APISIX
 * (see `.kontinuous/templates/apisix-suit.yaml`) for SUIT traffic, the
 * `receipt-outbox-retry` CronJob directly for its own route. The Edge
 * middleware (`src/middleware.ts`) already rejects an absent, empty or
 * mismatched value with 403 for both, so by the time a request reaches here
 * the header is a valid secret — this call is defense in depth against a
 * future middleware/matcher regression, not the primary check.
 *
 * Mixed endpoints that must serve both the gateway and a browser session —
 * e.g. `/api/v1/files/:fileId` — do **not** call this guard; they dispatch
 * on `isGatewayForwarded(request)` instead.
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
