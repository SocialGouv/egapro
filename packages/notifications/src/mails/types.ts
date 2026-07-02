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

export const DECLARATION_CONFIRMATION_VARIANTS = [
	"completed",
	"cse_to_deposit",
	"path_to_select",
] as const;

export type DeclarationConfirmationVariant =
	(typeof DECLARATION_CONFIRMATION_VARIANTS)[number];

export const JOINT_EVALUATION_SUBMITTED_VARIANTS = [
	"completed",
	"cse_to_deposit",
	"cse_first_and_second",
] as const;

export type JointEvaluationSubmittedVariant =
	(typeof JOINT_EVALUATION_SUBMITTED_VARIANTS)[number];

export const CSE_OPINION_RECEIPT_VARIANTS = [
	"single",
	"with_gap",
	"first_and_second",
] as const;

export type CseOpinionReceiptVariant =
	(typeof CSE_OPINION_RECEIPT_VARIANTS)[number];

export type DeclarationConfirmationPayload = CompanyScopedPayload & {
	variant: DeclarationConfirmationVariant;
	raisonSociale: string;
	complianceDeadline?: string;
};

export type SecondDeclarationConfirmationPayload = CompanyScopedPayload & {
	variant: DeclarationConfirmationVariant;
	raisonSociale: string;
	complianceDeadline?: string;
};

export type JointEvaluationSubmittedPayload = CompanyScopedPayload & {
	variant: JointEvaluationSubmittedVariant;
	raisonSociale: string;
};

export type CseOpinionReceiptPayload = CompanyScopedPayload & {
	variant: CseOpinionReceiptVariant;
	raisonSociale: string;
};

export type NextCycleHandoverPayload = {
	siren: string;
	previousYear: number;
	nextYear: number;
};

export type NotificationPayloadMap = {
	declaration_confirmation: DeclarationConfirmationPayload;
	second_declaration_confirmation: SecondDeclarationConfirmationPayload;
	cse_opinion_receipt: CseOpinionReceiptPayload;
	joint_evaluation_submitted: JointEvaluationSubmittedPayload;
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
