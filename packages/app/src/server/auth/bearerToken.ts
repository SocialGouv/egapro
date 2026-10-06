import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

type BearerTokenOptions = {
	expectedToken: string | undefined;
	tokenName: string;
};

export function assertBearerToken(
	request: Request,
	{ expectedToken, tokenName }: BearerTokenOptions,
): Response | null {
	if (!expectedToken) {
		reportMissingToken(tokenName);
		return unauthorized();
	}

	const authorization = request.headers.get("authorization") ?? "";
	// Hashing gives timingSafeEqual equal-length inputs without leaking the token length.
	if (
		!timingSafeEqual(sha256(authorization), sha256(`Bearer ${expectedToken}`))
	) {
		return unauthorized();
	}

	return null;
}

const reportedMissingTokens = new Set<string>();

function reportMissingToken(tokenName: string): void {
	if (reportedMissingTokens.has(tokenName)) return;
	reportedMissingTokens.add(tokenName);
	console.error(`[bearer-token] ${tokenName} is not configured — refusing`);
}

function sha256(value: string): Buffer {
	return createHash("sha256").update(value).digest();
}

function unauthorized(): Response {
	return Response.json({ error: "Unauthorized" }, { status: 401 });
}
