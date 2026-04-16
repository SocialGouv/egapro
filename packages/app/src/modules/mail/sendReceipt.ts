import "server-only";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "~/server/audit/log";
import {
	buildDeclarationAttachments,
	buildSecondDeclarationAttachments,
} from "./buildReceiptAttachments";
import { sendMail } from "./sendMail";
import { buildCseOpinionReceipt } from "./templates/cseOpinionReceipt";
import { buildDeclarationReceipt } from "./templates/declarationReceipt";
import { buildSecondDeclarationReceipt } from "./templates/secondDeclarationReceipt";

export type ReceiptKind = "declaration" | "secondDeclaration" | "cseOpinion";

export type SendReceiptInput = {
	kind: ReceiptKind;
	to: string;
	siren: string;
	year: number;
	userId: string | null;
	isResend: boolean;
};

export async function sendReceipt(input: SendReceiptInput): Promise<void> {
	const { kind, to, siren, year, userId, isResend } = input;
	const action = isResend
		? AUDIT_ACTIONS.MAIL_RECEIPT_RESEND
		: AUDIT_ACTIONS.MAIL_RECEIPT_SEND;

	try {
		const template = buildTemplate(kind, siren, year);
		const attachments = await buildAttachments(kind, siren, year);
		const result = await sendMail({
			to,
			subject: template.subject,
			html: template.html,
			attachments,
		});

		void logAction({
			action,
			status: result.status === "error" ? "failure" : "success",
			userId,
			userEmail: to,
			siren,
			metadata: {
				kind,
				year,
				mailStatus: result.status,
				...(result.status === "error" ? { error: result.error } : {}),
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		void logAction({
			action,
			status: "failure",
			userId,
			userEmail: to,
			siren,
			metadata: { kind, year, error: message },
		});
	}
}

function buildTemplate(kind: ReceiptKind, siren: string, year: number) {
	const ctx = { siren, year };
	if (kind === "declaration") return buildDeclarationReceipt(ctx);
	if (kind === "secondDeclaration") return buildSecondDeclarationReceipt(ctx);
	return buildCseOpinionReceipt(ctx);
}

async function buildAttachments(
	kind: ReceiptKind,
	siren: string,
	year: number,
) {
	if (kind === "declaration") return buildDeclarationAttachments(siren, year);
	if (kind === "secondDeclaration") {
		return buildSecondDeclarationAttachments(siren, year);
	}
	return [];
}
