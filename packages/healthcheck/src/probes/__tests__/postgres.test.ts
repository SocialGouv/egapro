import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { createPostgresProbe } from "../postgres.js";

function fakeSql(run: () => Promise<unknown>): Sql {
	return (() => run()) as unknown as Sql;
}

const PASSING = fakeSql(async () => [{ "?column?": 1 }]);

function errorWithCode(code: string, message: string): Error {
	return Object.assign(new Error(message), { code });
}

describe("postgres probe", () => {
	it("declares itself as a critical internal probe", () => {
		const probe = createPostgresProbe({ sql: PASSING, secrets: [] });

		expect(probe).toMatchObject({
			key: "postgres-app",
			label: "PostgreSQL (application)",
			criticality: "critical",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 5000,
		});
	});

	it("is operational when SELECT 1 answers", async () => {
		const result = await createPostgresProbe({
			sql: PASSING,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		expect(result.message).toBeUndefined();
	});

	it("is unavailable when the server cannot be reached", async () => {
		const sql = fakeSql(async () => {
			throw errorWithCode("ECONNREFUSED", "connect ECONNREFUSED 10.0.0.4:5432");
		});

		const result = await createPostgresProbe({ sql, secrets: [] }).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connect ECONNREFUSED 10.0.0.4:5432");
	});

	it("is misconfigured when the credentials are refused", async () => {
		const sql = fakeSql(async () => {
			throw errorWithCode(
				"28P01",
				"password authentication failed for user postgres",
			);
		});

		const result = await createPostgresProbe({ sql, secrets: [] }).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("misconfigured");
	});

	it("strips the configured password from the stored message", async () => {
		const sql = fakeSql(async () => {
			throw errorWithCode(
				"28P01",
				"password authentication failed for user egapro with password s3cr3t-value",
			);
		});

		const result = await createPostgresProbe({
			sql,
			secrets: ["s3cr3t-value"],
		}).probe(new AbortController().signal);

		expect(result.message).not.toContain("s3cr3t-value");
		expect(result.message).toContain("[redacted]");
	});

	it("accepts a per-environment interval and timeout", () => {
		const probe = createPostgresProbe({
			sql: PASSING,
			secrets: [],
			intervalSeconds: 300,
			timeoutMs: 1000,
		});

		expect(probe.intervalSeconds).toBe(300);
		expect(probe.timeoutMs).toBe(1000);
	});
});
