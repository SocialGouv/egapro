import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	lt,
	or,
	type SQL,
} from "drizzle-orm";

import {
	cancelDeclarationSchema,
	getDeclarationByIdSchema,
	searchDeclarationsSchema,
} from "~/modules/admin/declarations/schemas";
import { getCurrentYear } from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	cseOpinions,
	declarations,
	files,
	users,
} from "~/server/db/schema";

const sortColumnMap = {
	siren: declarations.siren,
	companyName: companies.name,
	year: declarations.year,
	status: declarations.status,
	declarantEmail: users.email,
	createdAt: declarations.createdAt,
} as const;

export const adminDeclarationsRouter = createTRPCRouter({
	search: adminProcedure
		.input(searchDeclarationsSchema)
		.query(async ({ ctx, input }) => {
			const filters: SQL[] = [];

			if (input.query) {
				const term = `%${input.query}%`;
				const queryFilter = or(
					ilike(companies.name, term),
					ilike(declarations.siren, term),
				);
				if (queryFilter) {
					filters.push(queryFilter);
				}
			}

			if (input.email) {
				filters.push(ilike(users.email, `%${input.email}%`));
			}

			if (input.year) {
				filters.push(eq(declarations.year, input.year));
			}

			if (input.dateFrom) {
				filters.push(
					gte(declarations.createdAt, new Date(`${input.dateFrom}T00:00:00Z`)),
				);
			}

			if (input.dateTo) {
				filters.push(
					lt(declarations.createdAt, new Date(`${input.dateTo}T23:59:59Z`)),
				);
			}

			if (input.status) {
				filters.push(eq(declarations.status, input.status));
			}

			const where = filters.length > 0 ? and(...filters) : undefined;
			const orderDir = input.sortOrder === "asc" ? asc : desc;
			const orderColumn = sortColumnMap[input.sortBy];
			const offset = (input.page - 1) * input.pageSize;

			const [rows, totalResult] = await Promise.all([
				ctx.db
					.select({
						id: declarations.id,
						siren: declarations.siren,
						year: declarations.year,
						status: declarations.status,
						remunerationScore: declarations.remunerationScore,
						createdAt: declarations.createdAt,
						updatedAt: declarations.updatedAt,
						companyName: companies.name,
						declarantEmail: users.email,
						declarantFirstName: users.firstName,
						declarantLastName: users.lastName,
					})
					.from(declarations)
					.innerJoin(companies, eq(declarations.siren, companies.siren))
					.innerJoin(users, eq(declarations.declarantId, users.id))
					.where(where)
					.orderBy(orderDir(orderColumn))
					.limit(input.pageSize)
					.offset(offset),
				ctx.db
					.select({ total: count() })
					.from(declarations)
					.innerJoin(companies, eq(declarations.siren, companies.siren))
					.innerJoin(users, eq(declarations.declarantId, users.id))
					.where(where),
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

	getById: adminProcedure
		.input(getDeclarationByIdSchema)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: declarations.id,
					siren: declarations.siren,
					year: declarations.year,
					status: declarations.status,
					currentStep: declarations.currentStep,
					totalWomen: declarations.totalWomen,
					totalMen: declarations.totalMen,
					remunerationScore: declarations.remunerationScore,
					compliancePath: declarations.compliancePath,
					complianceCompletedAt: declarations.complianceCompletedAt,
					secondDeclarationStatus: declarations.secondDeclarationStatus,
					createdAt: declarations.createdAt,
					updatedAt: declarations.updatedAt,
					cancelledAt: declarations.cancelledAt,
					companyName: companies.name,
					companyAddress: companies.address,
					companyNafCode: companies.nafCode,
					companyWorkforce: companies.workforce,
					companyHasCse: companies.hasCse,
					declarantEmail: users.email,
					declarantFirstName: users.firstName,
					declarantLastName: users.lastName,
					declarantPhone: users.phone,
				})
				.from(declarations)
				.innerJoin(companies, eq(declarations.siren, companies.siren))
				.innerJoin(users, eq(declarations.declarantId, users.id))
				.where(eq(declarations.id, input.id))
				.limit(1);

			const declaration = rows[0];
			if (!declaration) {
				return null;
			}

			const [declarationFiles, opinions] = await Promise.all([
				ctx.db
					.select({
						id: files.id,
						fileName: files.fileName,
						type: files.type,
						uploadedAt: files.uploadedAt,
					})
					.from(files)
					.where(eq(files.declarationId, input.id)),
				ctx.db
					.select({
						id: cseOpinions.id,
						type: cseOpinions.type,
						opinion: cseOpinions.opinion,
						opinionDate: cseOpinions.opinionDate,
					})
					.from(cseOpinions)
					.where(eq(cseOpinions.declarationId, input.id)),
			]);

			return {
				...declaration,
				files: declarationFiles,
				cseOpinions: opinions,
			};
		}),

	cancel: adminProcedure
		.input(cancelDeclarationSchema)
		.mutation(async ({ input, ctx }) => {
			const rows = await ctx.db
				.select({
					id: declarations.id,
					year: declarations.year,
					cancelledAt: declarations.cancelledAt,
				})
				.from(declarations)
				.where(eq(declarations.id, input.id))
				.limit(1);

			const declaration = rows[0];
			if (!declaration) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			if (declaration.cancelledAt !== null) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "déclaration déjà annulée",
				});
			}

			if (declaration.year !== getCurrentYear()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "annulation impossible : campagne passée",
				});
			}

			const cancelledAt = new Date();
			await ctx.db
				.update(declarations)
				.set({ cancelledAt })
				.where(eq(declarations.id, input.id));

			return { id: input.id, cancelledAt };
		}),
});
