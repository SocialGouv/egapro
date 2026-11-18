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

	it("collects the SMTP and queue passwords that must never reach a message", () => {
		const config = resolveConfig({
			SMTP_PASS: "smtp-secret",
			NOTIFICATIONS_POSTGRES_PASSWORD: "queue-secret",
		});

		expect(config.secrets).toEqual(["queue-secret", "smtp-secret"]);
	});

	it("reads the ClamAV endpoint and defaults its port", () => {
		expect(resolveConfig({ CLAMAV_HOST: "clamavd" }).clamav).toEqual({
			host: "clamavd",
			port: 3310,
		});
		expect(
			resolveConfig({ CLAMAV_HOST: "clamavd", CLAMAV_PORT: "3311" }).clamav,
		).toEqual({ host: "clamavd", port: 3311 });
	});

	it("reports no ClamAV without CLAMAV_HOST", () => {
		expect(resolveConfig({}).clamav).toBeNull();
	});

	it("reads the Valkey URL", () => {
		expect(resolveConfig({ VALKEY_URL: "redis://valkey:6379" }).valkeyUrl).toBe(
			"redis://valkey:6379",
		);
		expect(resolveConfig({}).valkeyUrl).toBeNull();
	});

	it("only configures SMTP when mail is enabled and a host is set", () => {
		expect(resolveConfig({ SMTP_HOST: "mailpit" }).smtp).toBeNull();
		expect(resolveConfig({ MAIL_ENABLED: "true" }).smtp).toBeNull();

		expect(
			resolveConfig({
				MAIL_ENABLED: "true",
				SMTP_HOST: "smtp.example.gouv.fr",
				SMTP_PORT: "587",
				SMTP_SECURE: "true",
				SMTP_USER: "relay",
				SMTP_PASS: "s3cr3t-pass",
			}).smtp,
		).toEqual({
			host: "smtp.example.gouv.fr",
			port: 587,
			secure: true,
			user: "relay",
			pass: "s3cr3t-pass",
		});
	});

	it("falls back to the application database for the pg-boss queue", () => {
		const config = resolveConfig({
			DATABASE_URL: "postgresql://db:5432/app",
		});

		expect(config.queue).toEqual({
			databaseUrl: "postgresql://db:5432/app",
			maxPending: 100,
			maxAgeSeconds: 900,
		});
	});

	it("prefers the dedicated queue database over the application one", () => {
		const config = resolveConfig({
			DATABASE_URL: "postgresql://db:5432/app",
			NOTIFICATIONS_POSTGRES_HOST: "pg-queue",
			NOTIFICATIONS_POSTGRES_USER: "egapro",
			NOTIFICATIONS_POSTGRES_DB: "notifications",
		});

		expect(config.queue?.databaseUrl).toBe(
			"postgresql://egapro@pg-queue:5432/notifications",
		);
	});

	it("reads the queue depth thresholds", () => {
		const config = resolveConfig({
			DATABASE_URL: "postgresql://db:5432/app",
			HEALTHCHECK_QUEUE_MAX_PENDING: "25",
			HEALTHCHECK_QUEUE_MAX_AGE_SECONDS: "120",
		});

		expect(config.queue?.maxPending).toBe(25);
		expect(config.queue?.maxAgeSeconds).toBe(120);
	});

	it("reports no queue without any database", () => {
		expect(resolveConfig({}).queue).toBeNull();
	});
});
