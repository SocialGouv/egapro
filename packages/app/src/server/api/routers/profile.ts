import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

const phoneSchema = z
	.string()
	.regex(/^\d{2}( \d{2}){4}$/, "Format attendu : 01 22 33 44 55");

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
		if (!user) throw new Error("User not found");

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
