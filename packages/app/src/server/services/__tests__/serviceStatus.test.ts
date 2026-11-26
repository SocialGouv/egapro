import { describe, expect, it, vi } from "vitest";

import type { DB } from "~/server/db";

import { readServiceStatus } from "../serviceStatus";

const NOW = new Date("2026-11-19T10:00:00.000Z");

type ProbeRow = {
	key: string;
	label: string;
	criticality: "critical" | "important" | "low";
	kind: "internal" | "partner" | "exposed" | "job";
	intervalSeconds: number;
	status: "operational" | "degraded" | "unavailable" | "misconfigured";
	latencyMs: number | null;
	checkedAt: Date;
	changedAt: Date;
	lastError: string | null;
	nextExpectedAt: Date | null;
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

type IncidentRow = {
	id: string;
	probeKey: string;
	probeLabel: string;
	fromStatus: "operational" | "degraded" | "unavailable" | "misconfigured";
	toStatus: "operational" | "degraded" | "unavailable" | "misconfigured";
	startedAt: Date;
	endedAt: Date | null;
	lastError: string | null;
};

function probeRow(overrides: Partial<ProbeRow> = {}): ProbeRow {
	return {
		key: "postgres-app",
		label: "PostgreSQL (application)",
		criticality: "critical",
		kind: "internal",
		intervalSeconds: 60,
		status: "operational",
		latencyMs: 4,
		checkedAt: NOW,
		changedAt: NOW,
		lastError: null,
		nextExpectedAt: null,
		lastSuccessAt: null,
		lastFailureAt: null,
		...overrides,
	};
}

function buildDb({
	probes = [] as ProbeRow[],
	incidents = [] as IncidentRow[],
} = {}) {
	let selectCall = 0;

	const select = vi.fn(() => {
		selectCall++;
		if (selectCall === 1) {
			return { from: vi.fn(() => Promise.resolve(probes)) };
		}
		return {
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn(() => Promise.resolve(incidents)),
		};
	});

	return { select } as unknown as DB;
}

function read(db: DB) {
	return readServiceStatus(db, {
		now: NOW,
		staleAfterSeconds: 300,
		grafanaUrl: null,
	});
}

describe("readServiceStatus", () => {
	it("separates service probes from scheduled jobs", async () => {
		const overview = await read(
			buildDb({
				probes: [
					probeRow(),
					probeRow({
						key: "job-gip-mds-import",
						label: "Import GIP-MDS",
						kind: "job",
						nextExpectedAt: new Date("2026-11-20T03:00:00.000Z"),
						lastSuccessAt: new Date("2026-11-19T03:00:00.000Z"),
						lastFailureAt: new Date("2026-11-18T03:00:00.000Z"),
					}),
				],
			}),
		);

		expect(overview.probes.map((probe) => probe.key)).toEqual(["postgres-app"]);
		expect(overview.jobs).toEqual([
			expect.objectContaining({
				key: "job-gip-mds-import",
				lastSuccessAt: new Date("2026-11-19T03:00:00.000Z"),
				lastFailureAt: new Date("2026-11-18T03:00:00.000Z"),
				nextExpectedAt: new Date("2026-11-20T03:00:00.000Z"),
			}),
		]);
	});

	it("turns a probe older than the freshness window into unknown", async () => {
		const staleCheckedAt = new Date(NOW.getTime() - 10 * 60_000);

		const overview = await read(
			buildDb({
				probes: [
					probeRow({
						status: "operational",
						checkedAt: staleCheckedAt,
						changedAt: staleCheckedAt,
					}),
				],
			}),
		);

		expect(overview.probes[0]).toMatchObject({
			status: "unknown",
			storedStatus: "operational",
		});
		expect(overview.summary.supervisionLost).toBe(true);
	});

	it("keeps a slow partner probe green between two cycles", async () => {
		const overview = await read(
			buildDb({
				probes: [
					probeRow({
						key: "weez",
						label: "WEEZ",
						kind: "partner",
						intervalSeconds: 900,
						checkedAt: new Date(NOW.getTime() - 10 * 60_000),
					}),
				],
			}),
		);

		expect(overview.probes[0]?.status).toBe("operational");
		expect(overview.summary.supervisionLost).toBe(false);
	});

	it("exposes the newest check as the global freshness indicator", async () => {
		const older = new Date(NOW.getTime() - 120_000);
		const newer = new Date(NOW.getTime() - 30_000);

		const overview = await read(
			buildDb({
				probes: [
					probeRow({ key: "a", checkedAt: older }),
					probeRow({ key: "b", checkedAt: newer }),
				],
			}),
		);

		expect(overview.lastCheckedAt).toEqual(newer);
	});

	it("joins the incident label and forwards the window rows", async () => {
		const incident: IncidentRow = {
			id: "incident-1",
			probeKey: "postgres-app",
			probeLabel: "PostgreSQL (application)",
			fromStatus: "operational",
			toStatus: "unavailable",
			startedAt: new Date(NOW.getTime() - 3_600_000),
			endedAt: null,
			lastError: "timeout after 5000 ms",
		};

		const overview = await read(
			buildDb({ probes: [probeRow()], incidents: [incident] }),
		);

		expect(overview.incidents).toEqual([incident]);
	});

	it("passes the configured Grafana URL through", async () => {
		const overview = await readServiceStatus(buildDb(), {
			now: NOW,
			staleAfterSeconds: 300,
			grafanaUrl: "https://grafana.example.com/d/egapro",
		});

		expect(overview.grafanaUrl).toBe("https://grafana.example.com/d/egapro");
		expect(overview.staleAfterSeconds).toBe(300);
	});

	it("summarises an empty table as a lost supervision", async () => {
		const overview = await read(buildDb());

		expect(overview.lastCheckedAt).toBeNull();
		expect(overview.summary.supervisionLost).toBe(true);
	});
});
