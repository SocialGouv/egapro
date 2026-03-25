import "server-only";

import { timingSafeEqual } from "node:crypto";

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
		return unauthorizedResponse("En-tête Authorization manquant");
	}

	const match = /^Bearer\s+(.+)$/i.exec(authorization);
	if (!match?.[1]) {
		return unauthorizedResponse(
			"Format invalide. Attendu : Authorization: Bearer <clé>",
		);
	}

	const provided = match[1];
	const expected = env.EGAPRO_SUIT_API_KEY;

	if (!constantTimeEqual(provided, expected)) {
		return unauthorizedResponse("Clé API invalide");
	}

	return true;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses Node.js crypto.timingSafeEqual with equal-length buffers.
 */
function constantTimeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a, "utf8");
	const bufB = Buffer.from(b, "utf8");

	if (bufA.byteLength !== bufB.byteLength) {
		// Compare bufA with itself to keep constant time, then return false.
		timingSafeEqual(bufA, bufA);
		return false;
	}

	return timingSafeEqual(bufA, bufB);
}

function unauthorizedResponse(message: string): Response {
	return Response.json({ error: message }, { status: 401 });
}
