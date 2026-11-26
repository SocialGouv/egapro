import "server-only";

import { createSuitClient, type SuitClient } from "suit-transport";

import { env } from "~/env";
import { captureDependencyFailure } from "~/server/observability/captureDependency";

const TIMEOUT_MS = 10_000;

// One transport per process: it builds the mTLS agent once and reuses it.
let client: SuitClient | undefined;

function getClient(): SuitClient {
	if (!client) {
		client = createSuitClient({
			apiUrl: env.EGAPRO_SUIT_API_URL,
			p12Base64: env.EGAPRO_SUIT_CLIENT_CERT_P12_BASE64,
			passphrase: env.EGAPRO_SUIT_CLIENT_CERT_PASSWORD,
			timeoutMs: TIMEOUT_MS,
		});
	}
	return client;
}

/**
 * Fetch an absolute URL that may or may not belong to SUIT, presenting the
 * client certificate only when it does.
 *
 * The origin check and the redirect policy live in `suit-transport`, with the
 * mTLS agent they protect. This adapter only reads `~/env` and delegates.
 */
export function suitAwareFetch(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	return getClient().fetchRaw(url, init);
}

/**
 * Single entry point for the outgoing JSON calls to SUIT.
 *
 * A refusal or a gateway failure means the dependency is down: callers degrade
 * to "unknown" and would otherwise hide it. A plain 404 is a data answer, not
 * an outage, and stays out of Sentry.
 *
 * Only for the JSON endpoints. A WAF sits in front of SUIT and rejects an
 * explicit `Accept` header on the GIP-MDS file route with an HTML 403
 * (`x-waf-blocked: 1`) — observed against SUIT Validation. That route must keep
 * going through `suitAwareFetch`, which sends no `Accept`.
 */
export function suitFetch(path: string): Promise<Response> {
	return getClient()
		.fetchJson(path)
		.then(
			(response) => {
				if (isDependencyFailureStatus(response.status)) {
					captureDependencyFailure(
						"suit",
						new Error(`SUIT returned HTTP ${response.status}`),
						{ status: response.status },
					);
				}
				return response;
			},
			(error: unknown) => {
				// Timeout, refused handshake, corrupt client certificate.
				captureDependencyFailure("suit", error);
				throw error;
			},
		);
}

function isDependencyFailureStatus(status: number): boolean {
	return status === 401 || status === 403 || status >= 500;
}
