import type { Sql } from "postgres";

import { startTimer } from "../timing.js";
import type { Probe, ProbeResult } from "../types.js";
import { jobMessageFromError, jobStatusFromError } from "./failure.js";
import {
	cronPeriodMs,
	evaluateFreshness,
	nextExpectedAt,
	stalenessWindowMs,
} from "./freshness.js";

const SCHEDULE_PROBE_TIMEOUT_MS = 5000;

/**
 * The eight pg-boss schedules the notifications worker registers at boot
 * (`packages/notifications/src/schedules/definitions.ts`).
 *
 * Only the queue names are repeated here — the stable contract the screen
 * displays. The cron itself is read from `pgboss.schedule`, so a schedule
 * change in the worker is picked up without a second copy to keep in sync.
 */
export type ReminderSchedule = {
	key: string;
	label: string;
	queue: string;
};

export const REMINDER_SCHEDULES: readonly ReminderSchedule[] = [
	{
		key: "job-reminder-deadline-daily-tick",
		label: "Relances des échéances déclaratives",
		queue: "reminder-deadline-daily-tick",
	},
	{
		key: "job-reminder-cycle-opening-info",
		label: "Relance d'ouverture de cycle",
		queue: "reminder-cycle-opening-info",
	},
	{
		key: "job-reminder-cse-opinion-compliance",
		label: "Relances avis CSE — conformité",
		queue: "reminder-cse-opinion-compliance",
	},
	{
		key: "job-reminder-cse-opinion-justify-oct",
		label: "Relances avis CSE — justification (octobre)",
		queue: "reminder-cse-opinion-justify-oct",
	},
	{
		key: "job-reminder-cse-opinion-justify-dec",
		label: "Relances avis CSE — justification (décembre)",
		queue: "reminder-cse-opinion-justify-dec",
	},
	{
		key: "job-reminder-cse-opinion-corrective",
		label: "Relances avis CSE — actions correctives",
		queue: "reminder-cse-opinion-corrective",
	},
	{
		key: "job-reminder-cse-opinion-joint-eval",
		label: "Relances avis CSE — évaluation conjointe",
		queue: "reminder-cse-opinion-joint-eval",
	},
	{
		key: "job-reminder-next-cycle-handover",
		label: "Relance de passation de cycle",
		queue: "reminder-next-cycle-handover",
	},
];

export type ReminderJobProbeOptions = {
	sql: Sql | null;
	schedule: ReminderSchedule;
	staleHours: number;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
	now?: () => Date;
};

type ScheduleRow = {
	cron: string;
	timeZone: string | null;
};

type CompletedRow = {
	lastCompletedAt: Date | null;
	lastSuccessAt: Date | null;
	lastFailureAt: Date | null;
};

export function createReminderJobProbe({
	sql,
	schedule,
	staleHours,
	secrets,
	intervalSeconds = 60,
	timeoutMs = SCHEDULE_PROBE_TIMEOUT_MS,
	now = () => new Date(),
}: ReminderJobProbeOptions): Probe {
	return {
		key: schedule.key,
		label: schedule.label,
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
			const checkedAt = now();

			try {
				const schedules = await sql<ScheduleRow[]>`
					SELECT cron, timezone AS "timeZone"
					FROM pgboss.schedule
					WHERE name = ${schedule.queue}
					ORDER BY key
					LIMIT 1
				`;
				const definition = schedules[0];
				if (!definition) {
					return {
						status: "unavailable",
						latencyMs: elapsed(),
						message: "en retard — planification absente de pg-boss",
					};
				}

				const timeZone = definition.timeZone ?? "UTC";
				const windowMs = stalenessWindowMs(
					staleHours,
					cronPeriodMs(definition.cron, timeZone, checkedAt),
				);
				const since = new Date(checkedAt.getTime() - windowMs);

				const completions = await sql<CompletedRow[]>`
					SELECT
						max(completed_on) FILTER (
							WHERE state = 'completed' AND completed_on >= ${since}
						) AS "lastCompletedAt",
						max(completed_on) FILTER (WHERE state = 'completed')
							AS "lastSuccessAt",
						max(completed_on) FILTER (WHERE state = 'failed')
							AS "lastFailureAt"
					FROM pgboss.job
					WHERE name = ${schedule.queue}
				`;

				const row = completions[0];
				const verdict = evaluateFreshness({
					now: checkedAt,
					windowMs,
					lastSuccessAt: row?.lastCompletedAt ?? null,
				});

				return {
					status: verdict.status,
					latencyMs: elapsed(),
					...(verdict.message === undefined
						? {}
						: { message: verdict.message }),
					nextExpectedAt: nextExpectedAt(definition.cron, timeZone, checkedAt),
					lastSuccessAt: row?.lastSuccessAt ?? undefined,
					lastFailureAt: row?.lastFailureAt ?? undefined,
				};
			} catch (error) {
				return {
					status: jobStatusFromError(error),
					latencyMs: elapsed(),
					message: jobMessageFromError(
						error,
						secrets,
						"lecture de la planification impossible",
					),
				};
			}
		},
	};
}
