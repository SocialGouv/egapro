import { describe, expect, it } from "vitest";

import { verifySuitApiKey } from "../suitApiAuth";

function makeRequest(authHeader?: string): Request {
	const headers = new Headers();
	if (authHeader) {
		headers.set("Authorization", authHeader);
	}
	return new Request("http://localhost/api/v1/export/declarations", {
		headers,
	});
}

describe("verifySuitApiKey", () => {
	it("returns true for a valid API key", () => {
		const request = makeRequest(
			"Bearer test-suit-api-key-that-is-at-least-32-chars",
		);
		const result = verifySuitApiKey(request);
		expect(result).toBe(true);
	});

	it("returns 401 when Authorization header is missing", async () => {
		const request = makeRequest();
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("returns 401 when header format is not Bearer", async () => {
		const request = makeRequest("Basic dXNlcjpwYXNz");
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("returns 401 when Bearer token is empty", async () => {
		const request = makeRequest("Bearer ");
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
	});

	it("returns 401 when API key is wrong", async () => {
		const request = makeRequest(
			"Bearer wrong-key-that-is-definitely-not-valid",
		);
		const result = verifySuitApiKey(request);

		expect(result).not.toBe(true);
		const response = result as Response;
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Clé API manquante ou invalide");
	});

	it("is case-insensitive for the Bearer prefix", () => {
		const request = makeRequest(
			"bearer test-suit-api-key-that-is-at-least-32-chars",
		);
		const result = verifySuitApiKey(request);
		expect(result).toBe(true);
	});
});
