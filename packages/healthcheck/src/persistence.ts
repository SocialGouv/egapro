import type { Sql } from "postgres";
import {
	isServiceDown,
	type Probe,
	type ProbeResult,
	type ProbeStatus,
} from "./probes/types.js";

export type ProbeState = {
	status: ProbeStatus;
	consecutiveFailures: number;
};

export type PersistPlan = {
	status: ProbeStatus;
	consecutiveFailures: number;
	changed: boolean;
	closeOpenIncident: boolean;
	openIncident: boolean;
};

export type PersistProbeInput = {
	probe: Probe;
	result: ProbeResult;
	checkedAt: Date;
};

export function planPersist(
	previous: ProbeState | null,
	result: ProbeResult,
): PersistPlan {
	const failing = isServiceDown(result.status);
	const changed = previous === null || previous.status !== result.status;

	return {
		status: result.status,
		consecutiveFailures: failing ? (previous?.consecutiveFailures ?? 0) + 1 : 0,
		changed,
		closeOpenIncident: previous !== null && changed,
		openIncident: previous !== null && changed && failing,
	};
}

export async function persistProbeResult(
	sql: Sql,
	{ probe, result, checkedAt }: PersistProbeInput,
): Promise<PersistPlan> {
	return sql.begin(async (tx) => {
		const previousRows = await tx<
			{ status: ProbeStatus; consecutiveFailures: number }[]
		>`
			SELECT status, consecutive_failures AS "consecutiveFailures"
			FROM app_health_probe
			WHERE key = ${probe.key}
			FOR UPDATE
		`;
		const previous = previousRows[0] ?? null;
		const plan = planPersist(previous, result);
		const lastError =
			plan.status === "operational" ? null : (result.message ?? null);

		await tx`
			INSERT INTO app_health_probe (
				key, label, criticality, kind, status, latency_ms,
				checked_at, changed_at, consecutive_failures, last_error
			)
			VALUES (
				${probe.key}, ${probe.label}, ${probe.criticality}, ${probe.kind},
				${plan.status}, ${result.latencyMs}, ${checkedAt}, ${checkedAt},
				${plan.consecutiveFailures}, ${lastError}
			)
			ON CONFLICT (key) DO UPDATE SET
				label = EXCLUDED.label,
				criticality = EXCLUDED.criticality,
				kind = EXCLUDED.kind,
				status = EXCLUDED.status,
				latency_ms = EXCLUDED.latency_ms,
				checked_at = EXCLUDED.checked_at,
				changed_at = CASE
					WHEN app_health_probe.status IS DISTINCT FROM EXCLUDED.status
					THEN EXCLUDED.checked_at
					ELSE app_health_probe.changed_at
				END,
				consecutive_failures = EXCLUDED.consecutive_failures,
				last_error = EXCLUDED.last_error
		`;

		if (plan.closeOpenIncident) {
			await tx`
				UPDATE app_health_incident
				SET ended_at = ${checkedAt}
				WHERE probe_key = ${probe.key} AND ended_at IS NULL
			`;
		}

		if (plan.openIncident && previous) {
			await tx`
				INSERT INTO app_health_incident (
					id, probe_key, from_status, to_status, started_at, ended_at, last_error
				)
				VALUES (
					${crypto.randomUUID()}, ${probe.key}, ${previous.status},
					${plan.status}, ${checkedAt}, ${null}, ${lastError}
				)
			`;
		}

		return plan;
	});
}
