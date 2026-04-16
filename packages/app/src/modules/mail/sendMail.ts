import "server-only";
import { convert as htmlToText } from "html-to-text";
import { env } from "~/env.js";
import { getTransporter } from "./transporter";
import type { MailAttachment } from "./types";

export type SendMailInput = {
	to: string;
	subject: string;
	html: string;
	attachments?: MailAttachment[];
};

export type SendMailResult =
	| { status: "sent"; messageId: string }
	| { status: "disabled" }
	| { status: "error"; error: string };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
	if (!env.MAIL_ENABLED) {
		return { status: "disabled" };
	}

	try {
		const info = await getTransporter().sendMail({
			from: env.MAIL_FROM,
			to: input.to,
			subject: input.subject,
			text: htmlToText(input.html, { wordwrap: 80 }),
			html: input.html,
			attachments: input.attachments?.map((a) => ({
				filename: a.filename,
				content: a.content,
				contentType: a.contentType,
			})),
		});
		return { status: "sent", messageId: info.messageId };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return { status: "error", error: message };
	}
}
