// @vitest-environment node
// Server-only env access throws under jsdom's default `window`, unrelated to the schema under test.

import { afterEach, describe, expect, it, vi } from "vitest";

// Bypasses the global ~/env mock (already-parsed) for this file, to exercise the real Zod schema.
vi.unmock("~/env");

const REQUIRED_ENV: Record<string, string> = {
	AUTH_SECRET: "test-secret",
	DATABASE_URL: "postgres://localhost/test",
	EGAPRO_WEEZ_API_URL: "https://weez.example.com/api",
	EGAPRO_SUIT_API_URL: "https://api.suit.example.com",
	EGAPRO_GATEWAY_SHARED_SECRET: "test-gateway-shared-secret-at-least-32-chars",
	S3_ENDPOINT: "http://localhost:9000",
	S3_REGION: "us-east-1",
	S3_ACCESS_KEY_ID: "minio",
	S3_SECRET_ACCESS_KEY: "minio",
	S3_BUCKET_NAME: "bucket",
	CLAMAV_HOST: "localhost",
	CLAMAV_PORT: "3310",
	NEXTAUTH_URL: "http://localhost:3000/api/auth",
};

/** Loads the real env module with the flag stubbed, bypassing the global mock. */
async function loadRealEnvFlag(flagValue: string | undefined) {
	vi.resetModules();
	for (const [key, value] of Object.entries(REQUIRED_ENV)) {
		vi.stubEnv(key, value);
	}
	if (flagValue !== undefined) {
		vi.stubEnv("EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT", flagValue);
	}
	const { env } = await import("~/env");
	return env.EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT;
}

describe("EGAPRO_ADMIN_REQUIRE_PUBLIC_AGENT parsing", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	// S9
	it("defaults to true when the environment does not set it", async () => {
		expect(await loadRealEnvFlag(undefined)).toBe(true);
	});

	it('parses the string "false" to false', async () => {
		expect(await loadRealEnvFlag("false")).toBe(false);
	});

	it('parses the string "true" to true', async () => {
		expect(await loadRealEnvFlag("true")).toBe(true);
	});

	it.each([
		"yes",
		"1",
		"TRUE",
	])("rejects %j rather than silently coercing it", async (invalid) => {
		await expect(loadRealEnvFlag(invalid)).rejects.toThrow();
	});
});
