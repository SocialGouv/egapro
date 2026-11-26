import type { ProbeResult, ProbeStatus } from "./probes/types.js";

export type HealthCheckLine = {
	logType: "health_check";
	probeKey: string;
	status: ProbeStatus;
	latencyMs: number;
	checkedAt: string;
};

export function toHealthCheckLine(input: {
	probeKey: string;
	result: ProbeResult;
	checkedAt: Date;
}): HealthCheckLine {
	return {
		logType: "health_check",
		probeKey: input.probeKey,
		status: input.result.status,
		latencyMs: input.result.latencyMs,
		checkedAt: input.checkedAt.toISOString(),
	};
}

export function writeHealthCheckLine(
	line: HealthCheckLine,
	write: (chunk: string) => void = (chunk) => {
		process.stdout.write(chunk);
	},
): void {
	write(`${JSON.stringify(line)}\n`);
}
