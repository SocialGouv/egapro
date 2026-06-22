export const NOTIFICATION_TYPES = [
	// Event-driven (4 — déclenchés par mutation tRPC / upload)
	"declaration_confirmation",
	"second_declaration_confirmation",
	"cse_opinion_receipt",
	"joint_evaluation_submitted",
	// Schedule-driven (7 — déclenchés par pg-boss cron)
	"cycle_opening_info",
	"declaration_deadline_reminder",
	"compliance_path_choice_reminder",
	"second_declaration_reminder",
	"joint_evaluation_reminder",
	"cse_opinion_reminder",
	"next_cycle_handover",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type DeadlinePayload = CompanyScopedPayload & {
	deadline: string;
};

export type DeclarationDeadlineReminderPayload = DeadlinePayload & {
	daysRemaining: 30 | 10;
};

export type SecondDeclarationReminderPayload = DeadlinePayload & {
	daysRemaining: 90 | 30;
};

export const CSE_OPINION_REMINDER_VARIANTS = [
	"compliance",
	"justify_oct",
	"justify_dec",
	"corrective",
	"joint_eval",
] as const;

export type CseOpinionReminderVariant =
	(typeof CSE_OPINION_REMINDER_VARIANTS)[number];

export type CseOpinionReminderPayload = DeadlinePayload & {
	variant: CseOpinionReminderVariant;
};

export type NextCycleHandoverPayload = {
	siren: string;
	previousYear: number;
	nextYear: number;
};

export type NotificationPayloadMap = {
	declaration_confirmation: CompanyScopedPayload;
	second_declaration_confirmation: CompanyScopedPayload;
	cse_opinion_receipt: CompanyScopedPayload;
	joint_evaluation_submitted: CompanyScopedPayload;
	cycle_opening_info: DeadlinePayload;
	declaration_deadline_reminder: DeclarationDeadlineReminderPayload;
	compliance_path_choice_reminder: DeadlinePayload;
	second_declaration_reminder: SecondDeclarationReminderPayload;
	joint_evaluation_reminder: DeadlinePayload;
	cse_opinion_reminder: CseOpinionReminderPayload;
	next_cycle_handover: NextCycleHandoverPayload;
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
