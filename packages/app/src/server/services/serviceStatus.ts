import "server-only";

import { desc, eq, gte } from "drizzle-orm";
import { env } from "~/env.js";
import type {
	ScheduledJob,
	ServiceProbe,
	ServiceStatusOverview,
	ServiceStatusOverviewSummary,
} from "~/modules/admin/serviceStatus";
import {
	compareBySeverity,
	INCIDENT_LIMIT,
	INCIDENT_WINDOW_DAYS,
	resolveDisplayStatus,
	summarizeServiceStatus,
	unreachableSummary,
} from "~/modules/admin/serviceStatus";
import { type DB, db } from "~/server/db";
import { healthIncidents, healthProbes } from "~/server/db/schema";

const DAY_MS = 86_400_000;

export type ServiceStatusReadOptions = {
	now: Date;
	staleAfterSeconds: number;
	grafanaUrl: string | null;
};

export async function readServiceStatus(
	database: DB,
	{ now, staleAfterSeconds, grafanaUrl }: ServiceStatusReadOptions,
): Promise<ServiceStatusOverview> {
	const since = new Date(now.getTime() - INCIDENT_WINDOW_DAYS * DAY_MS);

	const [read, incidentRows] = await Promise.all([
		readProbesAndJobs(database, now, staleAfterSeconds),
		database
			.select({
				id: healthIncidents.id,
				probeKey: healthIncidents.probeKey,
				probeLabel: healthProbes.label,
				fromStatus: healthIncidents.fromStatus,
				toStatus: healthIncidents.toStatus,
				startedAt: healthIncidents.startedAt,
				endedAt: healthIncidents.endedAt,
				lastError: healthIncidents.lastError,
			})
			.from(healthIncidents)
			.innerJoin(healthProbes, eq(healthIncidents.probeKey, healthProbes.key))
			.where(gte(healthIncidents.startedAt, since))
			.orderBy(desc(healthIncidents.startedAt))
			.limit(INCIDENT_LIMIT),
	]);

	return {
		generatedAt: now,
		lastCheckedAt: read.lastCheckedAt,
		staleAfterSeconds,
		summary: summarizeServiceStatus(read.probes, read.jobs),
		probes: read.probes,
		jobs: read.jobs,
		incidents: incidentRows,
		grafanaUrl,
	};
}

type ProbeRead = {
	probes: ServiceProbe[];
	jobs: ScheduledJob[];
	lastCheckedAt: Date | null;
};

async function readProbesAndJobs(
	database: DB,
	now: Date,
	staleAfterSeconds: number,
): Promise<ProbeRead> {
	const probeRows = await database
		.select({
			key: healthProbes.key,
			label: healthProbes.label,
			criticality: healthProbes.criticality,
			kind: healthProbes.kind,
			intervalSeconds: healthProbes.intervalSeconds,
			status: healthProbes.status,
			latencyMs: healthProbes.latencyMs,
			checkedAt: healthProbes.checkedAt,
			changedAt: healthProbes.changedAt,
			lastError: healthProbes.lastError,
			nextExpectedAt: healthProbes.nextExpectedAt,
			lastSuccessAt: healthProbes.lastSuccessAt,
			lastFailureAt: healthProbes.lastFailureAt,
		})
		.from(healthProbes);

	const probes: ServiceProbe[] = [];
	const jobs: ScheduledJob[] = [];

	for (const row of probeRows) {
		const base: ServiceProbe = {
			key: row.key,
			label: row.label,
			criticality: row.criticality,
			intervalSeconds: row.intervalSeconds,
			status: resolveDisplayStatus(
				row.status,
				row.checkedAt,
				now,
				staleAfterSeconds,
				row.intervalSeconds,
			),
			storedStatus: row.status,
			checkedAt: row.checkedAt,
			changedAt: row.changedAt,
			latencyMs: row.latencyMs,
			lastError: row.lastError,
		};

		if (row.kind === "job") {
			jobs.push({
				...base,
				nextExpectedAt: row.nextExpectedAt,
				lastSuccessAt: row.lastSuccessAt,
				lastFailureAt: row.lastFailureAt,
			});
		} else {
			probes.push(base);
		}
	}

	probes.sort(compareBySeverity);
	jobs.sort(compareBySeverity);

	const lastCheckedAt = probeRows.reduce<Date | null>((latest, row) => {
		if (latest === null || row.checkedAt > latest) return row.checkedAt;
		return latest;
	}, null);

	return { probes, jobs, lastCheckedAt };
}

export async function readServiceStatusOverview(
	database: DB,
): Promise<ServiceStatusOverview> {
	return readServiceStatus(database, resolveReadOptions());
}

export async function readServiceStatusBanner(): Promise<ServiceStatusOverviewSummary> {
	try {
		const { now, staleAfterSeconds } = resolveReadOptions();
		const { probes, jobs } = await readProbesAndJobs(
			db,
			now,
			staleAfterSeconds,
		);
		return summarizeServiceStatus(probes, jobs);
	} catch (error) {
		// The home banner must never break the back-office: an unreadable
		// supervision reads as lost, which is exactly what it is.
		console.error("[service-status] banner read failed", error);
		return unreachableSummary();
	}
}

function resolveReadOptions(): ServiceStatusReadOptions {
	return {
		now: new Date(),
		staleAfterSeconds: env.HEALTHCHECK_STALE_AFTER_SECONDS,
		grafanaUrl: env.EGAPRO_GRAFANA_URL ?? null,
	};
}
