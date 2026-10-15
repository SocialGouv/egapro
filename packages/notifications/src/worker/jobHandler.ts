import type { Transporter } from "nodemailer";
import type { JobWithMetadata } from "pg-boss";
import type { Sql } from "postgres";

import { buildMail } from "../mails/index.js";
import { validateJobData } from "../queue.js";
import { logAuditMain } from "./auditLog.js";

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
			const raw =
				typeof job.data === "object" &&
				job.data !== null &&
				!Array.isArray(job.data)
					? (job.data as Record<string, unknown>)
					: null;
			// Poison pill: malformed payload can never succeed. Log + return
			// clean so pg-boss marks the job complete and stops retrying.
			console.error(
				`[notifications] dropping malformed job ${job.id}: invalid_job`,
			);
			void logAuditMain(mainSql, {
				status: "failure",
				userId:
					typeof raw?.recipientUserId === "string" ? raw.recipientUserId : null,
				siren: typeof raw?.siren === "string" ? raw.siren : null,
				resourceId: job.id,
				errorCode: "invalid_job",
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

		let phase: "render" | "transport" = "render";
		try {
			const { subject, html, text } = await buildMail(type, payload);
			phase = "transport";
			if (!mailEnabled || !transporter) {
				console.log(`[notifications] MAIL_ENABLED=false — would send ${type}`);
			} else {
				const decodedAttachments = attachments?.map((att) => ({
					filename: att.filename,
					content: Buffer.from(att.contentBase64, "base64"),
					contentType: att.contentType,
				}));
				await transporter.sendMail({
					from: mailFrom,
					to: recipientEmail,
					subject,
					text,
					html,
					...(decodedAttachments ? { attachments: decodedAttachments } : {}),
				});
			}
			void logAuditMain(mainSql, {
				status: "success",
				userId: recipientUserId,
				siren,
				resourceId: job.id,
				metadata: { type, attempt },
			});
		} catch (error) {
			void logAuditMain(mainSql, {
				status: "failure",
				userId: recipientUserId,
				siren,
				resourceId: job.id,
				errorCode:
					phase === "render" ? "mail_render_failed" : "mail_transport_failed",
				metadata: { type, attempt },
			});
			throw error;
		}
	};
}
