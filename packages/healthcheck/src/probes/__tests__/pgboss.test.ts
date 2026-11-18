import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { createPgbossProbe } from "../pgboss.js";

function fakeSql(run: () => Promise<unknown>): Sql {
	return (() => run()) as unknown as Sql;
}

const ORDINARY = { maxPending: 100, maxAgeSeconds: 900 };

function probe(sql: Sql | null, thresholds = ORDINARY) {
	return createPgbossProbe({
		sql,
		limits: thresholds,
		secrets: [],
	});
}

function depth(pending: number, oldestAgeSeconds: number | null) {
	return fakeSql(async () => [{ pending, oldestAgeSeconds }]);
}

describe("pg-boss queue probe", () => {
	it("declares itself as an important internal probe", () => {
		expect(probe(depth(0, null))).toMatchObject({
			key: "pgboss-queue",
			label: "File des e-mails (pg-boss)",
			criticality: "important",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 5000,
		});
	});

	it("is operational with an empty queue", async () => {
		const result = await probe(depth(0, null)).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("operational");
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
	});

	it("is degraded when too many jobs are pending", async () => {
		const result = await probe(depth(500, 3600)).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("degraded");
		expect(result.message).toContain("500 jobs en attente");
		expect(result.message).toContain("le plus ancien depuis 60 min");
	});

	it("is degraded when the oldest pending job is too old", async () => {
		const result = await probe(depth(1, 901)).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("le plus ancien depuis 16 min (seuil 15 min)");
	});

	it("stays operational exactly at both thresholds and degrades one above", async () => {
		const atThreshold = await probe(depth(100, 900)).probe(
			new AbortController().signal,
		);
		const aboveThreshold = await probe(depth(101, 901)).probe(
			new AbortController().signal,
		);

		expect(atThreshold.status).toBe("operational");
		expect(aboveThreshold.status).toBe("degraded");
	});

	it("is degraded when the pg-boss schema was never initialised", async () => {
		const sql = fakeSql(async () => {
			throw Object.assign(new Error('relation "pgboss.job" does not exist'), {
				code: "42P01",
			});
		});

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("file pg-boss non initialisée");
	});

	it("is unavailable when the queue database cannot be reached", async () => {
		const sql = fakeSql(async () => {
			throw Object.assign(new Error("connect ECONNREFUSED 10.0.0.4:5432"), {
				code: "ECONNREFUSED",
			});
		});

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain("10.0.0.4");
	});

	it("is misconfigured when the credentials are refused", async () => {
		const sql = fakeSql(async () => {
			throw Object.assign(new Error("password authentication failed"), {
				code: "28P01",
			});
		});

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("is operational with 'non configuré' without a queue database", async () => {
		const result = await probe(null).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
