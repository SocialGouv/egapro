import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inArray,
	type SQL,
} from "drizzle-orm";

import {
	createReferentSchema,
	deleteReferentsSchema,
	editReferentSchema,
	importReferentsSchema,
	searchReferentsSchema,
} from "~/modules/admin/referents/schemas";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { referents } from "~/server/db/schema";

const sortColumnMap = {
	region: referents.region,
	county: referents.county,
	name: referents.name,
	value: referents.value,
	principal: referents.principal,
	createdAt: referents.createdAt,
} as const;

function cleanOptionalString(val: string | undefined): string | undefined {
	return val && val.trim() !== "" ? val.trim() : undefined;
}

export const adminReferentsRouter = createTRPCRouter({
	search: adminProcedure
		.input(searchReferentsSchema)
		.query(async ({ ctx, input }) => {
			const filters: SQL[] = [];

			if (input.query) {
				const term = `%${input.query}%`;
				filters.push(ilike(referents.name, term));
			}

			if (input.region) {
				filters.push(eq(referents.region, input.region));
			}

			if (input.county) {
				filters.push(eq(referents.county, input.county));
			}

			const where = filters.length > 0 ? and(...filters) : undefined;
			const orderDir = input.sortOrder === "asc" ? asc : desc;
			const orderColumn =
				sortColumnMap[input.sortBy as keyof typeof sortColumnMap];
			const offset = (input.page - 1) * input.pageSize;

			const [rows, totalResult] = await Promise.all([
				ctx.db
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
						createdAt: referents.createdAt,
					})
					.from(referents)
					.where(where)
					.orderBy(orderDir(orderColumn))
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

	create: adminProcedure
		.input(createReferentSchema)
		.mutation(async ({ ctx, input }) => {
			const [created] = await ctx.db
				.insert(referents)
				.values({
					region: input.region,
					county: cleanOptionalString(input.county),
					name: input.name,
					type: input.type,
					value: input.value,
					principal: input.principal,
					substituteName: cleanOptionalString(input.substituteName),
					substituteEmail: cleanOptionalString(input.substituteEmail),
				})
				.returning({ id: referents.id });

			return { id: created?.id };
		}),

	update: adminProcedure
		.input(editReferentSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(referents)
				.set({
					region: input.region,
					county: cleanOptionalString(input.county),
					name: input.name,
					type: input.type,
					value: input.value,
					principal: input.principal,
					substituteName: cleanOptionalString(input.substituteName),
					substituteEmail: cleanOptionalString(input.substituteEmail),
					updatedAt: new Date(),
				})
				.where(eq(referents.id, input.id));

			return { id: input.id };
		}),

	delete: adminProcedure
		.input(deleteReferentsSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(referents).where(inArray(referents.id, input.ids));

			return { deleted: input.ids.length };
		}),

	import: adminProcedure
		.input(importReferentsSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				await tx.delete(referents);

				for (const item of input) {
					await tx.insert(referents).values({
						region: item.region,
						county: cleanOptionalString(item.county),
						name: item.name,
						type: item.type,
						value: item.value,
						principal: item.principal,
						substituteName: cleanOptionalString(item.substituteName),
						substituteEmail: cleanOptionalString(item.substituteEmail),
					});
				}
			});

			return { imported: input.length };
		}),

	exportAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select({
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
			.orderBy(asc(referents.region), asc(referents.county));
	}),
});
