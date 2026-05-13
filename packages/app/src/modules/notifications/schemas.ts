import { z } from "zod";

export const notificationPreferencesSchema = z.object({
	emailEnabled: z.boolean(),
	reminders: z.boolean(),
	confirmations: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<
	typeof notificationPreferencesSchema
>;
