import type { ScheduledJob, ServiceProbe } from "../types";

export const NOW = new Date("2026-11-19T10:00:00.000Z");

export function serviceProbe(
	overrides: Partial<ServiceProbe> = {},
): ServiceProbe {
	return {
		key: "postgres-app",
		label: "PostgreSQL (application)",
		criticality: "critical",
		intervalSeconds: 60,
		status: "operational",
		storedStatus: "operational",
		checkedAt: NOW,
		changedAt: NOW,
		latencyMs: 4,
		lastError: null,
		...overrides,
	};
}

export function scheduledJob(
	overrides: Partial<ScheduledJob> = {},
): ScheduledJob {
	return {
		...serviceProbe({
			key: "job-gip-mds-import",
			label: "Import GIP-MDS",
			lastError: null,
		}),
		nextExpectedAt: new Date("2026-11-20T03:00:00.000Z"),
		lastSuccessAt: new Date("2026-11-19T03:00:00.000Z"),
		lastFailureAt: null,
		...overrides,
	};
}
