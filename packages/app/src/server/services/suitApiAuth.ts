import "server-only";

import { createPublicKey, timingSafeEqual, verify } from "node:crypto";

import { env } from "~/env";

// Signature validity window, evaluated lazily so tests can override env via
// `vi.doMock('~/env')` without depending on module-load timing.
// Dev: 30 days — allows reusing a generated signature across a working session
// without constantly re-signing while debugging locally.
// Preprod / prod: 30 seconds — tight anti-replay window.
function getSignatureWindowSeconds(): number {
	return env.NEXT_PUBLIC_EGAPRO_ENV === "dev" ? 30 * 24 * 60 * 60 : 30;
}

// Cache the public key at module level — parsed once, reused on every request.
const suitPublicKey = (() => {
	if (!env.EGAPRO_SUIT_PUBLIC_KEY_PEM) return null;
	try {
		return createPublicKey(
			Buffer.from(env.EGAPRO_SUIT_PUBLIC_KEY_PEM, "base64").toString("utf-8"),
		);
	} catch (err) {
		throw new Error(
			`[suitApiAuth] Failed to parse EGAPRO_SUIT_PUBLIC_KEY_PEM: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
})();

if (!suitPublicKey && env.NODE_ENV === "development") {
	console.warn(
		"[suitApiAuth] EGAPRO_SUIT_PUBLIC_KEY_PEM is not set — request signature verification is disabled",
	);
}

/**
 * Verify that the incoming request carries a valid SUIT API key
 * in the `Authorization: Bearer <key>` header.
 *
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifySuitApiKey(request: Request): true | Response {
	const authorization = request.headers.get("authorization");

	if (!authorization) {
		return unauthorizedResponse();
	}

	const match = /^Bearer\s(\S+)$/i.exec(authorization);
	if (!match?.[1]) {
		return unauthorizedResponse();
	}

	const provided = match[1];
	const expected = env.EGAPRO_SUIT_API_KEY;

	if (!constantTimeEqual(provided, expected)) {
		return unauthorizedResponse();
	}

	return true;
}

/**
 * Verify the request signature sent in the `X-Signature` header.
 *
 * SUIT signs `{timestamp}|{METHOD}|{pathname}` with its RSA private key.
 * The app verifies:
 * 1. The signature matches using SUIT's public key (EGAPRO_SUIT_PUBLIC_KEY_PEM)
 * 2. The timestamp is within the signature window (anti-replay — 30s in
 *    preprod/prod, 30d in dev, cf. `getSignatureWindowSeconds`)
 *
 * Only active when `EGAPRO_SUIT_PUBLIC_KEY_PEM` is set. When absent, signature
 * verification is skipped (dev / environments without keys).
 */
export function verifySuitSignature(request: Request): true | Response {
	if (!suitPublicKey) return true;

	const timestamp = request.headers.get("x-timestamp");
	const signature = request.headers.get("x-signature");

	if (!timestamp || !signature) {
		return forbiddenResponse();
	}

	const ts = Number(timestamp);
	if (Number.isNaN(ts)) {
		return forbiddenResponse();
	}

	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - ts) > getSignatureWindowSeconds()) {
		return forbiddenResponse();
	}

	try {
		const url = new URL(request.url);
		const payload = `${timestamp}|${request.method}|${url.pathname}`;

		const isValid = verify(
			"RSA-SHA256",
			Buffer.from(payload),
			suitPublicKey,
			Buffer.from(signature, "base64"),
		);

		if (!isValid) {
			return forbiddenResponse();
		}

		return true;
	} catch {
		return forbiddenResponse();
	}
}

/**
 * Run both SUIT auth checks: signature verification then API key.
 * Returns `null` on success, or a Response to send back on failure.
 */
export function verifySuitAuth(request: Request): Response | null {
	const signatureResult = verifySuitSignature(request);
	if (signatureResult !== true) return signatureResult;

	const apiKeyResult = verifySuitApiKey(request);
	if (apiKeyResult !== true) return apiKeyResult;

	return null;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Always compares equal-length buffers to avoid leaking length via timing.
 */
function constantTimeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a, "utf8");
	const bufB = Buffer.from(b, "utf8");

	const lengthMatch = bufA.byteLength === bufB.byteLength;
	// Always compare same-length buffers: use bufA when lengths match, bufB against itself otherwise.
	const compareBuf = lengthMatch ? bufA : bufB;
	return timingSafeEqual(compareBuf, bufB) && lengthMatch;
}

function unauthorizedResponse(): Response {
	return Response.json(
		{ error: "Clé API manquante ou invalide" },
		{ status: 401 },
	);
}

function forbiddenResponse(): Response {
	return Response.json(
		{ error: "Signature manquante ou invalide" },
		{ status: 403 },
	);
}
