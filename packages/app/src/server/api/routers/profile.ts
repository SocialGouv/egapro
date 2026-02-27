import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { phoneSchema } from "~/modules/profile/phone";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const profileRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select({
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				phone: users.phone,
			})
			.from(users)
			.where(eq(users.id, ctx.session.user.id))
			.limit(1);

		const user = result[0];
		if (!user)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found",
			});

		return user;
	}),

	updatePhone: protectedProcedure
		.input(z.object({ phone: phoneSchema }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(users)
				.set({ phone: input.phone })
				.where(eq(users.id, ctx.session.user.id));

			return { success: true };
		}),
});
