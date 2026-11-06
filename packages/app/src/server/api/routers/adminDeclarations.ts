import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	ne,
	or,
	type SQL,
	type SQLWrapper,
} from "drizzle-orm";

import {
	cancelDeclarationSchema,
	getDeclarationByIdSchema,
	getRecapSchema,
	releaseLockSchema,
	type SortColumn,
	searchDeclarationsSchema,
} from "~/modules/admin/declarations/schemas";
import {
	floorWorkforce,
	getCurrentYear,
	getDeclarationReferencePeriod,
	getDemarcheLifecycleStatus,
	getDemarcheNextStepLabel,
	getDemarcheStatusDate,
	isCancelled,
	isTransmissionEventType,
	parseGipWorkforce,
} from "~/modules/domain";
import { getStatusHistoryLabel } from "~/modules/export";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { mapToStepData } from "~/server/api/routers/declarationStepMapping";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	demarcheCompletedAt,
	demarcheLifecycleSortKey,
	demarcheLifecycleStatusCondition,
	demarcheStatusDateSortKey,
	demarcheStatusOnOrAfter,
	demarcheStatusOnOrBefore,
	type LastTransmissionEvent,
	lastTransmissionAt,
	lastTransmissionEvent,
} from "~/server/db/declarationConditions";
import {
	gipSizeRangeFilter,
	gipWorkforceJoinCondition,
	gipWorkforceSortKey,
} from "~/server/db/gipWorkforceConditions";
import { containsInsensitive } from "~/server/db/likeConditions";
import {
	companies,
	cseOpinions,
	declarationStatusHistory,
	declarations,
	employeeCategories,
	files,
	gipMdsData,
	jobCategories,
	users,
} from "~/server/db/schema";
import {
	getActiveLock,
	releaseLockAsAdmin,
} from "~/server/services/declarationLockService";

type SortOrder = "asc" | "desc";

function columnSortKey(column: SQLWrapper) {
	return (sortOrder: SortOrder) =>
		sortOrder === "asc" ? asc(column) : desc(column);
}

const sortKeys = {
	siren: columnSortKey(declarations.siren),
	companyName: columnSortKey(companies.name),
	year: columnSortKey(declarations.year),
	workforce: gipWorkforceSortKey,
	demarcheStatus: demarcheLifecycleSortKey,
	declarantEmail: columnSortKey(users.email),
	statusDate: demarcheStatusDateSortKey,
} satisfies Record<SortColumn, (sortOrder: SortOrder) => SQL>;

function lastTransmittedStepLabel(
	event: LastTransmissionEvent | null,
): string | null {
	if (event === null || !isTransmissionEventType(event.eventType)) return null;
	return getStatusHistoryLabel(event.eventType, event.value);
}

