import { type JobWithMetadata, PgBoss } from "pg-boss";
import postgres, { type Sql } from "postgres";

import { resolveNotificationsDbUrl, resolvePgUrl } from "./db.js";
import { buildMail, MAIL_BUILDERS } from "./mails/index.js";
import { QUEUE_NAME, validateJobData } from "./queue.js";
import { registerSchedules, SCHEDULES } from "./schedules/index.js";
import { logAuditMain } from "./worker/auditLog.js";
import { makeJobHandler } from "./worker/jobHandler.js";
import { installShutdownHooks } from "./worker/lifecycle.js";
import { buildTransporter, getMailEnabled } from "./worker/transporter.js";

/**
 * Notifications worker — long-running pg-boss consumer.
 *
 * Two job sources:
 * 1. **Event-driven** — the app's `enqueueNotification` helper pushes
 *    `email-notification` jobs on the `QUEUE_NAME` queue, processed by
 *    `makeJobHandler` (validates payload, renders the React Email
 *    template, sends via SMTP, audits success/failure).
 * 2. **Schedule-driven** — pg-boss native `boss.schedule()` ticks N
 *    reminder queues at their cron schedule. Each tick runs the matching
 *    handler which queries the app DB for eligible recipients and
 *    re-enqueues a normal `email-notification` job per recipient.
 *
 * Lives in its own workspace (`packages/notifications/`) so the Next.js
 * bundle never imports a single line of worker code.
 *
 * Job lifecycle (event queue):
 * - `validateJobData` runs first. Schema errors are *poison pills* — they
 *   can never succeed, so the handler logs the failure and returns clean
 *   (marking the job complete) rather than throwing.
 * - SMTP / transient errors throw, so pg-boss retries them according to
 *   the per-job retry policy.
 *
 * Audit rows go to the main DB (`DATABASE_URL`) when available. Failure to
 * log audit never aborts the send. When `DATABASE_URL` is absent the
 * worker still runs the event queue, but reminders are disabled (the
 * eligibility queries need the app DB).
 */

export type { EmailJobData } from "./queue.js";
export {
	buildMail,
	logAuditMain,
	MAIL_BUILDERS,
	makeJobHandler,
	QUEUE_NAME,
	SCHEDULES,
	validateJobData,
};

async function main(): Promise<void> {
	const notifUrl = resolveNotificationsDbUrl();
	if (!notifUrl) {
		throw new Error(
			"No connection string: set NOTIFICATIONS_DATABASE_URL / NOTIFICATIONS_POSTGRES_* (dedicated queue DB) or DATABASE_URL / POSTGRES_* (fallback to main DB)",
		);
	}
	const mainUrl = resolvePgUrl(process.env.DATABASE_URL, "");
	const mailEnabled = getMailEnabled();
	const transporter = mailEnabled ? buildTransporter() : null;
	const mailFrom = process.env.MAIL_FROM ?? "no-reply@egapro.local";

	const mainSql: Sql | null = mainUrl ? postgres(mainUrl, { max: 2 }) : null;

	const boss = new PgBoss({
		connectionString: notifUrl,
		application_name: "egapro-notifications",
	});
	boss.on("error", (error) => {
		console.error("[notifications] pg-boss error:", error);
	});

	await boss.start();
	await boss.createQueue(QUEUE_NAME);
	console.log(
		`[notifications] pg-boss started (queue=${QUEUE_NAME}, mailEnabled=${mailEnabled})`,
	);

	const handler = makeJobHandler({
		transporter,
		mailFrom,
		mailEnabled,
		mainSql,
	});
	await boss.work<unknown>(
		QUEUE_NAME,
		{ batchSize: 1, includeMetadata: true },
		async (jobs: JobWithMetadata<unknown>[]) => {
			const job = jobs?.[0];
			if (!job) return;
			try {
				await handler(job);
			} catch (error) {
				const reason = error instanceof Error ? error.message : String(error);
				console.error(
					`[notifications] job ${job.id} failed (attempt ${(job.retryCount ?? 0) + 1}): ${reason}`,
				);
				throw error;
			}
		},
	);

	await registerSchedules(boss, mainSql);

	installShutdownHooks({ boss, mainSql });
}

const isCli = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	return (
		import.meta.url === `file://${entry}` ||
		entry.endsWith("packages/notifications/src/index.ts") ||
		entry.endsWith("packages/notifications/dist/index.js")
	);
})();

if (isCli) {
	main().catch((error: unknown) => {
		console.error("[notifications] fatal:", error);
		process.exit(1);
	});
}
