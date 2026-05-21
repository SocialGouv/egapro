import { isNotificationType } from "./mails/index.js";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "./mails/types.js";

export type { NotificationPayloadMap, NotificationType };

export const QUEUE_NAME = "email-notification";

export type SerializedAttachment = {
	filename: string;
	contentBase64: string;
	contentType: string;
};

export type EmailJobData = {
	type: NotificationType;
	payload: NotificationPayloadMap[NotificationType];
	recipientEmail: string;
	recipientUserId: string | null;
	siren: string | null;
	attachments?: SerializedAttachment[];
};

export type JobValidationFailure = { ok: false; reason: string };
export type JobValidationSuccess = { ok: true; data: EmailJobData };
export type JobValidationResult = JobValidationSuccess | JobValidationFailure;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isCompanyScopedPayload(value: unknown): boolean {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return typeof v.siren === "string" && typeof v.year === "number";
}

function isSerializedAttachment(value: unknown): value is SerializedAttachment {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.filename === "string" &&
		v.filename.length > 0 &&
		typeof v.contentBase64 === "string" &&
		v.contentBase64.length > 0 &&
		typeof v.contentType === "string" &&
		v.contentType.length > 0
	);
}

export function validateJobData(raw: unknown): JobValidationResult {
	if (typeof raw !== "object" || raw === null) {
		return { ok: false, reason: "payload must be an object" };
	}
	const d = raw as Record<string, unknown>;

	if (typeof d.type !== "string" || !isNotificationType(d.type)) {
		return {
			ok: false,
			reason: `unknown notification type: ${String(d.type)}`,
		};
	}
	if (
		typeof d.recipientEmail !== "string" ||
		!EMAIL_RE.test(d.recipientEmail)
	) {
		return { ok: false, reason: "recipientEmail is missing or invalid" };
	}
	if (d.recipientUserId !== null && typeof d.recipientUserId !== "string") {
		return { ok: false, reason: "recipientUserId must be a string or null" };
	}
	if (d.siren !== null && typeof d.siren !== "string") {
		return { ok: false, reason: "siren must be a string or null" };
	}
	if (!isCompanyScopedPayload(d.payload)) {
		return { ok: false, reason: "payload is missing required fields" };
	}
	if (d.attachments !== undefined) {
		if (!Array.isArray(d.attachments)) {
			return { ok: false, reason: "attachments must be an array" };
		}
		for (const att of d.attachments) {
			if (!isSerializedAttachment(att)) {
				return {
					ok: false,
					reason:
						"each attachment must have filename, contentBase64, contentType",
				};
			}
		}
	}
	return { ok: true, data: d as unknown as EmailJobData };
}
