import { isNotificationType } from "./mails/index.js";
import {
	CSE_OPINION_REMINDER_VARIANTS,
	type CseOpinionReminderVariant,
	type NotificationPayloadMap,
	type NotificationType,
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
const VARIANT_SET = new Set<string>(CSE_OPINION_REMINDER_VARIANTS);

function isString(value: unknown): value is string {
	return typeof value === "string";
}

function isPositiveInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isCompanyScoped(p: Record<string, unknown>): boolean {
	return isString(p.siren) && isPositiveInteger(p.year);
}

function isDeadlinePayload(p: Record<string, unknown>): boolean {
	return isCompanyScoped(p) && isString(p.deadline);
}

function isSerializedAttachment(value: unknown): value is SerializedAttachment {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		isString(v.filename) &&
		v.filename.length > 0 &&
		isString(v.contentBase64) &&
		v.contentBase64.length > 0 &&
		isString(v.contentType) &&
		v.contentType.length > 0
	);
}

function validatePayloadForType(
	type: NotificationType,
	payload: unknown,
): string | null {
	if (typeof payload !== "object" || payload === null) {
		return "payload must be an object";
	}
	const p = payload as Record<string, unknown>;

	switch (type) {
		case "declaration_confirmation":
		case "second_declaration_confirmation":
		case "cse_opinion_receipt":
		case "joint_evaluation_submitted": {
			return isCompanyScoped(p)
				? null
				: "payload requires { siren: string, year: number }";
		}
		case "cycle_opening_info":
		case "compliance_path_choice_reminder":
		case "joint_evaluation_reminder": {
			return isDeadlinePayload(p)
				? null
				: "payload requires { siren, year, deadline }";
		}
		case "declaration_deadline_reminder": {
			if (!isDeadlinePayload(p)) {
				return "payload requires { siren, year, deadline }";
			}
			return p.daysRemaining === 30 || p.daysRemaining === 10
				? null
				: "payload.daysRemaining must be 30 or 10";
		}
		case "second_declaration_reminder": {
			if (!isDeadlinePayload(p)) {
				return "payload requires { siren, year, deadline }";
			}
			return p.daysRemaining === 90 || p.daysRemaining === 30
				? null
				: "payload.daysRemaining must be 90 or 30";
		}
		case "cse_opinion_reminder": {
			if (!isDeadlinePayload(p)) {
				return "payload requires { siren, year, deadline }";
			}
			return isString(p.variant) && VARIANT_SET.has(p.variant)
				? null
				: `payload.variant must be one of ${CSE_OPINION_REMINDER_VARIANTS.join(", ")}`;
		}
		case "next_cycle_handover": {
			return isString(p.siren) &&
				isPositiveInteger(p.previousYear) &&
				isPositiveInteger(p.nextYear)
				? null
				: "payload requires { siren, previousYear, nextYear }";
		}
	}
}

export function validateJobData(raw: unknown): JobValidationResult {
	if (typeof raw !== "object" || raw === null) {
		return { ok: false, reason: "payload must be an object" };
	}
	const d = raw as Record<string, unknown>;

	if (!isString(d.type) || !isNotificationType(d.type)) {
		return {
			ok: false,
			reason: `unknown notification type: ${String(d.type)}`,
		};
	}
	if (!isString(d.recipientEmail) || !EMAIL_RE.test(d.recipientEmail)) {
		return { ok: false, reason: "recipientEmail is missing or invalid" };
	}
	if (d.recipientUserId !== null && !isString(d.recipientUserId)) {
		return { ok: false, reason: "recipientUserId must be a string or null" };
	}
	if (d.siren !== null && !isString(d.siren)) {
		return { ok: false, reason: "siren must be a string or null" };
	}
	const payloadError = validatePayloadForType(d.type, d.payload);
	if (payloadError) {
		return { ok: false, reason: payloadError };
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

export type { CseOpinionReminderVariant };
