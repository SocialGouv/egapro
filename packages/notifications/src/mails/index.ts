import { buildCseOpinionSubmittedMail } from "./cseOpinionSubmitted.js";
import { buildJointEvaluationSubmittedMail } from "./jointEvaluationSubmitted.js";
import {
	type MailBuilderRegistry,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
	type RenderedMail,
} from "./types.js";

export const MAIL_BUILDERS: MailBuilderRegistry = {
	cse_opinion_submitted: buildCseOpinionSubmittedMail,
	joint_evaluation_submitted: buildJointEvaluationSubmittedMail,
};

export function isNotificationType(value: unknown): value is NotificationType {
	return (
		typeof value === "string" &&
		(NOTIFICATION_TYPES as readonly string[]).includes(value)
	);
}

export function buildMail<T extends NotificationType>(
	type: T,
	payload: NotificationPayloadMap[T],
): RenderedMail {
	const builder = MAIL_BUILDERS[type];
	if (!builder) {
		throw new Error(`Unknown notification type: ${String(type)}`);
	}
	return builder(payload);
}

export {
	NOTIFICATION_TYPES,
	type MailBuilderRegistry,
	type NotificationPayloadMap,
	type NotificationType,
	type RenderedMail,
};
