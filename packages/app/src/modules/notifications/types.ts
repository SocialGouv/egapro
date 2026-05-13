export const NOTIFICATION_TYPES = [
	"cse_opinion_submitted",
	"joint_evaluation_submitted",
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

export type CompanyScopedPayload = {
	siren: string;
	year: number;
};

export type NotificationPayloadMap = {
	cse_opinion_submitted: CompanyScopedPayload;
	joint_evaluation_submitted: CompanyScopedPayload;
};
