import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { convert as htmlToText } from "html-to-text";
import nodemailer from "nodemailer";
import postgres from "postgres";

/**
 * Notifications worker — direct DB access.
 *
 * Drains the `notification_queue` table (separate Postgres instance, env
 * `NOTIFICATIONS_DATABASE_URL`) and sends emails via nodemailer. Each tick
 * locks up to `BATCH_SIZE` rows with `FOR UPDATE SKIP LOCKED`, renders the
 * template, calls SMTP, and either marks `sent` or schedules a retry with
 * exponential backoff. Audit rows are written to the main DB (`DATABASE_URL`)
 * outside the queue transaction so a logging failure cannot roll back a
 * successful send.
 *
 * Templates are inlined here (duplicated from `~/modules/notifications/
 * templates/`) because the K8s CronJob runs as plain Node and cannot import
 * TypeScript source files. Snapshot tests in `__tests__` keep the two copies
 * in sync.
 */

/** @typedef {import("postgres").Sql} Sql */

const BATCH_SIZE = parseInt(process.env.NOTIFICATIONS_BATCH_SIZE ?? "50", 10);
const DEFAULT_MAX_ATTEMPTS = parseInt(
	process.env.NOTIFICATIONS_MAX_ATTEMPTS ?? "5",
	10,
);

const RETRY_BACKOFF_SECONDS = [60, 5 * 60, 30 * 60, 2 * 60 * 60, 12 * 60 * 60];

const WORKER_AUDIT_ACTION = "system.notifications_worker";
const WORKER_AUDIT_CATEGORY = "system";
const SEND_AUDIT_ACTION = "notification.send";
const SEND_AUDIT_CATEGORY = "system";

function getNotificationsDatabaseUrl() {
	if (process.env.NOTIFICATIONS_DATABASE_URL)
		return process.env.NOTIFICATIONS_DATABASE_URL;
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

function getMainDatabaseUrl() {
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

function getMailEnabled() {
	return (process.env.MAIL_ENABLED ?? "false").toLowerCase() === "true";
}

function buildTransporter() {
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

// ── Template helpers (duplicated from src/modules/notifications/templates) ──

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function wrapEmail(title, bodyHtml) {
	return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #161616; line-height: 1.5;">
<div style="max-width: 600px; margin: 0 auto; padding: 24px;">
<h1 style="font-size: 20px; margin-bottom: 16px;">${escapeHtml(title)}</h1>
${bodyHtml}
<hr style="margin: 32px 0; border: none; border-top: 1px solid #dddddd;">
<p style="font-size: 12px; color: #666666;">
Cet e-mail a été envoyé automatiquement par la plateforme Egapro. Merci de ne pas y répondre.
</p>
</div>
</body>
</html>`;
}

function formatSiren(siren) {
	const digits = String(siren ?? "").replace(/\D/g, "");
	return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

function formatFrenchDate(iso) {
	const d = new Date(iso);
	return d.toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

const TEMPLATES = {
	declaration_submitted(payload) {
		const subject = `Confirmation — Déclaration des indicateurs ${payload.year}`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>Votre déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> a bien été soumise.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(formatSiren(payload.siren))}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Vous pouvez retrouver le détail dans votre espace Egapro.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	second_declaration_submitted(payload) {
		const subject = `Confirmation — Seconde déclaration ${payload.year}`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>Votre seconde déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> a bien été enregistrée.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(formatSiren(payload.siren))}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Vous restez tenus aux obligations complémentaires liées à l'écart constaté (mesures de correction, suivi annuel).</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	cse_opinion_submitted(payload) {
		const subject = `Confirmation — Avis du CSE transmis (${payload.year})`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>Nous accusons réception de la transmission de l'avis du CSE pour votre déclaration <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(formatSiren(payload.siren))}</li>
<li><strong>Année concernée&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	joint_evaluation_submitted(payload) {
		const subject = `Confirmation — Évaluation conjointe transmise (${payload.year})`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>Nous accusons réception du dépôt de l'évaluation conjointe pour votre déclaration <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(formatSiren(payload.siren))}</li>
<li><strong>Année concernée&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	campaign_opening(payload) {
		const subject = `Ouverture de la campagne de déclaration ${payload.year}`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>La campagne de déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> est désormais ouverte.</p>
<p><strong>Date limite&nbsp;:</strong> ${escapeHtml(formatFrenchDate(payload.deadlineIso))}</p>
<p>Connectez-vous à votre espace Egapro pour démarrer ou poursuivre votre déclaration.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	second_declaration_reminder(payload) {
		const subject = `Rappel — Seconde déclaration à transmettre (${payload.year})`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>Votre entreprise <strong>${escapeHtml(formatSiren(payload.siren))}</strong> doit transmettre sa seconde déclaration pour la campagne <strong>${payload.year}</strong>.</p>
<p><strong>Date limite&nbsp;:</strong> ${escapeHtml(formatFrenchDate(payload.deadlineIso))}</p>
<p>Connectez-vous à votre espace Egapro pour finaliser la transmission.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
	annual_deadline_reminder(payload) {
		const subject = `Rappel — Échéance déclaration annuelle (${payload.year})`;
		const html = wrapEmail(
			subject,
			`<p>Bonjour,</p>
<p>La date limite de déclaration des indicateurs de l'égalité professionnelle approche pour la campagne <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(formatSiren(payload.siren))}</li>
<li><strong>Date limite&nbsp;:</strong> ${escapeHtml(formatFrenchDate(payload.deadlineIso))}</li>
</ul>
<p>Connectez-vous à votre espace Egapro pour finaliser votre déclaration.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
		);
		return { subject, html };
	},
};

function buildTemplate(type, payload) {
	const builder = TEMPLATES[type];
	if (!builder) throw new Error(`Unknown notification type: ${type}`);
	return builder(payload);
}

function computeNextRetry(attemptCount, now) {
	const idx = Math.max(
		0,
		Math.min(attemptCount, RETRY_BACKOFF_SECONDS.length - 1),
	);
	const delay = RETRY_BACKOFF_SECONDS[idx];
	return new Date(now.getTime() + delay * 1000);
}

async function logAuditMain(mainSql, row) {
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
		console.error(
			"[notifications-worker] audit insert failed:",
			auditError,
		);
	}
}

