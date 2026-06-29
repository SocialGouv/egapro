import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lt,
	ne,
	or,
	type SQL,
} from "drizzle-orm";

import {
	cancelDeclarationSchema,
	getDeclarationByIdSchema,
	getRecapSchema,
	searchDeclarationsSchema,
} from "~/modules/admin/declarations/schemas";
import { releaseLockSchema } from "~/modules/admin/schemas";
import { getCurrentYear } from "~/modules/domain";
import {
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "~/server/api/routers/declarationHelpers";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	cseOpinions,
	declarationStatusHistory,
	declarations,
	employeeCategories,
	files,
	jobCategories,
	users,
} from "~/server/db/schema";
import {
	getActiveLock,
	releaseLockAsAdmin,
} from "~/server/services/declarationLockService";

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

			if (input.status === "cancelled") {
				filters.push(isNotNull(declarations.cancelledAt));
			} else if (input.status) {
				filters.push(eq(declarations.status, input.status));
				filters.push(isNull(declarations.cancelledAt));
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
						cancelledAt: declarations.cancelledAt,
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
					firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
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

			const [declarationFiles, opinions, siblingRows, historyRows, activeLock] =
				await Promise.all([
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
					ctx.db
						.select({
							id: declarations.id,
							status: declarations.status,
							cancelledAt: declarations.cancelledAt,
							updatedAt: declarations.updatedAt,
						})
						.from(declarations)
						.where(
							and(
								eq(declarations.siren, declaration.siren),
								eq(declarations.year, declaration.year),
								ne(declarations.id, input.id),
							),
						)
						.orderBy(desc(declarations.updatedAt)),
					ctx.db
						.select({
							eventType: declarationStatusHistory.eventType,
							createdAt: declarationStatusHistory.createdAt,
						})
						.from(declarationStatusHistory)
						.where(eq(declarationStatusHistory.declarationId, input.id))
						.orderBy(desc(declarationStatusHistory.createdAt)),
					getActiveLock(ctx.db, input.id),
				]);

			const siblings = siblingRows.map((s) => ({
				id: s.id,
				cancelledAt: s.cancelledAt,
				updatedAt: s.updatedAt,
				status: s.cancelledAt !== null ? "cancelled" : (s.status ?? "draft"),
			}));

			const findLatest = (eventType: string): Date | null => {
				const found = historyRows.find((r) => r.eventType === eventType);
				return found ? found.createdAt : null;
			};

			return {
				...declaration,
				files: declarationFiles,
				cseOpinions: opinions,
				siblings,
				lock: activeLock
					? { holder: activeLock.email, expiresAt: activeLock.expiresAt }
					: null,
				demarcheCompletedAt: findLatest("demarche_complete"),
				secondDeclarationSubmittedAt: findLatest("second_declaration_submit"),
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
			await ctx.db.transaction(async (tx) => {
				await tx
					.update(declarations)
					.set({ cancelledAt })
					.where(eq(declarations.id, input.id));
				await tx.insert(declarationStatusHistory).values({
					declarationId: input.id,
					eventType: "cancel",
					actorUserId: ctx.session.user.id,
				});
			});

			return { id: input.id, cancelledAt };
		}),

	releaseLock: adminProcedure
		.input(releaseLockSchema)
		.mutation(async ({ input, ctx }) => {
			const lock = await getActiveLock(ctx.db, input.declarationId);
			if (!lock) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "aucun verrou actif sur cette déclaration",
				});
			}

			await releaseLockAsAdmin(ctx.db, input.declarationId);

			return { declarationId: input.declarationId };
		}),

	getRecap: adminProcedure
		.input(getRecapSchema)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					declaration: declarations,
					companyName: companies.name,
					companySiren: companies.siren,
					companyNafCode: companies.nafCode,
					companyAddress: companies.address,
					companyWorkforce: companies.workforce,
					declarantEmail: users.email,
					declarantFirstName: users.firstName,
					declarantLastName: users.lastName,
				})
				.from(declarations)
				.innerJoin(companies, eq(declarations.siren, companies.siren))
				.innerJoin(users, eq(declarations.declarantId, users.id))
				.where(eq(declarations.id, input.id))
				.limit(1);

			const row = rows[0];
			if (!row) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			const [secondSubmitHistory, jobs] = await Promise.all([
				ctx.db
					.select({ id: declarationStatusHistory.id })
					.from(declarationStatusHistory)
					.where(
						and(
							eq(declarationStatusHistory.declarationId, input.id),
							eq(
								declarationStatusHistory.eventType,
								"second_declaration_submit",
							),
						),
					)
					.limit(1),
				ctx.db
					.select({
						id: jobCategories.id,
						name: jobCategories.name,
						categoryIndex: jobCategories.categoryIndex,
						source: jobCategories.source,
					})
					.from(jobCategories)
					.where(eq(jobCategories.declarationId, input.id)),
			]);

			const isCorrection = secondSubmitHistory.length > 0;

			const jobIds = jobs.map((j) => j.id);
			const empCats =
				jobIds.length > 0
					? await ctx.db
							.select({
								jobCategoryId: employeeCategories.jobCategoryId,
								declarationType: employeeCategories.declarationType,
								womenCount: employeeCategories.womenCount,
								menCount: employeeCategories.menCount,
								annualBaseWomen: employeeCategories.annualBaseWomen,
								annualBaseMen: employeeCategories.annualBaseMen,
								annualVariableWomen: employeeCategories.annualVariableWomen,
								annualVariableMen: employeeCategories.annualVariableMen,
								hourlyBaseWomen: employeeCategories.hourlyBaseWomen,
								hourlyBaseMen: employeeCategories.hourlyBaseMen,
								hourlyVariableWomen: employeeCategories.hourlyVariableWomen,
								hourlyVariableMen: employeeCategories.hourlyVariableMen,
							})
							.from(employeeCategories)
							.where(inArray(employeeCategories.jobCategoryId, jobIds))
					: [];

			const d = row.declaration;
			const { step2Data, step3Data, step4Data } = mapToStepData(d);
			const step5Categories = mapToEmployeeCategoryRows(
				jobs,
				empCats,
				isCorrection ? "correction" : "initial",
			);
			const step5Source = jobs[0]?.source ?? null;
			const referencePeriod = `01/01/${d.year} - 31/12/${d.year}`;
			const declarantName = [row.declarantFirstName, row.declarantLastName]
				.filter(Boolean)
				.join(" ");

			return {
				company: {
					name: row.companyName,
					siren: row.companySiren,
					nafCode: row.companyNafCode,
					address: row.companyAddress,
					workforce: row.companyWorkforce,
				},
				declarationYear: d.year,
				referencePeriod,
				declarantName,
				declarantEmail: row.declarantEmail,
				isCorrection,
				totalWomen: d.totalWomen,
				totalMen: d.totalMen,
				step2Data,
				step3Data,
				step4Data,
				step5Categories,
				step5Source,
			};
		}),
});
