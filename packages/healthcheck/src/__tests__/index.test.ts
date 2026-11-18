import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { resolveConfig } from "../config.js";
import { buildProbes } from "../index.js";

const sql = (() => Promise.resolve([])) as unknown as Sql;

describe("buildProbes", () => {
	it("always supervises the application database and the internal services", () => {
		const probes = buildProbes(
			resolveConfig({ DATABASE_URL: "postgresql://db:5432/app" }),
			sql,
		);

		expect(probes.map((probe) => probe.key)).toEqual([
			"postgres-app",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			"proconnect",
			"weez",
		]);
		expect(probes[0]?.intervalSeconds).toBe(60);
	});

	it("adds the S3 probe when the storage is configured", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				S3_ENDPOINT: "https://s3.example.gouv.fr",
				S3_REGION: "gra",
				S3_ACCESS_KEY_ID: "access-key-id",
				S3_SECRET_ACCESS_KEY: "secret-access-key",
				S3_BUCKET_NAME: "egapro-dev-app",
			}),
			sql,
		);

		expect(probes.map((probe) => probe.key)).toEqual([
			"postgres-app",
			"s3",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			"proconnect",
			"weez",
		]);
	});

	it("gives internal probes and partner probes their own cadence", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				HEALTHCHECK_INTERVAL_SECONDS: "30",
				HEALTHCHECK_PARTNER_INTERVAL_SECONDS: "900",
			}),
			sql,
		);
		const intervalOf = (key: string) =>
			probes.find((probe) => probe.key === key)?.intervalSeconds;

		expect(intervalOf("postgres-app")).toBe(30);
		expect(intervalOf("clamav")).toBe(30);
		expect(intervalOf("proconnect")).toBe(900);
		expect(intervalOf("weez")).toBe(900);
	});

	it("keeps the probes of unconfigured services instead of dropping them", () => {
		const probes = buildProbes(
			resolveConfig({ DATABASE_URL: "postgresql://db:5432/app" }),
			sql,
		);

		expect(probes.map((probe) => probe.key)).toContain("clamav");
		expect(probes.map((probe) => probe.key)).toContain("smtp");
	});
});
