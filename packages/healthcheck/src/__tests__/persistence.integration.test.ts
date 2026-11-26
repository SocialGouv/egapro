import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { persistProbeResult } from "../persistence.js";
import type { Probe, ProbeResult } from "../probes/types.js";

const probe: Probe = {
	key: "postgres-app",
	label: "PostgreSQL (application)",
	criticality: "critical",
	kind: "internal",
	intervalSeconds: 60,
	timeoutMs: 5000,
	probe: async () => ({ status: "operational", latencyMs: 1 }),
};

type ProbeRow = {
	status: string;
	intervalSeconds: number;
	latencyMs: number | null;
	checkedAt: Date;
	changedAt: Date;
	consecutiveFailures: number;
	lastError: string | null;
	nextExpectedAt: Date | null;
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

type IncidentRow = {
	probeKey: string;
	fromStatus: string;
	toStatus: string;
	startedAt: Date;
	endedAt: Date | null;
	lastError: string | null;
};

let sql: postgres.Sql;

const healthy: ProbeResult = { status: "operational", latencyMs: 4 };
const down: ProbeResult = {
	status: "unavailable",
	latencyMs: 5000,
	message: "timeout after 5000 ms",
};

function at(minutes: number): Date {
	return new Date(`2026-11-17T10:${String(minutes).padStart(2, "0")}:00.000Z`);
}

async function readProbe(): Promise<ProbeRow | undefined> {
	const rows = await sql<ProbeRow[]>`
		SELECT status, interval_seconds AS "intervalSeconds",
			latency_ms AS "latencyMs", checked_at AS "checkedAt",
			changed_at AS "changedAt", consecutive_failures AS "consecutiveFailures",
			last_error AS "lastError", next_expected_at AS "nextExpectedAt",
			last_success_at AS "lastSuccessAt", last_failure_at AS "lastFailureAt"
		FROM app_health_probe
	`;
	return rows[0];
}

async function readIncidents(): Promise<IncidentRow[]> {
	return sql<IncidentRow[]>`
		SELECT probe_key AS "probeKey", from_status AS "fromStatus",
			to_status AS "toStatus", started_at AS "startedAt",
			ended_at AS "endedAt", last_error AS "lastError"
		FROM app_health_incident
		ORDER BY started_at
	`;
}

describe("persistProbeResult", () => {
	beforeAll(() => {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error("DATABASE_URL is not set by the global setup");
		sql = postgres(url, { max: 1 });
	});

	afterAll(async () => {
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_health_incident`;
		await sql`DELETE FROM app_health_probe`;
	});

	it("stores one row per probe on the first cycle, with no incident", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });

		const row = await readProbe();

		expect(row).toMatchObject({
			status: "operational",
			latencyMs: 4,
			consecutiveFailures: 0,
			lastError: null,
		});
		expect(row?.checkedAt).toEqual(at(0));
		expect(row?.changedAt).toEqual(at(0));
		expect(await readIncidents()).toEqual([]);
	});

	it("stores the next expected run of a job probe", async () => {
		const nextExpectedAt = new Date("2026-11-18T03:00:00.000Z");

		await persistProbeResult(sql, {
			probe: { ...probe, key: "job-gip-mds-import", kind: "job" },
			result: { ...healthy, nextExpectedAt },
			checkedAt: at(0),
		});

		expect((await readProbe())?.nextExpectedAt).toEqual(nextExpectedAt);
	});

	it("clears the next expected run when a probe no longer publishes one", async () => {
		await persistProbeResult(sql, {
			probe: { ...probe, key: "job-gip-mds-import", kind: "job" },
			result: {
				...healthy,
				nextExpectedAt: new Date("2026-11-18T03:00:00.000Z"),
			},
			checkedAt: at(0),
		});

		await persistProbeResult(sql, {
			probe: { ...probe, key: "job-gip-mds-import", kind: "job" },
			result: down,
			checkedAt: at(1),
		});

		expect((await readProbe())?.nextExpectedAt).toBeNull();
	});

	it("stores the probe's own cycle for the staleness rule", async () => {
		await persistProbeResult(sql, {
			probe: { ...probe, intervalSeconds: 900 },
			result: healthy,
			checkedAt: at(0),
		});

		expect((await readProbe())?.intervalSeconds).toBe(900);
	});

	it("stores the last observed success and failure of a job probe", async () => {
		await persistProbeResult(sql, {
			probe: { ...probe, key: "job-gip-mds-import", kind: "job" },
			result: { ...down, lastSuccessAt: at(2), lastFailureAt: at(3) },
			checkedAt: at(4),
		});

		const row = await readProbe();
		expect(row?.lastSuccessAt).toEqual(at(2));
		expect(row?.lastFailureAt).toEqual(at(3));
	});

	it("keeps the stored trace when a probe cannot observe it", async () => {
		const jobProbe = { ...probe, key: "job-gip-mds-import", kind: "job" };

		await persistProbeResult(sql, {
			probe: jobProbe,
			result: { ...healthy, lastSuccessAt: at(2), lastFailureAt: at(1) },
			checkedAt: at(2),
		});
		await persistProbeResult(sql, {
			probe: jobProbe,
			result: down,
			checkedAt: at(3),
		});

		const row = await readProbe();
		expect(row?.lastSuccessAt).toEqual(at(2));
		expect(row?.lastFailureAt).toEqual(at(1));
	});

	it("opens an incident when a healthy probe goes down", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });

		await persistProbeResult(sql, { probe, result: down, checkedAt: at(1) });

		const row = await readProbe();
		expect(row?.status).toBe("unavailable");
		expect(row?.consecutiveFailures).toBe(1);
		expect(row?.lastError).toBe("timeout after 5000 ms");
		expect(await readIncidents()).toEqual([
			expect.objectContaining({
				probeKey: "postgres-app",
				fromStatus: "operational",
				toStatus: "unavailable",
				startedAt: at(1),
				endedAt: null,
				lastError: "timeout after 5000 ms",
			}),
		]);
	});

	it("creates no second incident for a failure that persists, and keeps changed_at", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });
		await persistProbeResult(sql, { probe, result: down, checkedAt: at(1) });

		await persistProbeResult(sql, { probe, result: down, checkedAt: at(2) });

		const row = await readProbe();
		expect(row?.consecutiveFailures).toBe(2);
		expect(row?.checkedAt).toEqual(at(2));
		expect(row?.changedAt).toEqual(at(1));
		expect(await readIncidents()).toHaveLength(1);
	});

	it("closes the incident and clears the error on recovery", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });
		await persistProbeResult(sql, { probe, result: down, checkedAt: at(1) });

		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(5) });

		const row = await readProbe();
		expect(row?.status).toBe("operational");
		expect(row?.consecutiveFailures).toBe(0);
		expect(row?.lastError).toBeNull();
		expect(row?.changedAt).toEqual(at(5));

		const incidents = await readIncidents();
		expect(incidents).toHaveLength(1);
		expect(incidents[0]?.endedAt).toEqual(at(5));
	});

	it("closes one incident and opens another when the failure changes shape", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });
		await persistProbeResult(sql, { probe, result: down, checkedAt: at(1) });

		await persistProbeResult(sql, {
			probe,
			result: { status: "degraded", latencyMs: 900 },
			checkedAt: at(2),
		});

		const incidents = await readIncidents();
		expect(incidents).toHaveLength(2);
		expect(incidents[0]?.endedAt).toEqual(at(2));
		expect(incidents[1]).toMatchObject({
			fromStatus: "unavailable",
			toStatus: "degraded",
			endedAt: null,
			lastError: null,
		});
	});

	it("never writes to the audit action log", async () => {
		await persistProbeResult(sql, { probe, result: healthy, checkedAt: at(0) });
		await persistProbeResult(sql, { probe, result: down, checkedAt: at(1) });

		const rows = await sql<{ count: string }[]>`
			SELECT count(*)::text AS count FROM audit.action_log
		`;

		expect(rows[0]?.count).toBe("0");
	});
});
