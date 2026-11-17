import { describe, expect, it } from "vitest";

import { resolveConfig } from "../config.js";

const S3_ENV = {
	S3_ENDPOINT: "https://s3.example.gouv.fr",
	S3_REGION: "gra",
	S3_ACCESS_KEY_ID: "access-key-id",
	S3_SECRET_ACCESS_KEY: "secret-access-key",
	S3_BUCKET_NAME: "egapro-dev-app",
};

describe("resolveConfig", () => {
	it("prefers an explicit DATABASE_URL", () => {
		const config = resolveConfig({ DATABASE_URL: "postgresql://db:5432/app" });

		expect(config.databaseUrl).toBe("postgresql://db:5432/app");
	});

	it("assembles the DSN from the discrete POSTGRES_* keys", () => {
		const config = resolveConfig({
			POSTGRES_HOST: "pg-rw",
			POSTGRES_PORT: "5432",
			POSTGRES_USER: "egapro",
			POSTGRES_PASSWORD: "p@ss:word",
			POSTGRES_DB: "egapro",
			POSTGRES_SSLMODE: "require",
		});

		expect(config.databaseUrl).toBe(
			"postgresql://egapro:p%40ss%3Aword@pg-rw:5432/egapro?sslmode=require",
		);
	});

	it("reports no database without a URL and without POSTGRES_HOST + POSTGRES_DB", () => {
		expect(resolveConfig({ POSTGRES_HOST: "pg-rw" }).databaseUrl).toBeNull();
		expect(resolveConfig({}).databaseUrl).toBeNull();
	});

	it("reads a complete S3 configuration", () => {
		expect(resolveConfig(S3_ENV).s3).toEqual({
			endpoint: "https://s3.example.gouv.fr",
			region: "gra",
			accessKeyId: "access-key-id",
			secretAccessKey: "secret-access-key",
			bucketName: "egapro-dev-app",
		});
	});

	it("reports no S3 configuration as soon as one key is missing", () => {
		const { S3_BUCKET_NAME: _bucketName, ...withoutBucket } = S3_ENV;

		expect(resolveConfig(withoutBucket).s3).toBeNull();
	});

	it("defaults the interval to 60 seconds", () => {
		expect(resolveConfig({}).intervalSeconds).toBe(60);
		expect(
			resolveConfig({ HEALTHCHECK_INTERVAL_SECONDS: "0" }).intervalSeconds,
		).toBe(60);
		expect(
			resolveConfig({ HEALTHCHECK_INTERVAL_SECONDS: "not-a-number" })
				.intervalSeconds,
		).toBe(60);
	});

	it("accepts a per-environment interval", () => {
		expect(
			resolveConfig({ HEALTHCHECK_INTERVAL_SECONDS: "300" }).intervalSeconds,
		).toBe(300);
	});

	it("collects the credentials that must never reach a stored message", () => {
		const config = resolveConfig({
			...S3_ENV,
			POSTGRES_PASSWORD: "p@ss:word",
		});

		expect(config.secrets).toEqual([
			"access-key-id",
			"secret-access-key",
			"p@ss:word",
		]);
	});

	it("ignores credentials that are not configured", () => {
		expect(resolveConfig({ POSTGRES_PASSWORD: "" }).secrets).toEqual([]);
	});
});
