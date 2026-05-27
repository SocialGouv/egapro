import {
	buildCseOpinionReceiptMail,
	buildDeclarationConfirmationMail,
	buildJointEvaluationSubmittedMail,
	buildSecondDeclarationConfirmationMail,
} from "./builders/index.js";
import {
	type MailBuilderRegistry,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
	type RenderedMail,
} from "./types.js";

export const MAIL_BUILDERS: MailBuilderRegistry = {
	declaration_confirmation: buildDeclarationConfirmationMail,
	second_declaration_confirmation: buildSecondDeclarationConfirmationMail,
	cse_opinion_receipt: buildCseOpinionReceiptMail,
	joint_evaluation_submitted: buildJointEvaluationSubmittedMail,
};

export function isNotificationType(value: unknown): value is NotificationType {
	return (
		typeof value === "string" &&
		(NOTIFICATION_TYPES as readonly string[]).includes(value)
	);
}

export async function buildMail<T extends NotificationType>(
	type: T,
	payload: NotificationPayloadMap[T],
): Promise<RenderedMail> {
	const builder = MAIL_BUILDERS[type];
	if (!builder) {
		throw new Error(`Unknown notification type: ${String(type)}`);
	}
	return builder(payload);
}

export {
	type MailBuilderRegistry,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
	type RenderedMail,
};
