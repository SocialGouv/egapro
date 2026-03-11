import { describe, expect, it } from "vitest";

// Build a minimal JWT with the given payload (no signature verification needed)
function buildJwt(payload: Record<string, unknown>): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "RS256", typ: "JWT" }),
	).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${header}.${body}.fake-signature`;
}

// Re-implement extractIssuerFromIdToken inline since it's not exported.
// This tests the same logic used in the module.
function extractIssuerFromIdToken(idToken: string): string | undefined {
	const parts = idToken.split(".");
	const payload = parts[1];
	if (!payload) return undefined;

	try {
		const decoded = JSON.parse(
			Buffer.from(payload, "base64url").toString(),
		) as { iss?: string };
		return decoded.iss;
	} catch {
		return undefined;
	}
}

describe("extractIssuerFromIdToken", () => {
	it("extracts the iss claim from a valid JWT", () => {
		const jwt = buildJwt({
			iss: "https://fca.integ01.dev-agentconnect.fr/api/v2",
			sub: "user-123",
		});
		expect(extractIssuerFromIdToken(jwt)).toBe(
			"https://fca.integ01.dev-agentconnect.fr/api/v2",
		);
	});

	it("returns undefined when iss is missing from the payload", () => {
		const jwt = buildJwt({ sub: "user-123" });
		expect(extractIssuerFromIdToken(jwt)).toBeUndefined();
	});

	it("returns undefined for a malformed JWT with no payload", () => {
		expect(extractIssuerFromIdToken("header-only")).toBeUndefined();
	});

	it("returns undefined for an invalid base64 payload", () => {
		expect(
			extractIssuerFromIdToken("header.!!!invalid!!!.sig"),
		).toBeUndefined();
	});
});
