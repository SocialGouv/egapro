import type { Sql } from "postgres";

import type { HealthcheckConfig } from "../../config.js";
import { DEFAULT_QUEUE_MAX_AGE_SECONDS } from "../../config.js";
import type { Probe } from "../types.js";
import { createAuditJobProbe } from "./auditTrace.js";
import { AUDIT_JOB_DEFINITIONS } from "./definitions.js";
import { createEmailQueueJobProbe } from "./emailQueue.js";
import { hasRecentExportArchive } from "./exports.js";
import {
	createReminderJobProbe,
	REMINDER_SCHEDULES,
} from "./pgbossSchedules.js";

/**
 * One synthetic probe per scheduled job, `kind: "job"`.
 *
 * The freshness rule lives here and nowhere else: the back-office prints
 * `next_expected_at` and the last status, it never re-derives a schedule.
 * `sql` reads the application database (audit traces, export archives),
 * `queueSql` the pg-boss database, which may be a different one.
 */
export function buildJobProbes(
	config: HealthcheckConfig,
	sql: Sql,
	queueSql: Sql | null,
): Probe[] {
	const auditProbes = AUDIT_JOB_DEFINITIONS.map((definition) =>
		createAuditJobProbe({
			sql,
			definition,
			staleHours: config.jobStaleHours,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
			...(definition.corroboration === "export-archive"
				? { corroborate: (since: Date) => hasRecentExportArchive(sql, since) }
				: {}),
		}),
	);

	const reminderProbes = REMINDER_SCHEDULES.map((schedule) =>
		createReminderJobProbe({
			sql: queueSql,
			schedule,
			staleHours: config.jobStaleHours,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
	);

	const queueProbe = createEmailQueueJobProbe({
		sql: queueSql,
		maxAgeSeconds: config.queue?.maxAgeSeconds ?? DEFAULT_QUEUE_MAX_AGE_SECONDS,
		staleHours: config.jobStaleHours,
		secrets: config.secrets,
		intervalSeconds: config.intervalSeconds,
	});

	return [...auditProbes, ...reminderProbes, queueProbe];
}