/**
 * Drain one batch of pending notifications. Returns counters for logging.
 *
 * @param {Object} args
 * @param {Sql} args.notifSql
 * @param {Sql | null} args.mainSql
 * @param {import("nodemailer").Transporter | null} args.transporter
 * @param {string} args.mailFrom
 * @param {boolean} args.mailEnabled
 * @param {number} args.batchSize
 * @param {Date} [args.now]
 */
export async function processBatch({
	notifSql,
	mainSql,
	transporter,
	mailFrom,
	mailEnabled,
	batchSize,
	now = new Date(),
}) {
	const counters = { processed: 0, sent: 0, failed: 0, retryScheduled: 0 };

	await notifSql.begin(async (txRaw) => {
		const tx = /** @type {Sql} */ (/** @type {unknown} */ (txRaw));
		const rows = await tx`
			SELECT id, type, recipient_email, recipient_user_id, siren, payload,
			       attempt_count, max_attempts
			FROM notification_queue
			WHERE status = 'pending'
			  AND next_retry_at <= ${now}
			ORDER BY scheduled_for ASC
			LIMIT ${batchSize}
			FOR UPDATE SKIP LOCKED
		`;

		for (const row of rows) {
			counters.processed += 1;
			const attempt = row.attempt_count + 1;
			let outcome;
			let messageId = null;
			let errorMessage = null;
			try {
				const template = buildTemplate(row.type, row.payload);
				if (!mailEnabled || !transporter) {
					outcome = "disabled";
				} else {
					const info = await transporter.sendMail({
						from: mailFrom,
						to: row.recipient_email,
						subject: template.subject,
						text: htmlToText(template.html, { wordwrap: 80 }),
						html: template.html,
					});
					messageId = info.messageId ?? null;
					outcome = "sent";
				}
			} catch (error) {
				outcome = "error";
				errorMessage = error instanceof Error ? error.message : String(error);
			}

			const sendNow = new Date();
			if (outcome === "sent" || outcome === "disabled") {
				await tx`
					UPDATE notification_queue
					SET status = 'sent',
					    attempt_count = ${attempt},
					    sent_at = ${sendNow},
					    next_retry_at = ${sendNow},
					    last_error = NULL,
					    updated_at = ${sendNow}
					WHERE id = ${row.id}
				`;
				await tx`
					INSERT INTO notification_send_log (id, notification_id, attempt, status, error_message, message_id, created_at)
					VALUES (${crypto.randomUUID()}, ${row.id}, ${attempt}, ${outcome}, NULL, ${messageId}, ${sendNow})
				`;
				counters.sent += 1;
				void logAuditMain(mainSql, {
					action: SEND_AUDIT_ACTION,
					category: SEND_AUDIT_CATEGORY,
					status: "success",
					userId: row.recipient_user_id,
					userEmail: row.recipient_email,
					siren: row.siren,
					resourceType: "notification",
					resourceId: row.id,
					metadata: { type: row.type, attempt, outcome },
				});
			} else {
				const isTerminal = attempt >= row.max_attempts;
				const nextRetry = isTerminal
					? sendNow
					: computeNextRetry(attempt, sendNow);
				await tx`
					UPDATE notification_queue
					SET status = ${isTerminal ? "failed" : "pending"},
					    attempt_count = ${attempt},
					    next_retry_at = ${nextRetry},
					    last_error = ${errorMessage},
					    updated_at = ${sendNow}
					WHERE id = ${row.id}
				`;
				await tx`
					INSERT INTO notification_send_log (id, notification_id, attempt, status, error_message, message_id, created_at)
					VALUES (${crypto.randomUUID()}, ${row.id}, ${attempt}, ${isTerminal ? "failed" : "retry"}, ${errorMessage}, NULL, ${sendNow})
				`;
				if (isTerminal) counters.failed += 1;
				else counters.retryScheduled += 1;
				void logAuditMain(mainSql, {
					action: SEND_AUDIT_ACTION,
					category: SEND_AUDIT_CATEGORY,
					status: "failure",
					userId: row.recipient_user_id,
					userEmail: row.recipient_email,
					siren: row.siren,
					resourceType: "notification",
					resourceId: row.id,
					errorMessage,
					metadata: {
						type: row.type,
						attempt,
						terminal: isTerminal,
						nextRetryAt: nextRetry.toISOString(),
					},
				});
			}
		}
	});

	return counters;
}

