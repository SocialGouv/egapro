import "server-only";

import { AUDIT_ACTIONS } from "~/modules/audit";
import { env } from "~/env";
import { logAction } from "~/server/audit/log";
import { NOTIFICATION_QUEUE_NAME, getBoss } from "./boss";
import {
	getUserNotificationPreferences,
	shouldDeliverByPreferences,
} from "./preferences";
import type { NotificationPayloadMap, NotificationType } from "./types";

export type EnqueueNotificationInput<T extends NotificationType> = {
	type: T;
	recipientEmail: string;
	recipientUserId: string | null;
	siren?: string | null;
	payload: NotificationPayloadMap[T];
	scheduledFor?: Date;
};

export type EnqueueResult =
	| { status: "enqueued"; id: string }
	| { status: "skipped_by_preferences" }
	| { status: "queue_unavailable" }
	| { status: "error"; error: string };

export async function enqueueNotification<T extends NotificationType>(
	input: EnqueueNotificationInput<T>,
): Promise<EnqueueResult> {
	if (input.recipientUserId) {
		try {
			const prefs = await getUserNotificationPreferences(input.recipientUserId);
			if (!shouldDeliverByPreferences(input.type, prefs)) {
				void logAction({
					action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
					status: "success",
					userId: input.recipientUserId,
					userEmail: input.recipientEmail,
					siren: input.siren ?? null,
					metadata: {
						type: input.type,
						outcome: "skipped_by_preferences",
					},
				});
				return { status: "skipped_by_preferences" };
			}
		} catch (error) {
			// Preferences live in the main DB — if reading them fails we still
			// try to enqueue the notification rather than silently dropping it.
			console.error(
				"[notifications] preferences read failed, proceeding with enqueue:",
				error,
			);
		}
	}

	const boss = await getBoss();
	if (!boss) {
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: "failure",
			userId: input.recipientUserId,
			userEmail: input.recipientEmail,
			siren: input.siren ?? null,
			errorMessage: "queue_unavailable",
			metadata: { type: input.type, reason: "queue_unavailable" },
		});
		return { status: "queue_unavailable" };
	}

	const jobData = {
		type: input.type,
		payload: input.payload,
		recipientEmail: input.recipientEmail,
		recipientUserId: input.recipientUserId,
		siren: input.siren ?? null,
	};

	try {
		const startAfterSeconds = input.scheduledFor
			? Math.max(
					0,
					Math.floor((input.scheduledFor.getTime() - Date.now()) / 1000),
				)
			: 0;

		const jobId = await boss.send(NOTIFICATION_QUEUE_NAME, jobData, {
			retryLimit: env.NOTIFICATIONS_RETRY_LIMIT,
			retryBackoff: true,
			retryDelay: env.NOTIFICATIONS_RETRY_DELAY_SECONDS,
			startAfter: startAfterSeconds,
		});

		const id = jobId ?? "";
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: "success",
			userId: input.recipientUserId,
			userEmail: input.recipientEmail,
			siren: input.siren ?? null,
			resourceType: "notification",
			resourceId: id,
			metadata: {
				type: input.type,
				startAfterSeconds,
			},
		});

		return { status: "enqueued", id };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[notifications] enqueue failed", {
			type: input.type,
			recipient: input.recipientEmail,
			error,
		});
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: "failure",
			userId: input.recipientUserId,
			userEmail: input.recipientEmail,
			siren: input.siren ?? null,
			errorMessage: message,
			metadata: { type: input.type },
		});
		return { status: "error", error: message };
	}
}
