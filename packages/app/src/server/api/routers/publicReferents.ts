import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm";

import {
	publicReferentIdSchema,
	publicSearchReferentsSchema,
} from "~/modules/referents/schemas";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { referents } from "~/server/db/schema";

/**
 * Public procedures for the `/referents` search page.
 *
 * The list projection intentionally excludes contact fields (`type`, `value`,
 * `substituteEmail`) — consumers must hit `getById` to reveal them. This
 * forces a click-through so the full contact directory is not harvestable in
 * bulk from the public listing.
 */
export const publicReferentsRouter = createTRPCRouter({
	search: publicProcedure
		.input(publicSearchReferentsSchema)
		.query(async ({ ctx, input }) => {
			const filters: SQL[] = [];

			if (input.query) {
				filters.push(ilike(referents.name, `%${input.query}%`));
			}
			if (input.region) {
				filters.push(eq(referents.region, input.region));
			}
			if (input.county) {
				filters.push(eq(referents.county, input.county));
			}

			const where = filters.length > 0 ? and(...filters) : undefined;
			const offset = (input.page - 1) * input.pageSize;

			const [rows, totalResult] = await Promise.all([
				ctx.db
					.select({
						id: referents.id,
						region: referents.region,
						county: referents.county,
						name: referents.name,
						principal: referents.principal,
					})
					.from(referents)
					.where(where)
					.orderBy(
						asc(referents.region),
						asc(referents.county),
						asc(referents.name),
					)
					.limit(input.pageSize)
					.offset(offset),
				ctx.db.select({ total: count() }).from(referents).where(where),
			]);

			const total = totalResult[0]?.total ?? 0;

			return {
				rows,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
			};
		}),

	getById: publicProcedure
		.input(publicReferentIdSchema)
		.query(async ({ ctx, input }) => {
			const [row] = await ctx.db
				.select({
					id: referents.id,
					region: referents.region,
					county: referents.county,
					name: referents.name,
					type: referents.type,
					value: referents.value,
					principal: referents.principal,
					substituteName: referents.substituteName,
					substituteEmail: referents.substituteEmail,
				})
				.from(referents)
				.where(eq(referents.id, input.id))
				.limit(1);

			return row ?? null;
		}),
});
