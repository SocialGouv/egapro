import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	saveCompliancePathInputSchema,
	submitJointEvaluationSchema,
} from "~/modules/declaration/schemas";
import {
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
	updateStep2Schema,
	updateStep3Schema,
	updateStep4Schema,
} from "~/modules/declaration-remuneration/schemas";
import { computeIndicatorPercentages } from "~/modules/declaration-remuneration/shared/computeIndicatorPercentages";
import { mapGipToFormData } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import {
	getCurrentYear,
	hasGapsAboveThreshold,
	isTriennialYear,
} from "~/modules/domain";
import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";
import { assertNotImpersonating } from "~/server/auth/companyAccess";
import {
	companies,
	declarations,
	employeeCategories,
	gipMdsData,
	jobCategories,
} from "~/server/db/schema";
import { applyAction, loadRules } from "~/server/rules/engine";
import {
	activeDeclarationFilter,
	buildEmployeeCategoryValues,
	buildPlaceholderDeclaration,
	deleteJobAndEmployeeCategories,
	fetchAllCategories,
	fetchPreviousYearJobCategories,
} from "./declarationHelpers";

const IMMUTABLE_FIELD_ERROR =
	"Le choix du parcours est définitif et ne peut pas être modifié.";

type DeclarationRow = typeof declarations.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;
type EmployeeCategoryRow = typeof employeeCategories.$inferSelect;

type DbLike = {
	select: () => {
		from: (table: typeof employeeCategories) => {
			innerJoin: (
				table: typeof jobCategories,
				predicate: ReturnType<typeof eq>,
			) => {
				where: (
					predicate: ReturnType<typeof and>,
				) => Promise<Array<{ employee_category: EmployeeCategoryRow }>>;
			};
		};
	};
};

async function loadEmployeeCategoriesForDeclaration(
	database: DbLike,
	declarationId: string,
	type: "initial" | "correction",
): Promise<EmployeeCategoryRow[]> {
	const rows = await database
		.select()
		.from(employeeCategories)
		.innerJoin(
			jobCategories,
			eq(employeeCategories.jobCategoryId, jobCategories.id),
		)
		.where(
			and(
				eq(jobCategories.declarationId, declarationId),
				eq(employeeCategories.declarationType, type),
			),
		);
	return rows.map((r) => r.employee_category);
}

function buildSubmitFacts(
	declaration: DeclarationRow,
	company: CompanyRow,
	hasIndicatorGData: boolean,
	hasGap: boolean,
): Record<string, unknown> {
	const workforce = company.workforce ?? 0;
	return {
		currentState: declaration.status,
		workforce,
		hasCse: company.hasCse === true,
		indicatorGCalculated: hasIndicatorGData,
		gap: hasGap ? 100 : 0,
		isTriennialYear: isTriennialYear(declaration.year),
	};
}

function buildPathChoiceFacts(
	declaration: DeclarationRow,
	path: "justify" | "corrective_action" | "joint_evaluation",
): Record<string, unknown> {
	return {
		currentState: declaration.status,
		cseRequired: declaration.cseRequired,
		action: { path },
	};
}

function buildSecondDeclarationFacts(
	declaration: DeclarationRow,
	stillHasGap: boolean,
): Record<string, unknown> {
	return {
		currentState: declaration.status,
		cseRequired: declaration.cseRequired,
		action: { stillHasGap },
	};
}

function buildJointEvaluationFacts(
	declaration: DeclarationRow,
): Record<string, unknown> {
	return {
		currentState: declaration.status,
		cseRequired: declaration.cseRequired,
	};
}

