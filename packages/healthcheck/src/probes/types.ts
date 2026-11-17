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
