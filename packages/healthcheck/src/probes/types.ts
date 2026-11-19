export const PROBE_STATUSES = [
	"operational",
	"degraded",
	"unavailable",
	"misconfigured",
] as const;

export type ProbeStatus = (typeof PROBE_STATUSES)[number];

export const PROBE_CRITICALITIES = ["critical", "important", "low"] as const;

export type ProbeCriticality = (typeof PROBE_CRITICALITIES)[number];

export const PROBE_KINDS = ["internal", "partner", "exposed", "job"] as const;

export type ProbeKind = (typeof PROBE_KINDS)[number];

export type ProbeResult = {
	status: ProbeStatus;
	latencyMs: number;
	message?: string;
	/**
	 * Next run the worker expects, from the cron definition it owns. Only job
	 * probes set it; the screen prints it instead of re-deriving a schedule.
	 */
	nextExpectedAt?: Date;
	/**
	 * Last successful and failed run the probe could observe. Persisted so the
	 * back-office prints them without replaying the audit or pg-boss queries
	 * itself. A probe that cannot reach its source leaves them undefined; the
	 * stored values are then kept rather than erased.
	 */
	lastSuccessAt?: Date;
	lastFailureAt?: Date;
};

export type Probe = {
	key: string;
	label: string;
	criticality: ProbeCriticality;
	kind: ProbeKind;
	intervalSeconds: number;
	timeoutMs: number;
	probe(signal: AbortSignal): Promise<ProbeResult>;
};

export function isServiceDown(status: ProbeStatus): boolean {
	return status !== "operational";
}
