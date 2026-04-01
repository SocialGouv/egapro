import "server-only";

import { timingSafeEqual, X509Certificate } from "node:crypto";

import { env } from "~/env";

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
 * Verify the client certificate sent in the `X-Client-Cert` header.
 *
 * The client sends its X.509 certificate as a base64-encoded PEM in the
 * `X-Client-Cert` header. The app verifies:
 * 1. The certificate is signed by our CA (EGAPRO_SUIT_MTLS_CA_PEM)
 * 2. The certificate is not expired
 *
 * Only active when `EGAPRO_SUIT_MTLS_CA_PEM` is set. When absent, mTLS
 * verification is skipped (dev / environments without certs).
 */
export function verifySuitClientCert(request: Request): true | Response {
	if (!env.EGAPRO_SUIT_MTLS_CA_PEM) return true;

	const clientCertB64 = request.headers.get("x-client-cert");
	if (!clientCertB64) {
		return forbiddenResponse();
	}

	try {
		const clientPem = Buffer.from(clientCertB64, "base64").toString("utf-8");
		const caPem = Buffer.from(env.EGAPRO_SUIT_MTLS_CA_PEM, "base64").toString(
			"utf-8",
		);

		const clientCert = new X509Certificate(clientPem);
		const caCert = new X509Certificate(caPem);

		if (!clientCert.verify(caCert.publicKey)) {
			return forbiddenResponse();
		}

		const now = new Date();
		if (
			now < new Date(clientCert.validFrom) ||
			now > new Date(clientCert.validTo)
		) {
			return forbiddenResponse();
		}

		return true;
	} catch {
		return forbiddenResponse();
	}
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
		{ error: "Certificat client manquant ou invalide" },
		{ status: 403 },
	);
}