export const adminDeclarationsRouter = createTRPCRouter({
	listYears: adminProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.selectDistinct({ year: declarations.year })
			.from(declarations)
			.orderBy(desc(declarations.year));

		return rows.map((row) => row.year);
	}),

	search: adminProcedure
		.input(searchDeclarationsSchema)
		.query(async ({ ctx, input }) => {
			const filters: SQL[] = [];

			if (input.query) {
				const queryFilter = or(
					containsInsensitive(companies.name, input.query),
					containsInsensitive(declarations.siren, input.query),
				);
				if (queryFilter) {
					filters.push(queryFilter);
				}
			}

			if (input.email) {
				filters.push(containsInsensitive(users.email, input.email));
			}

			if (input.year) {
				filters.push(eq(declarations.year, input.year));
			}

			if (input.dateFrom) {
				filters.push(demarcheStatusOnOrAfter(input.dateFrom));
			}

			if (input.dateTo) {
				filters.push(demarcheStatusOnOrBefore(input.dateTo));
			}

			if (input.status) {
				filters.push(demarcheLifecycleStatusCondition(input.status));
			}

			if (input.sizeRange) {
				filters.push(gipSizeRangeFilter(input.sizeRange));
			}

			const where = filters.length > 0 ? and(...filters) : undefined;
			// The id tie-break keeps pages disjoint when the sort key repeats (four statuses over many rows).
			const orderBy = [
				sortKeys[input.sortBy](input.sortOrder),
				asc(declarations.id),
			];
			const offset = (input.page - 1) * input.pageSize;

			// Join and filter on BOTH queries, else count and pagination describe another population.
			const [rawRows, totalResult] = await Promise.all([
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
						workforceEma: gipMdsData.workforceEma,
						declarantEmail: users.email,
						declarantFirstName: users.firstName,
						declarantLastName: users.lastName,
						lastTransmission: lastTransmissionEvent(),
						lastTransmissionAt: lastTransmissionAt(),
						demarcheCompletedAt: demarcheCompletedAt(),
					})
					.from(declarations)
					.innerJoin(companies, eq(declarations.siren, companies.siren))
					.leftJoin(gipMdsData, gipWorkforceJoinCondition())
					.innerJoin(users, eq(declarations.declarantId, users.id))
					.where(where)
					.orderBy(...orderBy)
					.limit(input.pageSize)
					.offset(offset),
				ctx.db
					.select({ total: count() })
					.from(declarations)
					.innerJoin(companies, eq(declarations.siren, companies.siren))
					.leftJoin(gipMdsData, gipWorkforceJoinCondition())
					.innerJoin(users, eq(declarations.declarantId, users.id))
					.where(where),
			]);

			const total = totalResult[0]?.total ?? 0;
			const rows = rawRows.map(
				({
					workforceEma,
					lastTransmission,
					lastTransmissionAt,
					demarcheCompletedAt,
					...row
				}) => {
					const demarcheStatus = getDemarcheLifecycleStatus(row);
					return {
						...row,
						workforce: floorWorkforce(parseGipWorkforce(workforceEma)),
						demarcheStatus,
						lastTransmittedStep: lastTransmittedStepLabel(lastTransmission),
						nextStep: getDemarcheNextStepLabel(demarcheStatus, row.status),
						statusDate: getDemarcheStatusDate(demarcheStatus, {
							openedAt: row.createdAt,
							lastTransmissionAt,
							completedAt: demarcheCompletedAt,
							cancelledAt: row.cancelledAt,
						}),
					};
				},
			);

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
					hourlyWomen: declarations.hourlyWomen,
					hourlyMen: declarations.hourlyMen,
					remunerationScore: declarations.remunerationScore,
					firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
					createdAt: declarations.createdAt,
					updatedAt: declarations.updatedAt,
					cancelledAt: declarations.cancelledAt,
					companyName: companies.name,
					companyAddress: companies.address,
					companyNafCode: companies.nafCode,
					companyWorkforceEma: gipMdsData.workforceEma,
					companyHasCse: companies.hasCse,
					declarantEmail: users.email,
					declarantFirstName: users.firstName,
					declarantLastName: users.lastName,
					declarantPhone: users.phone,
				})
				.from(declarations)
				.innerJoin(companies, eq(declarations.siren, companies.siren))
				.leftJoin(gipMdsData, gipWorkforceJoinCondition())
				.innerJoin(users, eq(declarations.declarantId, users.id))
				.where(eq(declarations.id, input.id))
				.limit(1);

			const row = rows[0];
			if (!row) {
				return null;
			}

			const { companyWorkforceEma, ...declaration } = row;

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
				status: isCancelled(s) ? "cancelled" : (s.status ?? "draft"),
			}));

			const findLatest = (eventType: string): Date | null => {
				const found = historyRows.find((r) => r.eventType === eventType);
				return found ? found.createdAt : null;
			};

			return {
				...declaration,
				companyWorkforce: floorWorkforce(
					parseGipWorkforce(companyWorkforceEma),
				),
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

			if (isCancelled(declaration)) {
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
					companyCountryCode: companies.countryCode,
					companyCountryLabel: companies.countryLabel,
					companyDepartmentLabel: companies.departmentLabel,
					companyWorkforceEma: gipMdsData.workforceEma,
					declarantEmail: users.email,
					declarantFirstName: users.firstName,
					declarantLastName: users.lastName,
				})
				.from(declarations)
				.innerJoin(companies, eq(declarations.siren, companies.siren))
				.leftJoin(gipMdsData, gipWorkforceJoinCondition())
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
								hourlyWomenCount: employeeCategories.hourlyWomenCount,
								hourlyMenCount: employeeCategories.hourlyMenCount,
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
			const { step2Data, step3Data, step4Data, step2Gaps, step3Gaps } =
				mapToStepData(d);
			const step5Categories = mapToEmployeeCategoryRows(
				jobs,
				empCats,
				isCorrection ? "correction" : "initial",
			);
			const step5Source = jobs[0]?.source ?? null;
			const referencePeriod = getDeclarationReferencePeriod(
				d.year,
				isCorrection,
				d.secondDeclReferencePeriodStart,
				d.secondDeclReferencePeriodEnd,
			);
			const declarantName = [row.declarantFirstName, row.declarantLastName]
				.filter(Boolean)
				.join(" ");

			return {
				company: {
					name: row.companyName,
					siren: row.companySiren,
					nafCode: row.companyNafCode,
					address: row.companyAddress,
					countryCode: row.companyCountryCode,
					countryLabel: row.companyCountryLabel,
					departmentLabel: row.companyDepartmentLabel,
					gipWorkforce: parseGipWorkforce(row.companyWorkforceEma),
				},
				declarationYear: d.year,
				referencePeriod,
				declarantName,
				declarantEmail: row.declarantEmail,
				isCorrection,
				totalWomen: d.totalWomen,
				totalMen: d.totalMen,
				hourlyWomen: d.hourlyWomen,
				hourlyMen: d.hourlyMen,
				step2Data,
				step3Data,
				step4Data,
				step2Gaps,
				step3Gaps,
				step5Categories,
				step5Source,
			};
		}),
});
