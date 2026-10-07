// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_SERVER_ENV = {
	AUTH_SECRET: "test-secret",
	DATABASE_URL: "postgres://localhost/test",
	NODE_ENV: "test",
	EGAPRO_WEEZ_API_URL: "https://weez.example.com/api",
	EGAPRO_SUIT_API_URL: "https://api.suit.example.com",
	EGAPRO_GATEWAY_SHARED_SECRET: "a".repeat(32),
	S3_ENDPOINT: "https://s3.example.com",
	S3_REGION: "fr-par",
	S3_ACCESS_KEY_ID: "test-access-key",
	S3_SECRET_ACCESS_KEY: "test-secret-key",
	S3_BUCKET_NAME: "test-bucket",
	CLAMAV_HOST: "localhost",
	CLAMAV_PORT: "3310",
	NEXTAUTH_URL: "http://localhost:3000",
	SKIP_ENV_VALIDATION: "",
};

async function loadExportApiToken(value: string | undefined): Promise<unknown> {
	for (const [name, envValue] of Object.entries(REQUIRED_SERVER_ENV)) {
		vi.stubEnv(name, envValue);
	}
	vi.stubEnv("EGAPRO_EXPORT_API_TOKEN", value);
	const { env } = await vi.importActual<{
		env: { EGAPRO_EXPORT_API_TOKEN: unknown };
	}>("~/env.js");
	return env.EGAPRO_EXPORT_API_TOKEN;
}

describe("EGAPRO_EXPORT_API_TOKEN", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("drops the trailing newline a sealed secret often carries", async () => {
		await expect(loadExportApiToken("export-token\n")).resolves.toBe(
			"export-token",
		);
	});

	it("keeps a token without surrounding whitespace unchanged", async () => {
		await expect(loadExportApiToken("export-token")).resolves.toBe(
			"export-token",
		);
	});

	it("reduces a whitespace-only value to an empty token, which the routes refuse", async () => {
		await expect(loadExportApiToken(" \n")).resolves.toBe("");
	});

	it("stays undefined when unset", async () => {
		await expect(loadExportApiToken(undefined)).resolves.toBeUndefined();
	});
});
