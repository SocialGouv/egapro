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

export const NOTIFICATION_STATUSES = [
	"pending",
	"sent",
	"failed",
	"cancelled",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationCategory = "confirmations" | "reminders" | "admin";

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type DeclarationSubmittedPayload = CompanyScopedPayload & {
	companyName?: string;
};

export type SecondDeclarationSubmittedPayload = CompanyScopedPayload & {
	companyName?: string;
};

export type CseOpinionSubmittedPayload = CompanyScopedPayload;

export type JointEvaluationSubmittedPayload = CompanyScopedPayload;

export type CampaignOpeningPayload = {
	year: number;
	deadlineIso: string;
};

export type SecondDeclarationReminderPayload = CompanyScopedPayload & {
	deadlineIso: string;
};

export type AnnualDeadlineReminderPayload = CompanyScopedPayload & {
	deadlineIso: string;
};

export type NotificationPayloadMap = {
	declaration_submitted: DeclarationSubmittedPayload;
	second_declaration_submitted: SecondDeclarationSubmittedPayload;
	cse_opinion_submitted: CseOpinionSubmittedPayload;
	joint_evaluation_submitted: JointEvaluationSubmittedPayload;
	campaign_opening: CampaignOpeningPayload;
	second_declaration_reminder: SecondDeclarationReminderPayload;
	annual_deadline_reminder: AnnualDeadlineReminderPayload;
};

export const NOTIFICATION_CATEGORY_BY_TYPE: Record<
	NotificationType,
	NotificationCategory
> = {
	declaration_submitted: "confirmations",
	second_declaration_submitted: "confirmations",
	cse_opinion_submitted: "confirmations",
	joint_evaluation_submitted: "confirmations",
	campaign_opening: "reminders",
	second_declaration_reminder: "reminders",
	annual_deadline_reminder: "reminders",
};

export type UserNotificationPreferences = {
	emailEnabled: boolean;
	reminders: boolean;
	confirmations: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
	emailEnabled: true,
	reminders: true,
	confirmations: true,
};
