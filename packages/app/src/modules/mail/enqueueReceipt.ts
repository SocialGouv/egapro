import "server-only";
import { enqueueNotification } from "notifications/publisher";
import type { NotificationType } from "notifications/queue";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "~/server/audit/log";
import {
	buildDeclarationAttachments,
	buildSecondDeclarationAttachments,
} from "./buildReceiptAttachments";
import type { MailAttachment } from "./types";

export type ReceiptKind = "declaration" | "secondDeclaration" | "cseOpinion";

export type EnqueueReceiptInput = {
	kind: ReceiptKind;
	to: string;
	siren: string;
	year: number;
	userId: string | null;
	isResend: boolean;
};

const KIND_TO_TYPE: Record<ReceiptKind, NotificationType> = {
	declaration: "declaration_confirmation",
	secondDeclaration: "second_declaration_confirmation",
	cseOpinion: "cse_opinion_receipt",
};

async function buildAttachments(
	kind: ReceiptKind,
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	if (kind === "declaration") return buildDeclarationAttachments(siren, year);
	if (kind === "secondDeclaration") {
		return buildSecondDeclarationAttachments(siren, year);
	}
	return [];
}

export async function enqueueReceipt(
	input: EnqueueReceiptInput,
): Promise<void> {
	const { kind, to, siren, year, userId, isResend } = input;
	const type = KIND_TO_TYPE[kind];

	try {
		const attachments = await buildAttachments(kind, siren, year);
		const result = await enqueueNotification({
			type,
			recipientEmail: to,
			recipientUserId: userId,
			siren,
			payload: { siren, year },
			...(attachments.length > 0 ? { attachments } : {}),
		});

		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: result.status === "enqueued" ? "success" : "failure",
			userId,
			userEmail: to,
			siren,
			...(result.status === "enqueued"
				? { resourceType: "notification", resourceId: result.id }
				: {
						errorMessage:
							result.status === "error" ? result.error : "queue_unavailable",
					}),
			metadata: { type, kind, year, isResend },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: "failure",
			userId,
			userEmail: to,
			siren,
			errorMessage: message,
			metadata: { type, kind, year, isResend },
		});
	}
}
