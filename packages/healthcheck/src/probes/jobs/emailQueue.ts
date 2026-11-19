import type { Sql } from "postgres";

import { startTimer } from "../timing.js";
import type { Probe, ProbeResult } from "../types.js";
import { jobMessageFromError, jobStatusFromError } from "./failure.js";
import { formatDuration } from "./freshness.js";

const QUEUE_PROBE_TIMEOUT_MS = 5000;
const QUEUE_NAME = "email-notification";
const HOUR_MS = 3_600_000;

export type EmailQueueJobProbeOptions = {
	sql: Sql | null;
	/** Existing queue-age threshold, shared with the depth probe (15 min). */
	maxAgeSeconds: number;
	staleHours: number;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
	now?: () => Date;
};

type QueueRow = {
	failedInWindow: number;
	oldestPendingSeconds: number | null;
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

/**
 * Freshness of the `email-notification` queue.
 *
 * Unlike a cron, this queue is continuous: it has no `next_expected_at`. What
 * can go wrong is silent — a failed send leaves a row nobody reads, and a job
 * that stays pending for a day means nothing is draining the queue. Both are
 * surfaced here; depth alone stays the internal probe's job.
 */
export function createEmailQueueJobProbe({
	sql,
	maxAgeSeconds,
	staleHours,
	secrets,
	intervalSeconds = 60,
	timeoutMs = QUEUE_PROBE_TIMEOUT_MS,
	now = () => new Date(),
}: EmailQueueJobProbeOptions): Probe {
	return {
		key: "job-email-notification-queue",
		label: "File des e-mails (traitements)",
		criticality: "important",
		kind: "job",
		intervalSeconds,
		timeoutMs,
		async probe(): Promise<ProbeResult> {
			if (!sql) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			const staleWindowMs = staleHours * HOUR_MS;
			const since = new Date(now().getTime() - staleWindowMs);

			try {
				const rows = await sql<QueueRow[]>`
					SELECT
						count(*) FILTER (
							WHERE state = 'failed' AND completed_on >= ${since}
						)::int AS "failedInWindow",
						max(extract(epoch FROM (now() - created_on))) FILTER (
							WHERE state IN ('created', 'retry')
						)::int AS "oldestPendingSeconds",
						max(completed_on) FILTER (WHERE state = 'completed')
							AS "lastSuccessAt",
						max(completed_on) FILTER (WHERE state = 'failed')
							AS "lastFailureAt"
					FROM pgboss.job
					WHERE name = ${QUEUE_NAME}
				`;
				const row = rows[0] ?? {
					failedInWindow: 0,
					oldestPendingSeconds: null,
					lastSuccessAt: null,
					lastFailureAt: null,
				};
				const trace = {
					lastSuccessAt: row.lastSuccessAt ?? undefined,
					lastFailureAt: row.lastFailureAt ?? undefined,
				};

				if (
					row.oldestPendingSeconds !== null &&
					row.oldestPendingSeconds * 1000 > staleWindowMs
				) {
					return {
						status: "unavailable",
						latencyMs: elapsed(),
						message: `en retard — le plus ancien job attend depuis ${formatDuration(row.oldestPendingSeconds * 1000)}`,
						...trace,
					};
				}

				const degradations: string[] = [];
				if (row.failedInWindow > 0) {
					degradations.push(
						`${row.failedInWindow} job(s) en échec sur la fenêtre`,
					);
				}
				if (
					row.oldestPendingSeconds !== null &&
					row.oldestPendingSeconds > maxAgeSeconds
				) {
					degradations.push(
						`le plus ancien depuis ${Math.ceil(row.oldestPendingSeconds / 60)} min (seuil ${Math.round(maxAgeSeconds / 60)} min)`,
					);
				}

				if (degradations.length > 0) {
					return {
						status: "degraded",
						latencyMs: elapsed(),
						message: degradations.join(", "),
						...trace,
					};
				}

				return { status: "operational", latencyMs: elapsed(), ...trace };
			} catch (error) {
				return {
					status: jobStatusFromError(error),
					latencyMs: elapsed(),
					message: jobMessageFromError(
						error,
						secrets,
						"lecture de la file impossible",
					),
				};
			}
		},
	};
}
