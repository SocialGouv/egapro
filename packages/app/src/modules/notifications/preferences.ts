import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { userNotificationSettings } from "~/server/db/schema";
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	NOTIFICATION_CATEGORY_BY_TYPE,
	type NotificationType,
	type UserNotificationPreferences,
} from "./types";

export async function getUserNotificationPreferences(
	userId: string,
): Promise<UserNotificationPreferences> {
	const [row] = await db
		.select({
			emailEnabled: userNotificationSettings.emailEnabled,
			reminders: userNotificationSettings.reminders,
			confirmations: userNotificationSettings.confirmations,
		})
		.from(userNotificationSettings)
		.where(eq(userNotificationSettings.userId, userId))
		.limit(1);

	if (!row) return DEFAULT_NOTIFICATION_PREFERENCES;
	return {
		emailEnabled: row.emailEnabled,
		reminders: row.reminders,
		confirmations: row.confirmations,
	};
}

export async function updateUserNotificationPreferences(
	userId: string,
	prefs: UserNotificationPreferences,
): Promise<void> {
	await db
		.insert(userNotificationSettings)
		.values({
			userId,
			emailEnabled: prefs.emailEnabled,
			reminders: prefs.reminders,
			confirmations: prefs.confirmations,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: userNotificationSettings.userId,
			set: {
				emailEnabled: prefs.emailEnabled,
				reminders: prefs.reminders,
				confirmations: prefs.confirmations,
				updatedAt: new Date(),
			},
		});
}

export function shouldDeliverByPreferences(
	type: NotificationType,
	prefs: UserNotificationPreferences,
): boolean {
	if (!prefs.emailEnabled) return false;
	const category = NOTIFICATION_CATEGORY_BY_TYPE[type];
	if (category === "confirmations") return prefs.confirmations;
	if (category === "reminders") return prefs.reminders;
	return true;
}
