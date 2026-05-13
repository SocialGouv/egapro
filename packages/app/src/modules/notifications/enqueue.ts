import "server-only";

import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "~/server/audit/log";
import { notifDb } from "~/server/notifications/db";
import { notifications } from "~/server/notifications/db/schema";
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
	| { status: "error"; error: string };

export async function enqueueNotification<T extends NotificationType>(
	input: EnqueueNotificationInput<T>,
): Promise<EnqueueResult> {
	if (input.recipientUserId) {
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
	}

	const scheduledFor = input.scheduledFor ?? new Date();
	const now = new Date();

	try {
		const [row] = await notifDb
			.insert(notifications)
			.values({
				type: input.type,
				channel: "email",
				recipientEmail: input.recipientEmail,
				recipientUserId: input.recipientUserId,
				siren: input.siren ?? null,
				payload: input.payload as Record<string, unknown>,
				status: "pending",
				attemptCount: 0,
				scheduledFor,
				nextRetryAt: scheduledFor,
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: notifications.id });

		const id = row?.id ?? "";

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
				scheduledFor: scheduledFor.toISOString(),
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
