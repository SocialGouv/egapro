import "server-only";
import { env } from "~/env.js";
import { resolveRecipient } from "./redirect";
import { getTransporter } from "./transporter";
import type { MailAttachment } from "./types";

export type SendMailInput = {
	to: string;
	subject: string;
	text: string;
	html: string;
	attachments?: MailAttachment[];
};

export type SendMailResult =
	| { status: "sent"; messageId: string; to: string; originalTo?: string }
	| { status: "disabled" }
	| { status: "error"; error: string };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
	if (!env.MAIL_ENABLED) {
		return { status: "disabled" };
	}

	const { to, originalTo } = resolveRecipient(input.to);

	try {
		const info = await getTransporter().sendMail({
			from: env.MAIL_FROM,
			to,
			subject: input.subject,
			text: input.text,
			html: input.html,
			attachments: input.attachments?.map((a) => ({
				filename: a.filename,
				content: a.content,
				contentType: a.contentType,
			})),
		});
		return { status: "sent", messageId: info.messageId, to, originalTo };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return { status: "error", error: message };
	}
}
