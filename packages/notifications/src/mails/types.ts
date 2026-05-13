export const NOTIFICATION_TYPES = [
	"cse_opinion_submitted",
	"joint_evaluation_submitted",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type NotificationPayloadMap = {
	cse_opinion_submitted: CompanyScopedPayload;
	joint_evaluation_submitted: CompanyScopedPayload;
};

export type RenderedMail = {
	subject: string;
	html: string;
};

export type MailBuilder<T extends NotificationType> = (
	payload: NotificationPayloadMap[T],
) => RenderedMail;

export type MailBuilderRegistry = {
	[T in NotificationType]: MailBuilder<T>;
};