export const declarationRouter = createTRPCRouter({
	getOrCreate: companyProcedure.query(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		const result = await ctx.db.transaction(async (tx) => {
			const existing = await tx
				.select()
				.from(declarations)
				.where(activeDeclarationFilter(siren, year))
				.limit(1);

			if (existing.length > 0) {
				const declaration = existing[0];
				if (!declaration)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Declaration introuvable",
					});
				return {
					declaration,
					...(await fetchAllCategories(tx, declaration.id)),
				};
			}

			if (ctx.session.user.isAdmin && ctx.session.user.impersonation) {
				return {
					declaration: buildPlaceholderDeclaration({
						siren,
						year,
						declarantId: ctx.session.user.id,
					}),
					jobCategories: [],
					employeeCategories: [],
				};
			}
			assertNotImpersonating(ctx.session);

			const newDeclaration = await tx
				.insert(declarations)
				.values({
					siren,
					year,
					declarantId: ctx.session.user.id,
					currentStep: 0,
					status: "draft",
				})
				.onConflictDoNothing()
				.returning();

			if (newDeclaration.length === 0) {
				const retried = await tx
					.select()
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);
				const declaration = retried[0];
				if (!declaration)
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Erreur lors de la création",
					});
				return {
					declaration,
					...(await fetchAllCategories(tx, declaration.id)),
				};
			}

			const declaration = newDeclaration[0];
			if (!declaration)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erreur lors de la création",
				});
			return {
				declaration,
				jobCategories: [],
				employeeCategories: [],
			};
		});

		const gipRow = await ctx.db
			.select()
			.from(gipMdsData)
			.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
			.limit(1);

		const gipPrefillData = gipRow[0] ? mapGipToFormData(gipRow[0]) : null;

		const hasCurrentCategories = (result.jobCategories ?? []).length > 0;
		const previousYearCategories = hasCurrentCategories
			? null
			: await fetchPreviousYearJobCategories(ctx.db, siren, year);

		return {
			...result,
			gipPrefillData,
			previousYearCategories,
		};
	}),

	updateStep1: companyWriteProcedure
		.input(updateStep1Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				const existing = await tx
					.select()
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				const hasChanged =
					existing[0]?.totalWomen !== input.totalWomen ||
					existing[0]?.totalMen !== input.totalMen;

				if (hasChanged) {
					const declarationId = existing[0]?.id;
					if (declarationId) {
						await deleteJobAndEmployeeCategories(tx, declarationId);
					}
				}

				await tx
					.update(declarations)
					.set({
						totalWomen: input.totalWomen,
						totalMen: input.totalMen,
						currentStep: 1,
						updatedAt: new Date(),
						...(hasChanged
							? {
									indicatorAAnnualWomen: null,
									indicatorAAnnualMen: null,
									indicatorAHourlyWomen: null,
									indicatorAHourlyMen: null,
									indicatorBAnnualWomen: null,
									indicatorBAnnualMen: null,
									indicatorBHourlyWomen: null,
									indicatorBHourlyMen: null,
									indicatorCAnnualWomen: null,
									indicatorCAnnualMen: null,
									indicatorCHourlyWomen: null,
									indicatorCHourlyMen: null,
									indicatorDAnnualWomen: null,
									indicatorDAnnualMen: null,
									indicatorDHourlyWomen: null,
									indicatorDHourlyMen: null,
									indicatorEWomen: null,
									indicatorEMen: null,
									indicatorFAnnualThreshold1: null,
									indicatorFAnnualThreshold2: null,
									indicatorFAnnualThreshold3: null,
									indicatorFAnnualWomen1: null,
									indicatorFAnnualWomen2: null,
									indicatorFAnnualWomen3: null,
									indicatorFAnnualWomen4: null,
									indicatorFAnnualMen1: null,
									indicatorFAnnualMen2: null,
									indicatorFAnnualMen3: null,
									indicatorFAnnualMen4: null,
									indicatorFHourlyThreshold1: null,
									indicatorFHourlyThreshold2: null,
									indicatorFHourlyThreshold3: null,
									indicatorFHourlyWomen1: null,
									indicatorFHourlyWomen2: null,
									indicatorFHourlyWomen3: null,
									indicatorFHourlyWomen4: null,
									indicatorFHourlyMen1: null,
									indicatorFHourlyMen2: null,
									indicatorFHourlyMen3: null,
									indicatorFHourlyMen4: null,
									remunerationScore: null,
									variableRemunerationScore: null,
									quartileScore: null,
									categoryScore: null,
								}
							: {}),
					})
					.where(activeDeclarationFilter(siren, year));
			});

			return { success: true };
		}),

	updateStep2: companyWriteProcedure
		.input(updateStep2Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db
				.update(declarations)
				.set({
					indicatorAAnnualWomen: input.indicatorAAnnualWomen ?? null,
					indicatorAAnnualMen: input.indicatorAAnnualMen ?? null,
					indicatorAHourlyWomen: input.indicatorAHourlyWomen ?? null,
					indicatorAHourlyMen: input.indicatorAHourlyMen ?? null,
					indicatorCAnnualWomen: input.indicatorCAnnualWomen ?? null,
					indicatorCAnnualMen: input.indicatorCAnnualMen ?? null,
					indicatorCHourlyWomen: input.indicatorCHourlyWomen ?? null,
					indicatorCHourlyMen: input.indicatorCHourlyMen ?? null,
					currentStep: 2,
					updatedAt: new Date(),
				})
				.where(activeDeclarationFilter(siren, year));

			return { success: true };
		}),

	updateStep3: companyWriteProcedure
		.input(updateStep3Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db
				.update(declarations)
				.set({
					indicatorBAnnualWomen: input.indicatorBAnnualWomen ?? null,
					indicatorBAnnualMen: input.indicatorBAnnualMen ?? null,
					indicatorBHourlyWomen: input.indicatorBHourlyWomen ?? null,
					indicatorBHourlyMen: input.indicatorBHourlyMen ?? null,
					indicatorDAnnualWomen: input.indicatorDAnnualWomen ?? null,
					indicatorDAnnualMen: input.indicatorDAnnualMen ?? null,
					indicatorDHourlyWomen: input.indicatorDHourlyWomen ?? null,
					indicatorDHourlyMen: input.indicatorDHourlyMen ?? null,
					indicatorEWomen: input.indicatorEWomen ?? null,
					indicatorEMen: input.indicatorEMen ?? null,
					currentStep: 3,
					updatedAt: new Date(),
				})
				.where(activeDeclarationFilter(siren, year));

			return { success: true };
		}),

	updateStep4: companyWriteProcedure
		.input(updateStep4Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db
				.update(declarations)
				.set({
					indicatorFAnnualThreshold1: input.annual[0].threshold || null,
					indicatorFAnnualThreshold2: input.annual[1].threshold || null,
					indicatorFAnnualThreshold3: input.annual[2].threshold || null,
					indicatorFAnnualWomen1: input.annual[0].women ?? null,
					indicatorFAnnualWomen2: input.annual[1].women ?? null,
					indicatorFAnnualWomen3: input.annual[2].women ?? null,
					indicatorFAnnualWomen4: input.annual[3].women ?? null,
					indicatorFAnnualMen1: input.annual[0].men ?? null,
					indicatorFAnnualMen2: input.annual[1].men ?? null,
					indicatorFAnnualMen3: input.annual[2].men ?? null,
					indicatorFAnnualMen4: input.annual[3].men ?? null,
					indicatorFHourlyThreshold1: input.hourly[0].threshold || null,
					indicatorFHourlyThreshold2: input.hourly[1].threshold || null,
					indicatorFHourlyThreshold3: input.hourly[2].threshold || null,
					indicatorFHourlyWomen1: input.hourly[0].women ?? null,
					indicatorFHourlyWomen2: input.hourly[1].women ?? null,
					indicatorFHourlyWomen3: input.hourly[2].women ?? null,
					indicatorFHourlyWomen4: input.hourly[3].women ?? null,
					indicatorFHourlyMen1: input.hourly[0].men ?? null,
					indicatorFHourlyMen2: input.hourly[1].men ?? null,
					indicatorFHourlyMen3: input.hourly[2].men ?? null,
					indicatorFHourlyMen4: input.hourly[3].men ?? null,
					currentStep: 4,
					updatedAt: new Date(),
				})
				.where(activeDeclarationFilter(siren, year));

			return { success: true };
		}),

	updateEmployeeCategories: companyWriteProcedure
		.input(updateEmployeeCategoriesSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				const [declaration] = await tx
					.select()
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				if (!declaration)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Déclaration introuvable",
					});

				const existingJobs = await tx
					.select()
					.from(jobCategories)
					.where(eq(jobCategories.declarationId, declaration.id));

				if (input.declarationType === "initial") {
					await deleteJobAndEmployeeCategories(tx, declaration.id);

					for (let i = 0; i < input.categories.length; i++) {
						const cat = input.categories[i];
						if (!cat) continue;
						const [job] = await tx
							.insert(jobCategories)
							.values({
								declarationId: declaration.id,
								categoryIndex: i,
								name: cat.name,
								source: input.source,
							})
							.returning();
						if (!job) continue;

						await tx
							.insert(employeeCategories)
							.values(buildEmployeeCategoryValues(job.id, "initial", cat.data));
					}

					await tx
						.update(declarations)
						.set({ currentStep: 5, updatedAt: new Date() })
						.where(eq(declarations.id, declaration.id));
				} else {
					for (const job of existingJobs) {
						const cat = input.categories[job.categoryIndex];
						if (!cat) continue;

						await tx
							.delete(employeeCategories)
							.where(
								and(
									eq(employeeCategories.jobCategoryId, job.id),
									eq(employeeCategories.declarationType, "correction"),
								),
							);

						await tx
							.insert(employeeCategories)
							.values(
								buildEmployeeCategoryValues(job.id, "correction", cat.data),
							);
					}

					await tx
						.update(declarations)
						.set({
							secondDeclarationStep: 2,
							secondDeclReferencePeriodStart:
								input.referencePeriodStart ?? null,
							secondDeclReferencePeriodEnd: input.referencePeriodEnd ?? null,
							updatedAt: new Date(),
						})
						.where(eq(declarations.id, declaration.id));
				}
			});

			return { success: true };
		}),

	submit: companyWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		const [declaration] = await ctx.db
			.select()
			.from(declarations)
			.where(activeDeclarationFilter(siren, year))
			.limit(1);

		if (!declaration) throw new TRPCError({ code: "NOT_FOUND" });

		const [company] = await ctx.db
			.select()
			.from(companies)
			.where(eq(companies.siren, siren))
			.limit(1);

		if (!company)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Entreprise introuvable",
			});

		const initialCategories = await loadEmployeeCategoriesForDeclaration(
			ctx.db,
			declaration.id,
			"initial",
		);
		const hasIndicatorGData = initialCategories.length > 0;
		const hasGap =
			hasIndicatorGData && hasGapsAboveThreshold(initialCategories);

		const rules = loadRules(declaration.rulesVersion);
		const facts = buildSubmitFacts(
			declaration,
			company,
			hasIndicatorGData,
			hasGap,
		);
		const { nextState, setFlags } = applyAction(facts, "submit", rules);

		const percentages = computeIndicatorPercentages(declaration);
		const percentagesForDb = Object.fromEntries(
			Object.entries(percentages).map(([k, v]) => [
				k,
				v === null ? null : v.toString(),
			]),
		);

		const submittedAt =
			declaration.submittedAt ?? (setFlags.submittedAt as Date);

		await ctx.db
			.update(declarations)
			.set({
				status: nextState as DeclarationRow["status"],
				currentStep: 6,
				updatedAt: new Date(),
				...setFlags,
				submittedAt,
				...percentagesForDb,
			})
			.where(activeDeclarationFilter(siren, year));

		const email = ctx.session.user.email;
		if (email) {
			const { sendReceipt } = await import("~/modules/mail/server");
			await sendReceipt({
				kind: "declaration",
				to: email,
				siren,
				year,
				userId: ctx.session.user.id,
				isResend: false,
			});
		}

		return { success: true };
	}),

	saveCompliancePath: companyWriteProcedure
		.input(saveCompliancePathInputSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			const [declaration] = await ctx.db
				.select()
				.from(declarations)
				.where(activeDeclarationFilter(siren, year))
				.limit(1);

			if (!declaration) throw new TRPCError({ code: "NOT_FOUND" });

			if (
				declaration.status === "awaiting_revision_choice" &&
				input.path === "corrective_action"
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"L'action corrective n'est pas un parcours disponible lors de la révision.",
				});
			}

			const isInitialChoice =
				declaration.status === "awaiting_compliance_path_choice";
			if (isInitialChoice && declaration.firstDeclarationPathChoice !== null) {
				throw new TRPCError({
					code: "CONFLICT",
					message: IMMUTABLE_FIELD_ERROR,
				});
			}
			if (
				!isInitialChoice &&
				declaration.secondDeclarationPathChoice !== null
			) {
				throw new TRPCError({
					code: "CONFLICT",
					message: IMMUTABLE_FIELD_ERROR,
				});
			}

			const rules = loadRules(declaration.rulesVersion);
			const facts = buildPathChoiceFacts(declaration, input.path);
			const { nextState, setFlags } = applyAction(
				facts,
				"choose_compliance_path",
				rules,
			);

			await ctx.db
				.update(declarations)
				.set({
					status: nextState as DeclarationRow["status"],
					updatedAt: new Date(),
					...setFlags,
				})
				.where(activeDeclarationFilter(siren, year));

			return { success: true };
		}),

	submitSecondDeclaration: companyWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		const [declaration] = await ctx.db
			.select()
			.from(declarations)
			.where(activeDeclarationFilter(siren, year))
			.limit(1);

		if (!declaration) throw new TRPCError({ code: "NOT_FOUND" });

		const correctionCategories = await loadEmployeeCategoriesForDeclaration(
			ctx.db,
			declaration.id,
			"correction",
		);
		const stillHasGap = hasGapsAboveThreshold(correctionCategories);

		const rules = loadRules(declaration.rulesVersion);
		const facts = buildSecondDeclarationFacts(declaration, stillHasGap);
		const { nextState, setFlags } = applyAction(
			facts,
			"submit_second_declaration",
			rules,
		);

		await ctx.db
			.update(declarations)
			.set({
				status: nextState as DeclarationRow["status"],
				secondDeclarationStep: 3,
				updatedAt: new Date(),
				...setFlags,
			})
			.where(activeDeclarationFilter(siren, year));

		const email = ctx.session.user.email;
		if (email) {
			const { sendReceipt } = await import("~/modules/mail/server");
			await sendReceipt({
				kind: "secondDeclaration",
				to: email,
				siren,
				year,
				userId: ctx.session.user.id,
				isResend: false,
			});
		}

		return { success: true };
	}),

	submitJointEvaluation: companyWriteProcedure
		.input(submitJointEvaluationSchema)
		.mutation(async ({ ctx }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			const [declaration] = await ctx.db
				.select()
				.from(declarations)
				.where(activeDeclarationFilter(siren, year))
				.limit(1);

			if (!declaration) throw new TRPCError({ code: "NOT_FOUND" });

			const rules = loadRules(declaration.rulesVersion);
			const facts = buildJointEvaluationFacts(declaration);
			const { nextState, setFlags } = applyAction(
				facts,
				"submit_joint_evaluation",
				rules,
			);

			await ctx.db
				.update(declarations)
				.set({
					status: nextState as DeclarationRow["status"],
					updatedAt: new Date(),
					...setFlags,
				})
				.where(activeDeclarationFilter(siren, year));

			return { success: true };
		}),
});
