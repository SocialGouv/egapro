import "server-only";

import { Agent } from "undici";

import { env } from "~/env";

const TIMEOUT_MS = 10_000;
const REVALIDATE_SECONDS = 86_400;

// Three-state memo: `undefined` = not resolved yet, `null` = no certificate
// configured, `Agent` = certificate loaded. Avoids decoding the .p12 on every
// request while still distinguishing "not computed" from "nothing to compute".
let dispatcher: Agent | null | undefined;

function getDispatcher(): Agent | undefined {
	if (dispatcher !== undefined) return dispatcher ?? undefined;

	const p12 = env.EGAPRO_SUIT_CLIENT_CERT_P12_BASE64;
	if (!p12) {
		dispatcher = null;
		return undefined;
	}

	dispatcher = new Agent({
		connect: {
			pfx: Buffer.from(p12, "base64"),
			passphrase: env.EGAPRO_SUIT_CLIENT_CERT_PASSWORD,
		},
	});

	return dispatcher;
}

function isSuitOrigin(url: string): boolean {
	try {
		return new URL(url).origin === new URL(env.EGAPRO_SUIT_API_URL).origin;
	} catch {
		return false;
	}
}

/**
 * Fetch an absolute URL that may or may not belong to SUIT, presenting the
 * client certificate only when it does.
 *
 * The GIP-MDS import target is configurable and points at an internal mock
 * outside production, so the certificate cannot be attached unconditionally —
 * the origin check is what keeps it from reaching a non-SUIT host. It trusts
 * `EGAPRO_SUIT_API_URL` as ground truth, which is sound because both URLs live
 * in ConfigMaps under the same CODEOWNERS gate as the certificate itself.
 *
 * The non-SUIT branch deliberately keeps the default redirect behaviour: it
 * carries no certificate to leak, and a file-download source may legitimately
 * redirect (pre-signed storage URL, CDN).
 */
export function suitAwareFetch(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	if (!isSuitOrigin(url)) return fetch(url, init);

	return fetch(url, {
		...init,
		redirect: "error",
		dispatcher: getDispatcher(),
	});
}

/**
 * Single entry point for every outgoing SUIT call.
 *
 * The mTLS dispatcher is deliberately never exported: tying it to a URL built
 * from `EGAPRO_SUIT_API_URL` is what guarantees the client certificate can only
 * ever be presented to SUIT, and never to another host.
 *
 * `redirect: "error"` closes the remaining escape route. A followed redirect
 * re-uses the same dispatcher, so a 3xx pointing elsewhere would hand our
 * client certificate to that host — verified, not theoretical. SUIT's JSON API
 * never redirects, so refusing one turns a silent credential leak into a
 * logged failure.
 *
 * TLS options are applied when the socket opens, so a corrupt bundle or a wrong
 * passphrase surfaces as a rejected promise here rather than at startup —
 * callers must log their failures.
 */
export function suitFetch(path: string): Promise<Response> {
	const baseUrl = env.EGAPRO_SUIT_API_URL.replace(/\/$/, "");

	return fetch(`${baseUrl}${path}`, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(TIMEOUT_MS),
		next: { revalidate: REVALIDATE_SECONDS },
		redirect: "error",
		dispatcher: getDispatcher(),
	});
}
