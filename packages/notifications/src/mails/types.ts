export const NOTIFICATION_TYPES = [
	"declaration_confirmation",
	"second_declaration_confirmation",
	"cse_opinion_receipt",
	"joint_evaluation_submitted",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type NotificationPayloadMap = {
	declaration_confirmation: CompanyScopedPayload;
	second_declaration_confirmation: CompanyScopedPayload;
	cse_opinion_receipt: CompanyScopedPayload;
	joint_evaluation_submitted: CompanyScopedPayload;
};

export type RenderedMail = {
	subject: string;
	html: string;
	text: string;
};

export type MailBuilder<T extends NotificationType> = (
	payload: NotificationPayloadMap[T],
) => Promise<RenderedMail>;

export type MailBuilderRegistry = {
	[T in NotificationType]: MailBuilder<T>;
};
