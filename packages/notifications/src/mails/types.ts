export const NOTIFICATION_TYPES = [
	"declaration_submitted",
	"second_declaration_submitted",
	"cse_opinion_submitted",
	"joint_evaluation_submitted",
	"campaign_opening",
	"second_declaration_reminder",
	"annual_deadline_reminder",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type DateScopedPayload = {
	year: number;
	deadlineIso: string;
};

export type CompanyAndDeadlinePayload = CompanyScopedPayload & {
	deadlineIso: string;
};

export type NotificationPayloadMap = {
	declaration_submitted: CompanyScopedPayload;
	second_declaration_submitted: CompanyScopedPayload;
	cse_opinion_submitted: CompanyScopedPayload;
	joint_evaluation_submitted: CompanyScopedPayload;
	campaign_opening: DateScopedPayload;
	second_declaration_reminder: CompanyAndDeadlinePayload;
	annual_deadline_reminder: CompanyAndDeadlinePayload;
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
