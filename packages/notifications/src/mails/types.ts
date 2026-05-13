export const NOTIFICATION_TYPES = ["joint_evaluation_submitted"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type NotificationPayloadMap = {
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
