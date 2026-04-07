import { generateKeyPairSync, sign } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { verifySuitApiKey, verifySuitSignature } from "../suitApiAuth";

// Generate test RSA key pairs for signature tests (2048-bit for speed).
const { publicKey: testPublicKey, privateKey: testPrivateKey } =
	generateKeyPairSync("rsa", { modulusLength: 2048 });

const { privateKey: otherPrivateKey } = generateKeyPairSync("rsa", {
	modulusLength: 2048,
});

const TEST_PUBLIC_KEY_PEM_B64 = Buffer.from(
	testPublicKey.export({ type: "spki", format: "pem" }) as string,
).toString("base64");

function makeRequest(authHeader?: string): Request {
	const headers = new Headers();
	if (authHeader) {
		headers.set("Authorization", authHeader);
	}
	return new Request("http://localhost/api/v1/export/declarations", {
		headers,
	});
}

function signPayload(payload: string, privateKey = testPrivateKey): string {
	return sign("RSA-SHA256", Buffer.from(payload), privateKey).toString(
		"base64",
	);
}

function makeSignedRequest(
	pathname: string,
	options?: {
		method?: string;
		timestamp?: number;
		signPayloadOverride?: string;
		skipSignature?: boolean;
		skipTimestamp?: boolean;
		customSignature?: string;
		privateKey?: typeof testPrivateKey;
	},
): Request {
	const method = options?.method ?? "GET";
	const ts = options?.timestamp ?? Math.floor(Date.now() / 1000);
	const headers = new Headers();

	if (!options?.skipTimestamp) {
		headers.set("X-Timestamp", String(ts));
	}

	if (!options?.skipSignature) {
		const payload =
			options?.signPayloadOverride ?? `${ts}|${method}|${pathname}`;
		const sig =
			options?.customSignature ??
			signPayload(payload, options?.privateKey ?? testPrivateKey);
		headers.set("X-Signature", sig);
	}

	return new Request(`http://localhost${pathname}`, { method, headers });
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

describe("verifySuitSignature", () => {
	it("returns true when public key is not configured (signature verification disabled)", () => {
		const request = makeSignedRequest("/api/v1/export/declarations");
		const result = verifySuitSignature(request);
		expect(result).toBe(true);
	});

	describe("when EGAPRO_SUIT_PUBLIC_KEY_PEM is set", () => {
		async function importWithPublicKey() {
			vi.resetModules();
			vi.doMock("server-only", () => ({}));
			vi.doMock("~/env", () => ({
				env: {
					EGAPRO_SUIT_PUBLIC_KEY_PEM: TEST_PUBLIC_KEY_PEM_B64,
					EGAPRO_SUIT_API_KEY: "test-suit-api-key-that-is-at-least-32-chars",
					NODE_ENV: "test",
				},
			}));
			const mod = await import("../suitApiAuth");
			return mod.verifySuitSignature;
		}

		it("returns true for a valid signature", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations");
			const result = verifyFn(request);
			expect(result).toBe(true);
		});

		it("returns 403 when X-Signature header is missing", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				skipSignature: true,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error).toBe("Signature manquante ou invalide");
		});

		it("returns 403 when X-Timestamp header is missing", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				skipTimestamp: true,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 when timestamp is too old (> 30s)", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				timestamp: Math.floor(Date.now() / 1000) - 60,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 when timestamp is too far in the future (> 30s)", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				timestamp: Math.floor(Date.now() / 1000) + 60,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns true for a timestamp exactly at the 30-second boundary", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				timestamp: Math.floor(Date.now() / 1000) - 30,
			});
			const result = verifyFn(request);
			expect(result).toBe(true);
		});

		it("returns 403 when timestamp is NaN", async () => {
			const verifyFn = await importWithPublicKey();
			const headers = new Headers();
			headers.set("X-Timestamp", "not-a-number");
			headers.set("X-Signature", "dummy");
			const request = new Request(
				"http://localhost/api/v1/export/declarations",
				{ headers },
			);
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 when signature is for a different path", async () => {
			const verifyFn = await importWithPublicKey();
			const ts = Math.floor(Date.now() / 1000);
			const request = makeSignedRequest("/api/v1/export/declarations", {
				timestamp: ts,
				signPayloadOverride: `${ts}|GET|/api/v1/files`,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 when signature is for a different method", async () => {
			const verifyFn = await importWithPublicKey();
			const ts = Math.floor(Date.now() / 1000);
			const request = makeSignedRequest("/api/v1/export/declarations", {
				timestamp: ts,
				signPayloadOverride: `${ts}|POST|/api/v1/export/declarations`,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 for invalid base64 signature", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				customSignature: "!!!invalid-base64!!!",
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});

		it("returns 403 when signed with a different key pair", async () => {
			const verifyFn = await importWithPublicKey();
			const request = makeSignedRequest("/api/v1/export/declarations", {
				privateKey: otherPrivateKey,
			});
			const result = verifyFn(request);

			expect(result).not.toBe(true);
			const response = result as Response;
			expect(response.status).toBe(403);
		});
	});
});
