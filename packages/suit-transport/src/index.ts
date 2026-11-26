import { Agent, fetch as undiciFetch } from "undici";

const DEFAULT_TIMEOUT_MS = 10_000;

export type SuitClientConfig = {
	/** Base URL of the SUIT API, as mounted from the `suit` ConfigMap. */
	apiUrl: string;
	/** Base64 PKCS#12 bundle of the client certificate, or absent. */
	p12Base64?: string | null;
	passphrase?: string | null;
	timeoutMs?: number;
};

export type SuitClient = {
	/** `GET` a path under `apiUrl`, with `Accept: application/json`. */
	fetchJson(path: string): Promise<Response>;
	/** Fetch an absolute URL, presenting the certificate only on the SUIT origin. */
	fetchRaw(url: string, init?: RequestInit): Promise<Response>;
};

/**
 * Outgoing transport to SUIT, client certificate included.
 *
 * This module is the only place that builds the mTLS `Agent` and the only place
 * that decides where the certificate may be presented. Both are security
 * invariants: a second copy would drift, and the day it drifts the client
 * certificate leaves for another host.
 *
 * The certificate is tied to `apiUrl` and never exported:
 *
 * - {@link SuitClient.fetchRaw} presents it only when the target shares the
 *   `apiUrl` origin. The GIP-MDS import URL is configurable and points at an
 *   internal mock outside production, so the check is what keeps the
 *   certificate from reaching a non-SUIT host. It trusts `apiUrl` as ground
 *   truth, which is sound because both values live under the same review.
 * - Redirects are refused (`redirect: "error"`) on every SUIT call. A followed
 *   redirect re-uses the same dispatcher, so a 3xx pointing elsewhere would
 *   hand the certificate to that host. SUIT's API does not redirect, so
 *   refusing one turns a silent credential leak into a logged failure.
 * - The non-SUIT branch keeps the default redirect behaviour: it carries no
 *   certificate to leak, and a download source may legitimately redirect
 *   (pre-signed storage URL, CDN).
 *
 * TLS options are applied when the socket opens: a corrupt bundle or a wrong
 * passphrase surfaces as a rejected promise on the first call, not at startup —
 * callers must log their failures.
 */
export function createSuitClient(config: SuitClientConfig): SuitClient {
	const apiUrl = config.apiUrl.replace(/\/$/, "");
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	// Three-state memo: `undefined` = not resolved yet, `null` = no certificate
	// configured, `Agent` = certificate loaded. Avoids decoding the .p12 on
	// every request while still distinguishing "not computed" from "nothing to
	// compute" — and keeps the agent unbuilt until a SUIT call needs it.
	let dispatcher: Agent | null | undefined;

	function fetchWithCertificate(
		url: string,
		init: RequestInit,
	): Promise<Response> {
		if (dispatcher === undefined) {
			dispatcher = createDispatcher(config);
		}
		if (!dispatcher) return fetch(url, init);

		// Node's built-in fetch and Undici 8 use different dispatcher interfaces.
		return undiciFetch(url, {
			...init,
			dispatcher,
		} as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>;
	}

	return {
		fetchJson(path) {
			return fetchWithCertificate(`${apiUrl}${path}`, {
				headers: { Accept: "application/json" },
				signal: AbortSignal.timeout(timeoutMs),
				redirect: "error",
			});
		},
		fetchRaw(url, init = {}) {
			if (!isSameOrigin(url, apiUrl)) return fetch(url, init);

			return fetchWithCertificate(url, { ...init, redirect: "error" });
		},
	};
}

function createDispatcher(config: SuitClientConfig): Agent | null {
	if (!config.p12Base64) return null;

	return new Agent({
		// Undici 8 enables HTTP/2 by default; keep the existing SUIT transport.
		allowH2: false,
		connect: {
			pfx: Buffer.from(config.p12Base64, "base64"),
			passphrase: config.passphrase ?? undefined,
		},
	});
}

function isSameOrigin(url: string, baseUrl: string): boolean {
	try {
		return new URL(url).origin === new URL(baseUrl).origin;
	} catch {
		return false;
	}
}
