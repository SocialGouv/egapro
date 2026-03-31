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
 * Constant-time string comparison to prevent timing attacks.
 * Always compares equal-length buffers to avoid leaking length via timing.
 */
function constantTimeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a, "utf8");
	const bufB = Buffer.from(b, "utf8");

	const paddedA = Buffer.alloc(bufB.byteLength);
	bufA.copy(paddedA, 0, 0, bufB.byteLength);
	const equal = timingSafeEqual(paddedA, bufB);

	return equal && bufA.byteLength === bufB.byteLength;
}

function unauthorizedResponse(): Response {
	return Response.json(
		{ error: "Clé API manquante ou invalide" },
		{ status: 401 },
	);
}