const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
})();

if (isMain) {
	const notifSql = postgres(getNotificationsDatabaseUrl(), { max: 1 });
	const mainUrl = getMainDatabaseUrl();
	const mainSql = mainUrl ? postgres(mainUrl, { max: 1 }) : null;
	const mailEnabled = getMailEnabled();
	const transporter = mailEnabled ? buildTransporter() : null;
	const mailFrom = process.env.MAIL_FROM ?? "no-reply@egapro.local";

	try {
		const counters = await processBatch({
			notifSql,
			mainSql,
			transporter,
			mailFrom,
			mailEnabled,
			batchSize: BATCH_SIZE,
		});
		console.log(
			`[notifications-worker] tick complete — processed=${counters.processed} sent=${counters.sent} retry=${counters.retryScheduled} failed=${counters.failed}`,
		);
		await logAuditMain(mainSql, {
			action: WORKER_AUDIT_ACTION,
			category: WORKER_AUDIT_CATEGORY,
			status: "success",
			metadata: {
				...counters,
				batchSize: BATCH_SIZE,
				maxAttempts: DEFAULT_MAX_ATTEMPTS,
			},
		});
		await notifSql.end();
		if (mainSql) await mainSql.end();
		process.exit(0);
	} catch (error) {
		console.error("[notifications-worker] tick failed:", error);
		await logAuditMain(mainSql, {
			action: WORKER_AUDIT_ACTION,
			category: WORKER_AUDIT_CATEGORY,
			status: "failure",
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		await notifSql.end();
		if (mainSql) await mainSql.end();
		process.exit(1);
	}
}
