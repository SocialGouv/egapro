import type { Sql } from "postgres";

import { startTimer } from "../timing.js";
import type { Probe, ProbeResult } from "../types.js";
import type { AuditJobDefinition } from "./definitions.js";
import { jobMessageFromError, jobStatusFromError } from "./failure.js";
import {
	cronPeriodMs,
	evaluateFreshness,
	nextExpectedAt,
	stalenessWindowMs,
} from "./freshness.js";

const AUDIT_PROBE_TIMEOUT_MS = 5000;

export type AuditTrace = {
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

export type AuditJobProbeOptions = {
	sql: Sql;
	definition: AuditJobDefinition;
	staleHours: number;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
	now?: () => Date;
	/**
	 * Optional second source: the audit success is only believed when this
	 * resolves `true` for the same window. Used by the export, whose archive
	 * row is the proof the file was actually produced.
	 */
	corroborate?: (since: Date) => Promise<boolean>;
};

/**
 * Last success and last failure of one audited action, inside the window.
 *
 * `WHERE action = … AND created_at >= …` is the shape of
 * `action_log_action_idx (action, created_at)`: the probe reads an index range,
 * never the table.
 */
export async function readAuditTrace(
	sql: Sql,
	action: string,
	since: Date,
): Promise<AuditTrace> {
	const rows = await sql<AuditTrace[]>`
		SELECT
			max(created_at) FILTER (WHERE status = 'success') AS "lastSuccessAt",
			max(created_at) FILTER (WHERE status = 'failure') AS "lastFailureAt"
		FROM audit.action_log
		WHERE action = ${action} AND created_at >= ${since}
	`;

	return rows[0] ?? { lastSuccessAt: null, lastFailureAt: null };
}

export function createAuditJobProbe({
	sql,
	definition,
	staleHours,
	secrets,
	intervalSeconds = 60,
	timeoutMs = AUDIT_PROBE_TIMEOUT_MS,
	now = () => new Date(),
	corroborate,
}: AuditJobProbeOptions): Probe {
	return {
		key: definition.key,
		label: definition.label,
		criticality: definition.criticality,
		kind: "job",
		intervalSeconds,
		timeoutMs,
		async probe(): Promise<ProbeResult> {
			const elapsed = startTimer();
			const checkedAt = now();

			try {
				const windowMs = stalenessWindowMs(
					staleHours,
					cronPeriodMs(definition.cron, definition.timeZone, checkedAt),
				);
				const expectedAt = nextExpectedAt(
					definition.cron,
					definition.timeZone,
					checkedAt,
				);
				const since = new Date(checkedAt.getTime() - windowMs);
				const trace = await readAuditTrace(sql, definition.action, since);

				if (trace.lastSuccessAt && corroborate && !(await corroborate(since))) {
					return {
						status: "unavailable",
						latencyMs: elapsed(),
						message: "en retard — succès annoncé sans archive générée",
						nextExpectedAt: expectedAt,
					};
				}

				const verdict = evaluateFreshness({
					now: checkedAt,
					windowMs,
					lastSuccessAt: trace.lastSuccessAt,
					lastFailureAt: trace.lastFailureAt,
				});

				return {
					status: verdict.status,
					latencyMs: elapsed(),
					...(verdict.message === undefined
						? {}
						: { message: verdict.message }),
					nextExpectedAt: expectedAt,
				};
			} catch (error) {
				return {
					status: jobStatusFromError(error),
					latencyMs: elapsed(),
					message: jobMessageFromError(
						error,
						secrets,
						"lecture des traces impossible",
					),
				};
			}
		},
	};
}
