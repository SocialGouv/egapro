import type { Transporter } from "nodemailer";
import type { JobWithMetadata } from "pg-boss";
import type { Sql } from "postgres";

import { buildMail } from "../mails/index.js";
import { validateJobData } from "../queue.js";
import { logAuditMain } from "./auditLog.js";

const SEND_AUDIT_ACTION = "notification.send";
const SEND_AUDIT_CATEGORY = "system";

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
			// Poison pill: malformed payload can never succeed. Log + return
			// clean so pg-boss marks the job complete and stops retrying.
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
			const { subject, html, text } = await buildMail(type, payload);
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
					text,
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
