import { convert as htmlToText } from "html-to-text";
import nodemailer, { type Transporter } from "nodemailer";
import { PgBoss, type JobWithMetadata } from "pg-boss";
import postgres, { type Sql } from "postgres";

import { resolveNotificationsDbUrl, resolvePgUrl } from "./db.js";
import { buildMail, MAIL_BUILDERS } from "./mails/index.js";
import { QUEUE_NAME, validateJobData } from "./queue.js";

type SerializableJson =
	| null
	| string
	| number
	| boolean
	| Date
	| { [key: string]: SerializableJson }
	| SerializableJson[];

/**
 * Notifications worker — long-running pg-boss consumer.
 *
 * Connects to NOTIFICATIONS_DATABASE_URL (pg-boss schema, isolated from the
 * main app DB by design) and processes `email-notification` jobs published
 * by the app's `enqueueNotification` helper. Lives in its own workspace
 * (`packages/notifications/`) so the Next.js bundle never imports a single
 * line of worker code.
 *
 * Job lifecycle:
 * - `validateJobData` runs first. Schema errors are *poison pills* — they can
 *   never succeed, so the handler logs the failure and returns clean (marking
 *   the job complete) rather than throwing. Throwing would trigger up to 5
 *   retries for nothing.
 * - SMTP / transient errors throw, so pg-boss retries them according to the
 *   per-job retry policy (`retryLimit`, `retryBackoff`) set at publish time.
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
export { QUEUE_NAME, validateJobData };
export type { EmailJobData } from "./queue.js";

const SEND_AUDIT_ACTION = "notification.send";
const SEND_AUDIT_CATEGORY = "system";

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
): (job: JobWithMetadata<unknown>) => Promise<void> {
	const { transporter, mailFrom, mailEnabled, mainSql } = deps;
	return async (job) => {
		const attempt = (job.retryCount ?? 0) + 1;
		const result = validateJobData(job.data);

		if (!result.ok) {
			// Poison pill: malformed payload can never succeed. Log + return clean
			// so pg-boss marks the job complete and stops retrying.
			console.error(
				`[notifications] dropping malformed job ${job.id}: ${result.reason}`,
			);
			void logAuditMain(mainSql, {
				action: SEND_AUDIT_ACTION,
				category: SEND_AUDIT_CATEGORY,
				status: "failure",
				resourceType: "notification",
				resourceId: job.id,
				errorMessage: result.reason,
				metadata: { attempt, poisonPill: true },
			});
			return;
		}

		const {
			type,
			payload,
			recipientEmail,
			recipientUserId,
			siren,
			attachments,
		} = result.data;

		try {
			const { subject, html } = buildMail(type, payload);
			let messageId: string | null = null;
			if (!mailEnabled || !transporter) {
				console.log(
					`[notifications] MAIL_ENABLED=false — would send ${type} to ${recipientEmail}`,
				);
			} else {
				const decodedAttachments = attachments?.map((att) => ({
					filename: att.filename,
					content: Buffer.from(att.contentBase64, "base64"),
					contentType: att.contentType,
				}));
				const info = await transporter.sendMail({
					from: mailFrom,
					to: recipientEmail,
					subject,
					text: htmlToText(html, { wordwrap: 80 }),
					html,
					...(decodedAttachments ? { attachments: decodedAttachments } : {}),
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

	const mainSql: Sql | null = mainUrl ? postgres(mainUrl, { max: 1 }) : null;

	// pg-boss uses node-postgres internally. When the URL declares any TLS
	// mode (typical inside k8s where pg uses a self-signed cert), pg
	// otherwise enforces full chain verification and rejects the cluster
	// cert. Mirror the postgres-js permissive default by disabling chain
	// verification — the connection stays encrypted, only the issuer
	// check is relaxed.
	const useSsl = /sslmode=(require|prefer|verify-ca|verify-full)/.test(notifUrl);

	const boss = new PgBoss({
		connectionString: notifUrl,
		application_name: "egapro-notifications",
		...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
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
