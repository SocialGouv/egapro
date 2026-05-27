import {
	buildCompliancePathChoiceReminderMail,
	buildCseOpinionReceiptMail,
	buildCseOpinionReminderMail,
	buildCycleOpeningInfoMail,
	buildDeclarationConfirmationMail,
	buildDeclarationDeadlineReminderMail,
	buildJointEvaluationReminderMail,
	buildJointEvaluationSubmittedMail,
	buildNextCycleHandoverMail,
	buildSecondDeclarationConfirmationMail,
	buildSecondDeclarationReminderMail,
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
	cycle_opening_info: buildCycleOpeningInfoMail,
	declaration_deadline_reminder: buildDeclarationDeadlineReminderMail,
	compliance_path_choice_reminder: buildCompliancePathChoiceReminderMail,
	second_declaration_reminder: buildSecondDeclarationReminderMail,
	joint_evaluation_reminder: buildJointEvaluationReminderMail,
	cse_opinion_reminder: buildCseOpinionReminderMail,
	next_cycle_handover: buildNextCycleHandoverMail,
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
