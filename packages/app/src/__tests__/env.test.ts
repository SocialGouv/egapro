// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_CAMPAIGN_YEAR, V2_FIRST_CAMPAIGN_YEAR } from "~/modules/domain";

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

const BOOLEAN_FLAGS = [
	"EGAPRO_DEV_AUTH",
	"EGAPRO_E2E_CLOCK",
	"EGAPRO_E2E_ADMIN_MFA",
] as const;

async function loadEnvWith(
	overrides: Record<string, string | undefined>,
): Promise<Record<string, unknown>> {
	for (const [name, value] of Object.entries({
		...REQUIRED_SERVER_ENV,
		...overrides,
	})) {
		vi.stubEnv(name, value);
	}
	const { env } = await vi.importActual<{
		env: Record<string, unknown>;
	}>("~/env.js");
	return env;
}

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("env boolean flags", () => {
	beforeEach(() => {
		for (const flag of BOOLEAN_FLAGS) vi.stubEnv(flag, undefined);
	});

	describe.each(BOOLEAN_FLAGS)("%s", (flag) => {
		it("is off when unset", async () => {
			const env = await loadEnvWith({});

			expect(env[flag]).toBe(false);
		});

		it('is on for the literal "true"', async () => {
			const env = await loadEnvWith({ [flag]: "true" });

			expect(env[flag]).toBe(true);
		});

		it('is off for the literal "false"', async () => {
			const env = await loadEnvWith({ [flag]: "false" });

			expect(env[flag]).toBe(false);
		});

		it.each([
			"1",
			"yes",
			"TRUE",
			"on",
		])("rejects the ambiguous value %s", async (value) => {
			await expect(loadEnvWith({ [flag]: value })).rejects.toThrow();
		});
	});
});

describe("EGAPRO_EXPORT_API_TOKEN", () => {
	async function loadExportApiToken(
		value: string | undefined,
	): Promise<unknown> {
		const env = await loadEnvWith({ EGAPRO_EXPORT_API_TOKEN: value });
		return env.EGAPRO_EXPORT_API_TOKEN;
	}

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

describe("EGAPRO_RECETTE_CAMPAIGN_YEAR", () => {
	async function loadDevEnvWithYear(
		value: string | undefined,
	): Promise<Record<string, unknown>> {
		return loadEnvWith({
			EGAPRO_RECETTE_CAMPAIGN_YEAR: value,
			NEXT_PUBLIC_EGAPRO_ENV: "dev",
		});
	}

	it("stays undefined when unset", async () => {
		const env = await loadDevEnvWithYear(undefined);

		expect(env.EGAPRO_RECETTE_CAMPAIGN_YEAR).toBeUndefined();
	});

	it("parses a year into a number", async () => {
		const env = await loadDevEnvWithYear("2030");

		expect(env.EGAPRO_RECETTE_CAMPAIGN_YEAR).toBe(2030);
	});

	it.each([
		V2_FIRST_CAMPAIGN_YEAR,
		MAX_CAMPAIGN_YEAR,
	])("accepts the boundary year %i", async (year) => {
		const env = await loadDevEnvWithYear(String(year));

		expect(env.EGAPRO_RECETTE_CAMPAIGN_YEAR).toBe(year);
	});

	it("is bounded the same way by the promote-test-env workflow that sets it", () => {
		const workflow = readFileSync(
			join(
				process.cwd(),
				"..",
				"..",
				".github",
				"workflows",
				"promote-test-env.yaml",
			),
			"utf-8",
		);

		expect(workflow).toContain(
			`[ "$CAMPAIGN_YEAR" -lt ${V2_FIRST_CAMPAIGN_YEAR} ]`,
		);
		expect(workflow).toContain(`[ "$CAMPAIGN_YEAR" -gt ${MAX_CAMPAIGN_YEAR} ]`);
	});

	it("rejects a year before the first V2 campaign", async () => {
		await expect(
			loadDevEnvWithYear(String(V2_FIRST_CAMPAIGN_YEAR - 1)),
		).rejects.toThrow();
	});

	it("rejects a year past the last accepted campaign year", async () => {
		await expect(
			loadDevEnvWithYear(String(MAX_CAMPAIGN_YEAR + 1)),
		).rejects.toThrow();
	});

	it.each([
		"0x7EE",
		"2030.0",
		" 2030",
		"20300",
		"abcd",
	])("rejects the non-year value %s", async (value) => {
		await expect(loadDevEnvWithYear(value)).rejects.toThrow();
	});

	it.each([
		"preprod",
		"prod",
	])("refuses to start when set on a %s build", async (target) => {
		await expect(
			loadEnvWith({
				EGAPRO_RECETTE_CAMPAIGN_YEAR: "2030",
				NEXT_PUBLIC_EGAPRO_ENV: target,
			}),
		).rejects.toThrow(/EGAPRO_RECETTE_CAMPAIGN_YEAR.*refusing to start/s);
	});

	it.each([
		"preprod",
		"prod",
	])("lets a %s build start when unset", async (target) => {
		const env = await loadEnvWith({
			EGAPRO_RECETTE_CAMPAIGN_YEAR: undefined,
			NEXT_PUBLIC_EGAPRO_ENV: target,
		});

		expect(env.NEXT_PUBLIC_EGAPRO_ENV).toBe(target);
	});
});
