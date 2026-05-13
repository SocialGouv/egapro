import { notificationPreferencesSchema } from "~/modules/notifications/schemas";
import {
	getUserNotificationPreferences,
	updateUserNotificationPreferences,
} from "~/modules/notifications/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationPreferencesRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		return getUserNotificationPreferences(ctx.session.user.id);
	}),

	update: protectedProcedure
		.input(notificationPreferencesSchema)
		.mutation(async ({ ctx, input }) => {
			await updateUserNotificationPreferences(ctx.session.user.id, input);
			return { success: true };
		}),
});
