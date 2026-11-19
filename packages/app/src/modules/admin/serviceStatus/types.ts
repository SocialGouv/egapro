export type HealthStatus =
	| "operational"
	| "degraded"
	| "unavailable"
	| "misconfigured";

export type DisplayStatus = HealthStatus | "unknown";

export type Criticality = "critical" | "important" | "low";

export type ServiceProbe = {
	key: string;
	label: string;
	criticality: Criticality;
	intervalSeconds: number;
	status: DisplayStatus;
	storedStatus: HealthStatus;
	checkedAt: Date;
	changedAt: Date;
	latencyMs: number | null;
	lastError: string | null;
};

export type ScheduledJob = ServiceProbe & {
	nextExpectedAt: Date | null;
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

export type ServiceIncident = {
	id: string;
	probeKey: string;
	probeLabel: string;
	fromStatus: HealthStatus;
	toStatus: HealthStatus;
	startedAt: Date;
	endedAt: Date | null;
	lastError: string | null;
};

export type ServiceStatusOverviewSummary = {
	supervisionLost: boolean;
	degradedCount: number;
	unavailableCount: number;
	criticalUnavailableCount: number;
	lateJobCount: number;
	bannerVisible: boolean;
	tone: "success" | "warning" | "error";
};

export type ServiceStatusOverview = {
	generatedAt: Date;
	lastCheckedAt: Date | null;
	staleAfterSeconds: number;
	summary: ServiceStatusOverviewSummary;
	probes: ServiceProbe[];
	jobs: ScheduledJob[];
	incidents: ServiceIncident[];
	grafanaUrl: string | null;
};
