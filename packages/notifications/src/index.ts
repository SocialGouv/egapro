import { convert as htmlToText } from "html-to-text";
import nodemailer, { type Transporter } from "nodemailer";
import { PgBoss, type JobWithMetadata } from "pg-boss";
import postgres, { type Sql } from "postgres";

type SerializableJson =
	| null
	| string
	| number
	| boolean
	| Date
	| { [key: string]: SerializableJson }
	| SerializableJson[];

import { buildMail, isNotificationType, MAIL_BUILDERS } from "./mails/index.js";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "./mails/types.js";

/**
 * Notifications worker — long-running pg-boss consumer.
 *
 * Connects to NOTIFICATIONS_DATABASE_URL (pg-boss schema, isolated from the
 * main app DB by design) and processes `email-notification` jobs published
 * by the app's `enqueueNotification` helper. Lives in its own workspace
 * (`packages/notifications/`) so the Next.js bundle never imports a single
 * line of worker code.
 *
 * Retry policy is applied per-job at publish time (`retryLimit`,
 * `retryBackoff`). Throwing from the handler tells pg-boss to retry; a clean
 * return marks the job complete.
 *
 * Audit rows go to the main DB (`DATABASE_URL`) when available — failure to
 * log audit never aborts the send. When `DATABASE_URL` is absent the worker
 * still runs, it just stops emitting `audit.action_log` rows.
 *
 * Sub-second graceful shutdown via SIGTERM/SIGINT (call `boss.stop()` then
 * exit). pg-boss flushes in-flight jobs and ACKs them so the next pod start
 * resumes cleanly.
 */

export { MAIL_BUILDERS, buildMail };

const QUEUE_NAME = "email-notification";
const SEND_AUDIT_ACTION = "notification.send";
const SEND_AUDIT_CATEGORY = "system";

type EmailJobData = {
	type: NotificationType;
	payload: NotificationPayloadMap[NotificationType];
	recipientEmail: string;
	recipientUserId: string | null;
	siren: string | null;
};

type AuditRow = {
	action: string;
	category: string;
	status: "success" | "failure";
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
	resourceType?: string | null;
	resourceId?: string | null;
	errorMessage?: string | null;
	metadata?: SerializableJson;
};

function getNotificationsDatabaseUrl(): string {
	if (process.env.NOTIFICATIONS_DATABASE_URL) {
		return process.env.NOTIFICATIONS_DATABASE_URL;
	}
	const {
		NOTIFICATIONS_POSTGRES_USER,
		NOTIFICATIONS_POSTGRES_PASSWORD,
		NOTIFICATIONS_POSTGRES_HOST,
		NOTIFICATIONS_POSTGRES_PORT,
		NOTIFICATIONS_POSTGRES_DB,
		NOTIFICATIONS_POSTGRES_SSLMODE,
	} = process.env;
	if (NOTIFICATIONS_POSTGRES_HOST && NOTIFICATIONS_POSTGRES_DB) {
		const user = encodeURIComponent(NOTIFICATIONS_POSTGRES_USER ?? "postgres");
		const password = NOTIFICATIONS_POSTGRES_PASSWORD
			? `:${encodeURIComponent(NOTIFICATIONS_POSTGRES_PASSWORD)}`
			: "";
		const port = NOTIFICATIONS_POSTGRES_PORT ?? "5432";
		const sslmode = NOTIFICATIONS_POSTGRES_SSLMODE
			? `?sslmode=${NOTIFICATIONS_POSTGRES_SSLMODE}`
			: "";
		return `postgresql://${user}${password}@${NOTIFICATIONS_POSTGRES_HOST}:${port}/${NOTIFICATIONS_POSTGRES_DB}${sslmode}`;
	}
	throw new Error(
		"NOTIFICATIONS_DATABASE_URL or NOTIFICATIONS_POSTGRES_HOST+NOTIFICATIONS_POSTGRES_DB must be set",
	);
}

function getMainDatabaseUrl(): string | null {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;
	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}
	return null;
}

function getMailEnabled(): boolean {
	return (process.env.MAIL_ENABLED ?? "false").toLowerCase() === "true";
}

function buildTransporter(): Transporter {
	const host = process.env.SMTP_HOST;
	if (!host) {
		throw new Error("SMTP_HOST must be set when MAIL_ENABLED=true");
	}
	const port = parseInt(process.env.SMTP_PORT ?? "1025", 10);
	const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
	const auth =
		process.env.SMTP_USER && process.env.SMTP_PASS
			? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
			: undefined;
	return nodemailer.createTransport({ host, port, secure, auth });
}

