import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { resolveConfig } from "../config.js";
import { buildProbes } from "../index.js";
import { REMINDER_SCHEDULES } from "../probes/jobs/pgbossSchedules.js";

const sql = (() => Promise.resolve([])) as unknown as Sql;

const JOB_PROBE_KEYS = [
	"job-export-generate",
	"job-gip-mds-import",
	"job-declaration-cleanup",
	"job-audit-cleanup",
	...REMINDER_SCHEDULES.map((schedule) => schedule.key),
	"job-email-notification-queue",
];

const EXPOSED = {
	HEALTHCHECK_PARTNER_PROBES_ENABLED: "true",
	HEALTHCHECK_PUBLIC_URL: "https://egapro.travail.gouv.fr",
	HEALTHCHECK_APISIX_SUIT_URL: "https://api-suit-egapro.travail.gouv.fr",
	HEALTHCHECK_APISIX_SUIT_API_KEY: "supervision-secret-key",
};

function keysOf(probes: ReturnType<typeof buildProbes>): string[] {
	return probes.map((probe) => probe.key);
}

describe("buildProbes", () => {
	it("always supervises the application database and the internal services", () => {
		const probes = buildProbes(
			resolveConfig({ DATABASE_URL: "postgresql://db:5432/app" }),
			sql,
		);

		expect(keysOf(probes)).toEqual([
			"postgres-app",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			...JOB_PROBE_KEYS,
			"suit-certificate",
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

		expect(keysOf(probes)).toEqual([
			"postgres-app",
			"s3",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			...JOB_PROBE_KEYS,
			"suit-certificate",
		]);
	});

	it("does not schedule partner or exposed probes when they are disabled", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				...EXPOSED,
				HEALTHCHECK_PARTNER_PROBES_ENABLED: "false",
			}),
			sql,
		);

		expect(keysOf(probes)).toEqual([
			"postgres-app",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			...JOB_PROBE_KEYS,
			"suit-certificate",
		]);
	});

	it("adds partner and exposed probes when they are enabled", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				EGAPRO_PROCONNECT_ISSUER: "https://proconnect.test",
				EGAPRO_WEEZ_API_URL: "https://weez.test",
				HEALTHCHECK_WEEZ_REFERENCE_SIREN: "130025265",
				...EXPOSED,
			}),
			sql,
		);

		expect(keysOf(probes)).toEqual([
			"postgres-app",
			"clamav",
			"valkey",
			"smtp",
			"pgboss-queue",
			...JOB_PROBE_KEYS,
			"suit-certificate",
			"proconnect",
			"weez",
			"ingress",
			"public-api",
			"suit-cse-files",
			"suit-gateway",
		]);
	});

	it("gives each family its own cadence", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				HEALTHCHECK_INTERVAL_SECONDS: "30",
				HEALTHCHECK_PARTNER_INTERVAL_SECONDS: "900",
				HEALTHCHECK_EXPOSED_INTERVAL_SECONDS: "300",
				...EXPOSED,
			}),
			sql,
		);
		const intervalOf = (key: string) =>
			probes.find((probe) => probe.key === key)?.intervalSeconds;

		expect(intervalOf("postgres-app")).toBe(30);
		expect(intervalOf("clamav")).toBe(30);
		expect(intervalOf("proconnect")).toBe(900);
		expect(intervalOf("weez")).toBe(900);
		expect(intervalOf("ingress")).toBe(300);
		expect(intervalOf("public-api")).toBe(300);
		expect(intervalOf("suit-gateway")).toBe(300);
		expect(intervalOf("suit-cse-files")).toBe(300);
	});

	it("adds the mTLS SUIT probes when the certificate and the SIREN are configured", () => {
		const probes = buildProbes(
			resolveConfig({
				DATABASE_URL: "postgresql://db:5432/app",
				EGAPRO_SUIT_API_URL: "https://api.suit.test",
				EGAPRO_SUIT_CLIENT_CERT_P12_BASE64: "ZmFrZQ==",
				HEALTHCHECK_SUIT_REFERENCE_SIREN: "130025265",
				...EXPOSED,
			}),
			sql,
		);
		const keys = keysOf(probes);

		expect(keys).toContain("suit-cse");
		expect(keys).toContain("suit-gip-mds");
		expect(keys.indexOf("suit-cse")).toBeLessThan(
			keys.indexOf("suit-cse-files"),
		);
	});

	it("keeps the probes of unconfigured services instead of dropping them", () => {
		const probes = buildProbes(
			resolveConfig({ DATABASE_URL: "postgresql://db:5432/app" }),
			sql,
		);

		expect(keysOf(probes)).toContain("clamav");
		expect(keysOf(probes)).toContain("smtp");
	});
});
