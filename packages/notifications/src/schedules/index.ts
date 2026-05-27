import type { PgBoss } from "pg-boss";
import type { Sql } from "postgres";
import { SCHEDULES, type ScheduleDefinition } from "./definitions.js";

export type { DispatchResult } from "./dispatch.js";
export type { ScheduleDefinition };
export { SCHEDULES };

// pg-boss `schedule()` enqueues a job on the queue named `<schedule.name>`
// on every cron tick (with a built-in lock so multiple worker replicas
// don't double-fire). We attach a worker on the same queue that runs the
// matching handler. Idempotence inside a tick is guarded by
// `notifications.reminder_sent_log` — even if the cron fires twice the
// recipient gets a single mail.
export async function registerSchedules(
	boss: PgBoss,
	appSql: Sql | null,
): Promise<void> {
	if (!appSql) {
		console.warn(
			"[schedules] DATABASE_URL not configured — reminders disabled",
		);
		return;
	}

	for (const schedule of SCHEDULES) {
		await boss.createQueue(schedule.name);
		await boss.work<unknown>(schedule.name, { batchSize: 1 }, async () => {
			const startedAt = Date.now();
			try {
				const result = await schedule.run(appSql);
				console.log(
					`[schedules] ${schedule.name} → enqueued=${result.enqueued}, skipped=${result.skippedAlreadySent}, scheduled=${result.scheduled}, errors=${result.enqueueErrors} (${Date.now() - startedAt}ms)`,
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`[schedules] ${schedule.name} failed: ${message}`);
				throw error;
			}
		});
		await boss.schedule(
			schedule.name,
			schedule.cron,
			{},
			{ tz: schedule.timeZone },
		);
	}

	console.log(`[schedules] registered ${SCHEDULES.length} reminder schedules`);
}
