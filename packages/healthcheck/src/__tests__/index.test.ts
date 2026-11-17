import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { type HealthcheckConfig, resolveConfig } from "../config.js";
import { buildProbes } from "../index.js";

const sql = (() => Promise.resolve([])) as unknown as Sql;

const config: HealthcheckConfig = {
	databaseUrl: "postgresql://db:5432/app",
	s3: null,
	intervalSeconds: 30,
	secrets: [],
};

describe("buildProbes", () => {
	it("always supervises the application database", () => {
		const probes = buildProbes(config, sql);

		expect(probes.map((probe) => probe.key)).toEqual(["postgres-app"]);
		expect(probes[0]?.intervalSeconds).toBe(30);
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

		expect(probes.map((probe) => probe.key)).toEqual(["postgres-app", "s3"]);
	});
});
