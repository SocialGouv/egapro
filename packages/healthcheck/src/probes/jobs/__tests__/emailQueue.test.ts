import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import { createEmailQueueJobProbe } from "../emailQueue.js";

const NOW = new Date("2026-01-02T10:00:00.000Z");

function queueSql(row: {
	failedInWindow: number;
	oldestPendingSeconds: number | null;
}): Sql {
	return (() => Promise.resolve([row])) as unknown as Sql;
}

function probe(sql: Sql | null) {
	return createEmailQueueJobProbe({
		sql,
		maxAgeSeconds: 900,
		staleHours: 26,
		secrets: [],
		now: () => NOW,
	});
}

describe("e-mail queue job probe", () => {
	it("declares itself as an important job probe", () => {
		expect(
			probe(queueSql({ failedInWindow: 0, oldestPendingSeconds: null })),
		).toMatchObject({
			key: "job-email-notification-queue",
			label: "File des e-mails (traitements)",
			criticality: "important",
			kind: "job",
			intervalSeconds: 60,
		});
	});

	it("is operational with an empty queue and no failure", async () => {
		const result = await probe(
			queueSql({ failedInWindow: 0, oldestPendingSeconds: null }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.nextExpectedAt).toBeUndefined();
	});

	it("is degraded when a job failed inside the window", async () => {
		const result = await probe(
			queueSql({ failedInWindow: 3, oldestPendingSeconds: null }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("3 job(s) en échec sur la fenêtre");
	});

	it("is degraded when the oldest pending job passes the queue age threshold", async () => {
		const result = await probe(
			queueSql({ failedInWindow: 0, oldestPendingSeconds: 901 }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("le plus ancien depuis 16 min (seuil 15 min)");
	});

	it("stays operational exactly at the age threshold", async () => {
		const result = await probe(
			queueSql({ failedInWindow: 0, oldestPendingSeconds: 900 }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
	});

	it("is unavailable when the oldest job has waited past the freshness window", async () => {
		const result = await probe(
			queueSql({ failedInWindow: 2, oldestPendingSeconds: 27 * 3600 }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe(
			"en retard — le plus ancien job attend depuis 27 h",
		);
	});

	it("is degraded when the pg-boss schema was never initialised", async () => {
		const sql = (() =>
			Promise.reject(
				Object.assign(new Error('relation "pgboss.job" does not exist'), {
					code: "42P01",
				}),
			)) as unknown as Sql;

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("schéma de suivi non initialisé");
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