async function logAuditMain(mainSql: Sql | null, row: AuditRow): Promise<void> {
	if (!mainSql) return;
	try {
		await mainSql`
			INSERT INTO audit.action_log (
				id, created_at, action, category, status,
				user_id, user_email, siren, resource_type, resource_id,
				error_message, metadata
			)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${row.action},
				${row.category},
				${row.status},
				${row.userId ?? null},
				${row.userEmail ?? null},
				${row.siren ?? null},
				${row.resourceType ?? null},
				${row.resourceId ?? null},
				${row.errorMessage ?? null},
				${mainSql.json(row.metadata ?? null)}
			)
		`;
	} catch (auditError) {
		console.error("[notifications] audit insert failed:", auditError);
	}
}

export type JobHandlerDeps = {
	transporter: Transporter | null;
	mailFrom: string;
	mailEnabled: boolean;
	mainSql: Sql | null;
};

export function makeJobHandler(
	deps: JobHandlerDeps,
): (job: JobWithMetadata<EmailJobData>) => Promise<void> {
	const { transporter, mailFrom, mailEnabled, mainSql } = deps;
	return async (job) => {
		const data = job.data;
		const { type, payload, recipientEmail, recipientUserId, siren } = data;
		const attempt = (job.retryCount ?? 0) + 1;

		if (!isNotificationType(type)) {
			const message = `Unknown notification type: ${String(type)}`;
			void logAuditMain(mainSql, {
				action: SEND_AUDIT_ACTION,
				category: SEND_AUDIT_CATEGORY,
				status: "failure",
				userId: recipientUserId,
				userEmail: recipientEmail,
				siren,
				resourceType: "notification",
				resourceId: job.id,
				errorMessage: message,
				metadata: { type, attempt },
			});
			throw new Error(message);
		}

		try {
			const { subject, html } = buildMail(type, payload);
			let messageId: string | null = null;
			if (!mailEnabled || !transporter) {
				console.log(
					`[notifications] MAIL_ENABLED=false — would send ${type} to ${recipientEmail}`,
				);
			} else {
				const info = await transporter.sendMail({
					from: mailFrom,
					to: recipientEmail,
					subject,
					text: htmlToText(html, { wordwrap: 80 }),
					html,
				});
				messageId = info.messageId ?? null;
			}
			void logAuditMain(mainSql, {
				action: SEND_AUDIT_ACTION,
				category: SEND_AUDIT_CATEGORY,
				status: "success",
				userId: recipientUserId,
				userEmail: recipientEmail,
				siren,
				resourceType: "notification",
				resourceId: job.id,
				metadata: { type, attempt, messageId },
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			void logAuditMain(mainSql, {
				action: SEND_AUDIT_ACTION,
				category: SEND_AUDIT_CATEGORY,
				status: "failure",
				userId: recipientUserId,
				userEmail: recipientEmail,
				siren,
				resourceType: "notification",
				resourceId: job.id,
				errorMessage: message,
				metadata: { type, attempt },
			});
			throw error;
		}
	};
}

async function main(): Promise<void> {
	const notifUrl = getNotificationsDatabaseUrl();
	const mainUrl = getMainDatabaseUrl();
	const mailEnabled = getMailEnabled();
	const transporter = mailEnabled ? buildTransporter() : null;
	const mailFrom = process.env.MAIL_FROM ?? "no-reply@egapro.local";

	const mainSql: Sql | null = mainUrl ? postgres(mainUrl, { max: 1 }) : null;

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
	await boss.work<EmailJobData>(
		QUEUE_NAME,
		{ batchSize: 1, includeMetadata: true },
		async (jobs: JobWithMetadata<EmailJobData>[]) => {
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

	const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
		console.log(`[notifications] received ${signal}, shutting down...`);
		try {
			await boss.stop({ graceful: true, timeout: 15_000 });
			if (mainSql) await mainSql.end();
		} catch (error) {
			console.error("[notifications] shutdown error:", error);
		}
		process.exit(0);
	};
	process.on("SIGTERM", () => {
		void shutdown("SIGTERM");
	});
	process.on("SIGINT", () => {
		void shutdown("SIGINT");
	});
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
