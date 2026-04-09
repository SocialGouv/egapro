import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lt,
	lte,
	or,
	type SQL,
} from "drizzle-orm";

import {
	deleteDeclarationsSchema,
	getDeclarationByIdSchema,
	searchDeclarationsSchema,
} from "~/modules/admin/declarations/schemas";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	cseOpinions,
	declarations,
	employeeCategories,
	files,
	jobCategories,
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

			if (input.index !== undefined && input.indexOperator) {
				const indexScore = declarations.remunerationScore;
				switch (input.indexOperator) {
					case "gt":
						filters.push(gte(indexScore, input.index));
						break;
					case "lt":
						filters.push(lte(indexScore, input.index));
						break;
					case "eq":
						filters.push(eq(indexScore, input.index));
						break;
				}
			}

			const where = filters.length > 0 ? and(...filters) : undefined;
			const orderDir = input.sortOrder === "asc" ? asc : desc;
			const orderColumn =
				sortColumnMap[input.sortBy as keyof typeof sortColumnMap];
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

	delete: adminProcedure
		.input(deleteDeclarationsSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				// Delete child rows first: files, cse opinions, employee categories, job categories
				await tx.delete(files).where(inArray(files.declarationId, input.ids));

				await tx
					.delete(cseOpinions)
					.where(inArray(cseOpinions.declarationId, input.ids));

				// Employee categories reference job categories, not declarations directly
				const jobCategoryRows = await tx
					.select({ id: jobCategories.id })
					.from(jobCategories)
					.where(inArray(jobCategories.declarationId, input.ids));

				const jobCategoryIds = jobCategoryRows.map((r) => r.id);
				if (jobCategoryIds.length > 0) {
					await tx
						.delete(employeeCategories)
						.where(inArray(employeeCategories.jobCategoryId, jobCategoryIds));
				}

				await tx
					.delete(jobCategories)
					.where(inArray(jobCategories.declarationId, input.ids));

				// Finally delete the declarations
				await tx
					.delete(declarations)
					.where(inArray(declarations.id, input.ids));
			});

			return { deleted: input.ids.length };
		}),
});
