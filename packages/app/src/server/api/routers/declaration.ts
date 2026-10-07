import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
	declarationHistoryInputSchema,
	type SaveCompliancePathInput,
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
import { mapGipToFormData } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import {
	deriveSubsequentSubmissions,
	getCurrentYear,
	getObligationWorkforce,
	hasGapsAboveThreshold,
	isCseOpinionRequired,
	isDraft,
	isIndicatorGRequiredForGip,
	isLockedBySubsequentSubmission,
	isSecondDeclarationWritable,
	isTriennialYear,
	parseGipWorkforce,
} from "~/modules/domain";
import {
	companyProcedure,
	createTRPCRouter,
	declarationLockedWriteProcedure,
	declarationModifiableWriteProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	assertNotImpersonating,
	canAccessCompany,
} from "~/server/auth/companyAccess";
import {
	companies,
	declarationStatusHistory,
	declarations,
	employeeCategories,
	gipMdsData,
	jobCategories,
	users,
} from "~/server/db/schema";
import { loadRules } from "~/server/rules/engine";
import {
	activeDeclarationFilter,
	applyPercentagesAfterUpdate,
	buildEmployeeCategoryValues,
	buildPlaceholderDeclaration,
	deleteJobAndEmployeeCategories,
	fetchAllCategories,
	fetchPreviousYearJobCategories,
	findJointEvaluationFile,
	purgeDraftSlice,
} from "./declarationHelpers";
import {
	applyActionOrRefuse,
	assertFirstDeclarationModifiable,
	assertFirstDeclarationModifiableUnderLock,
	buildHistoryInserts,
	buildStepChangeInsert,
	computeProjectionUpdates,
	type DeclarationTransaction,
	getCurrentRound,
	hasLockingEventForRound,
	loadSubsequentSubmissions,
	lockAndReadDeclaration,
} from "./statusHistoryHelpers";

const SUBMIT_UNAVAILABLE_ERROR =
	"La déclaration ne peut pas être transmise à cette étape de la démarche.";

const INDICATOR_G_MISSING_ERROR =
	"L'indicateur par catégories de salariés doit être renseigné avant la transmission de la déclaration.";

const PATH_LOCKED_ERROR =
	"Le choix du parcours ne peut plus être modifié : une action aval a déjà été enregistrée.";

const PATH_CHOICE_UNAVAILABLE_ERROR =
	"Le choix du parcours de mise en conformité n'est pas ouvert à cette étape de la démarche.";

const JOINT_EVALUATION_FILE_MISSING_ERROR =
	"Le rapport de l'évaluation conjointe doit être déposé avant sa transmission.";

const JOINT_EVALUATION_UNAVAILABLE_ERROR =
	"L'évaluation conjointe ne peut pas être transmise à cette étape de la démarche.";

const SECOND_DECLARATION_UNAVAILABLE_ERROR =
	"La seconde déclaration ne peut pas être transmise à cette étape de la démarche.";

const SECOND_DECLARATION_EMPTY_ERROR =
	"Les données corrigées de la seconde déclaration doivent être renseignées avant sa transmission.";

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

async function findGipWorkforce(
	database: DeclarationTransaction,
	siren: string,
	year: number,
): Promise<number | null> {
	const rows = await database
		.select({ workforceEma: gipMdsData.workforceEma })
		.from(gipMdsData)
		.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
		.limit(1);
	return parseGipWorkforce(rows[0]?.workforceEma);
}

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
	gipWorkforce: number | null,
	hasIndicatorGData: boolean,
	hasGap: boolean,
): Record<string, unknown> {
	return {
		currentState: declaration.status,
		workforce: getObligationWorkforce(gipWorkforce),
		hasCse: company.hasCse === true,
		indicatorGCalculated: hasIndicatorGData,
		gap: hasGap ? 100 : 0,
		year: declaration.year,
		isTriennialYear: isTriennialYear(declaration.year),
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

function buildCompliancePathFacts(
	declaration: DeclarationRow,
	path: SaveCompliancePathInput["path"],
): Record<string, unknown> {
	return {
		currentState: declaration.status,
		cseRequired: declaration.cseRequired,
		firstDeclarationPathChoice: declaration.firstDeclarationPathChoice,
		secondDeclarationPathChoice: declaration.secondDeclarationPathChoice,
		action: { path },
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

			await tx.insert(declarationStatusHistory).values(
				buildStepChangeInsert({
					declarationId: declaration.id,
					fromStep: null,
					toStep: 0,
					actorUserId: ctx.session.user.id,
				}),
			);

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

		const declarationId = result.declaration.id;
		const subsequentSubmissions =
			declarationId === ""
				? deriveSubsequentSubmissions([])
				: await loadSubsequentSubmissions(ctx.db, declarationId);

		return {
			...result,
			gipPrefillData,
			previousYearCategories,
			...subsequentSubmissions,
			isFirstDeclarationLocked: isLockedBySubsequentSubmission(
				subsequentSubmissions,
				"first_declaration",
			),
		};
	}),

	updateStep1: declarationModifiableWriteProcedure
		.input(updateStep1Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				await assertFirstDeclarationModifiableUnderLock(tx, ctx.declarationId);
				const existing = await tx
					.select()
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				const hasChanged =
					existing[0]?.totalWomen !== input.totalWomen ||
					existing[0]?.totalMen !== input.totalMen ||
					existing[0]?.hourlyWomen !== input.hourlyWomen ||
					existing[0]?.hourlyMen !== input.hourlyMen;

				if (hasChanged) {
					const declarationId = existing[0]?.id;
					if (declarationId) {
						await deleteJobAndEmployeeCategories(tx, declarationId);
					}
				}

				const previousStep = existing[0]?.currentStep ?? null;
				const declarationId = existing[0]?.id ?? null;

				await tx
					.update(declarations)
					.set({
						totalWomen: input.totalWomen,
						totalMen: input.totalMen,
						hourlyWomen: input.hourlyWomen,
						hourlyMen: input.hourlyMen,
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

				if (declarationId && previousStep !== 1) {
					await tx.insert(declarationStatusHistory).values(
						buildStepChangeInsert({
							declarationId,
							fromStep: previousStep,
							toStep: 1,
							actorUserId: ctx.session.user.id,
						}),
					);
				}

				await applyPercentagesAfterUpdate(tx, siren, year);
			});

			return { success: true };
		}),

	updateStep2: declarationModifiableWriteProcedure
		.input(updateStep2Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				await assertFirstDeclarationModifiableUnderLock(tx, ctx.declarationId);
				const [existing] = await tx
					.select({
						id: declarations.id,
						currentStep: declarations.currentStep,
					})
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				await tx
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

				if (existing && existing.currentStep !== 2) {
					await tx.insert(declarationStatusHistory).values(
						buildStepChangeInsert({
							declarationId: existing.id,
							fromStep: existing.currentStep,
							toStep: 2,
							actorUserId: ctx.session.user.id,
						}),
					);
				}

				await applyPercentagesAfterUpdate(tx, siren, year);
			});

			return { success: true };
		}),

	updateStep3: declarationModifiableWriteProcedure
		.input(updateStep3Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				await assertFirstDeclarationModifiableUnderLock(tx, ctx.declarationId);
				const [existing] = await tx
					.select({
						id: declarations.id,
						currentStep: declarations.currentStep,
					})
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				await tx
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

				if (existing && existing.currentStep !== 3) {
					await tx.insert(declarationStatusHistory).values(
						buildStepChangeInsert({
							declarationId: existing.id,
							fromStep: existing.currentStep,
							toStep: 3,
							actorUserId: ctx.session.user.id,
						}),
					);
				}

				await applyPercentagesAfterUpdate(tx, siren, year);
			});

			return { success: true };
		}),

	updateStep4: declarationModifiableWriteProcedure
		.input(updateStep4Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				await assertFirstDeclarationModifiableUnderLock(tx, ctx.declarationId);
				const [existing] = await tx
					.select({
						id: declarations.id,
						currentStep: declarations.currentStep,
					})
					.from(declarations)
					.where(activeDeclarationFilter(siren, year))
					.limit(1);

				await tx
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

				if (existing && existing.currentStep !== 4) {
					await tx.insert(declarationStatusHistory).values(
						buildStepChangeInsert({
							declarationId: existing.id,
							fromStep: existing.currentStep,
							toStep: 4,
							actorUserId: ctx.session.user.id,
						}),
					);
				}

				await applyPercentagesAfterUpdate(tx, siren, year);
			});

			return { success: true };
		}),

	updateEmployeeCategories: declarationLockedWriteProcedure
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

				if (input.declarationType === "initial") {
					await assertFirstDeclarationModifiableUnderLock(tx, declaration.id);
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

					if (declaration.currentStep !== 5) {
						await tx.insert(declarationStatusHistory).values(
							buildStepChangeInsert({
								declarationId: declaration.id,
								fromStep: declaration.currentStep,
								toStep: 5,
								actorUserId: ctx.session.user.id,
							}),
						);
					}
				} else {
					const current = await lockAndReadDeclaration(
						tx,
						declaration.id,
						siren,
						year,
					);
					if (!isSecondDeclarationWritable(current.status))
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "La seconde déclaration n'est pas ouverte à la saisie.",
						});

					const existingJobs = await tx
						.select()
						.from(jobCategories)
						.where(eq(jobCategories.declarationId, declaration.id));

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

	submit: declarationModifiableWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		await ctx.db.transaction(async (tx) => {
			const declaration = await lockAndReadDeclaration(
				tx,
				ctx.declarationId,
				siren,
				year,
			);
			await assertFirstDeclarationModifiable(tx, declaration.id);

			const [company] = await tx
				.select()
				.from(companies)
				.where(eq(companies.siren, siren))
				.limit(1);

			if (!company)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Entreprise introuvable",
				});

			const gipWorkforce = await findGipWorkforce(tx, siren, year);

			const initialCategories = await loadEmployeeCategoriesForDeclaration(
				tx,
				declaration.id,
				"initial",
			);
			const hasIndicatorGData = initialCategories.length > 0;
			const hasGap =
				hasIndicatorGData && hasGapsAboveThreshold(initialCategories);

			const { nextStatus, events } = applyActionOrRefuse(
				buildSubmitFacts(
					declaration,
					company,
					gipWorkforce,
					hasIndicatorGData,
					hasGap,
				),
				"submit",
				loadRules(declaration.rulesVersion),
				SUBMIT_UNAVAILABLE_ERROR,
			);

			if (
				!hasIndicatorGData &&
				isIndicatorGRequiredForGip(gipWorkforce, declaration.year)
			) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: INDICATOR_G_MISSING_ERROR,
				});
			}

			// Snapshot `cseRequired` à la transmission : c'est cette valeur que les
			// transitions FSM aval (saveCompliancePath, submitJointEvaluation,
			// cseOpinion.finalize) liront comme guard, plutôt que `companies.hasCse`
			// qui peut bouger en cours de cycle. Le snapshot n'est resynchronisé que
			// par `syncCseRequirement` (company.updateHasCse), quand la réponse CSE
			// elle-même change.
			const cseRequiredSnapshot = isCseOpinionRequired({
				workforce: getObligationWorkforce(gipWorkforce),
				hasCse: company.hasCse,
			});

			const historyInserts = buildHistoryInserts(
				declaration.id,
				events,
				ctx.session.user.id,
			);
			if (isDraft(declaration.status) && historyInserts.length > 0) {
				await tx.insert(declarationStatusHistory).values(historyInserts);
			}
			await tx
				.update(declarations)
				.set({
					...computeProjectionUpdates(events, nextStatus),
					cseRequired: cseRequiredSnapshot,
					currentStep: 6,
					updatedAt: new Date(),
				})
				.where(activeDeclarationFilter(siren, year));

			if (declaration.currentStep !== 6) {
				await tx.insert(declarationStatusHistory).values(
					buildStepChangeInsert({
						declarationId: declaration.id,
						fromStep: declaration.currentStep,
						toStep: 6,
						actorUserId: ctx.session.user.id,
					}),
				);
			}

			await applyPercentagesAfterUpdate(tx, siren, year);
			await purgeDraftSlice(tx, siren, year, "main");
		});

		const email = ctx.session.user.email;
		if (email) {
			const { enqueueReceipt } = await import("~/modules/mail/server");
			await enqueueReceipt({
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

	saveCompliancePath: declarationLockedWriteProcedure
		.input(saveCompliancePathInputSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			const { events, isRound2 } = await ctx.db.transaction(async (tx) => {
				const declaration = await lockAndReadDeclaration(
					tx,
					ctx.declarationId,
					siren,
					year,
				);

				const round = await getCurrentRound(tx, declaration.id);

				if (round === 2 && input.path === "corrective_action") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"L'action corrective n'est pas un parcours disponible lors de la révision.",
					});
				}

				if (await hasLockingEventForRound(tx, declaration.id, round)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: PATH_LOCKED_ERROR,
					});
				}

				const { nextStatus, events } = applyActionOrRefuse(
					buildCompliancePathFacts(declaration, input.path),
					"choose_compliance_path",
					loadRules(declaration.rulesVersion),
					PATH_CHOICE_UNAVAILABLE_ERROR,
				);

				await tx
					.insert(declarationStatusHistory)
					.values(
						buildHistoryInserts(declaration.id, events, ctx.session.user.id),
					);
				await tx
					.update(declarations)
					.set({
						...computeProjectionUpdates(events, nextStatus),
						updatedAt: new Date(),
					})
					.where(activeDeclarationFilter(siren, year));
				await purgeDraftSlice(tx, siren, year, "compliance");

				return { events, isRound2: round === 2 };
			});

			// The "justify" path with no CSE (round 1 or round 2) ends the
			// démarche right here — no upload step follows to carry the
			// acknowledgement, unlike the corrective-action / joint-evaluation
			// paths. Every other event.type is either a transient path choice
			// with more steps ahead, or absent — so this only fires on those
			// two terminal transitions.
			const isDemarcheComplete = events.some(
				(event) => event.type === "demarche_complete",
			);
			const email = ctx.session.user.email;
			if (isDemarcheComplete && email) {
				const { enqueueReceipt } = await import("~/modules/mail/server");
				await enqueueReceipt({
					kind: isRound2 ? "secondDeclaration" : "declaration",
					to: email,
					siren,
					year,
					userId: ctx.session.user.id,
					isResend: false,
				});
			}

			return { success: true };
		}),

	submitSecondDeclaration: declarationLockedWriteProcedure.mutation(
		async ({ ctx }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				const declaration = await lockAndReadDeclaration(
					tx,
					ctx.declarationId,
					siren,
					year,
				);

				const correctionCategories = await loadEmployeeCategoriesForDeclaration(
					tx,
					declaration.id,
					"correction",
				);

				const { nextStatus, events } = applyActionOrRefuse(
					buildSecondDeclarationFacts(
						declaration,
						hasGapsAboveThreshold(correctionCategories),
					),
					"submit_second_declaration",
					loadRules(declaration.rulesVersion),
					SECOND_DECLARATION_UNAVAILABLE_ERROR,
				);

				if (correctionCategories.length === 0) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: SECOND_DECLARATION_EMPTY_ERROR,
					});
				}

				await tx
					.insert(declarationStatusHistory)
					.values(
						buildHistoryInserts(declaration.id, events, ctx.session.user.id),
					);
				await tx
					.update(declarations)
					.set({
						...computeProjectionUpdates(events, nextStatus),
						secondDeclarationStep: 3,
						updatedAt: new Date(),
					})
					.where(activeDeclarationFilter(siren, year));
				await purgeDraftSlice(tx, siren, year, "second");
			});

			const email = ctx.session.user.email;
			if (email) {
				const { enqueueReceipt } = await import("~/modules/mail/server");
				await enqueueReceipt({
					kind: "secondDeclaration",
					to: email,
					siren,
					year,
					userId: ctx.session.user.id,
					isResend: false,
				});
			}

			return { success: true };
		},
	),

	submitJointEvaluation: declarationLockedWriteProcedure
		.input(submitJointEvaluationSchema)
		.mutation(async ({ ctx }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				const declaration = await lockAndReadDeclaration(
					tx,
					ctx.declarationId,
					siren,
					year,
				);

				const { nextStatus, events } = applyActionOrRefuse(
					buildJointEvaluationFacts(declaration),
					"submit_joint_evaluation",
					loadRules(declaration.rulesVersion),
					JOINT_EVALUATION_UNAVAILABLE_ERROR,
				);

				if (!(await findJointEvaluationFile(tx, declaration.id))) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: JOINT_EVALUATION_FILE_MISSING_ERROR,
					});
				}

				await tx
					.insert(declarationStatusHistory)
					.values(
						buildHistoryInserts(declaration.id, events, ctx.session.user.id),
					);
				await tx
					.update(declarations)
					.set({
						...computeProjectionUpdates(events, nextStatus),
						updatedAt: new Date(),
					})
					.where(activeDeclarationFilter(siren, year));
				await purgeDraftSlice(tx, siren, year, "joint");
			});

			const email = ctx.session.user.email;
			if (email) {
				const { enqueueReceipt } = await import("~/modules/mail/server");
				await enqueueReceipt({
					kind: "jointEvaluation",
					to: email,
					siren,
					year,
					userId: ctx.session.user.id,
					isResend: false,
				});
			}

			return { success: true };
		}),

	getStatusHistory: protectedProcedure
		.input(declarationHistoryInputSchema)
		.query(async ({ ctx, input }) => {
			if (!(await canAccessCompany(ctx.db, ctx.session, input.siren))) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Accès refusé à cette entreprise.",
				});
			}

			const [declaration] = await ctx.db
				.select({ id: declarations.id })
				.from(declarations)
				.where(
					and(
						eq(declarations.siren, input.siren),
						eq(declarations.year, input.year),
						isNull(declarations.cancelledAt),
					),
				)
				.limit(1);

			if (!declaration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Déclaration introuvable.",
				});
			}

			const historyWhere = eq(
				declarationStatusHistory.declarationId,
				declaration.id,
			);

			const [items, totalResult] = await Promise.all([
				ctx.db
					.select({
						id: declarationStatusHistory.id,
						eventType: declarationStatusHistory.eventType,
						value: declarationStatusHistory.value,
						round: declarationStatusHistory.round,
						createdAt: declarationStatusHistory.createdAt,
						actorFirstName: users.firstName,
						actorLastName: users.lastName,
						actorEmail: users.email,
					})
					.from(declarationStatusHistory)
					.leftJoin(users, eq(declarationStatusHistory.actorUserId, users.id))
					.where(historyWhere)
					.orderBy(desc(declarationStatusHistory.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				ctx.db
					.select({ total: count() })
					.from(declarationStatusHistory)
					.where(historyWhere),
			]);

			const total = totalResult[0]?.total ?? 0;

			return {
				items: items.map((row) => ({
					id: row.id,
					eventType: row.eventType,
					value: row.value,
					round: row.round,
					createdAt: row.createdAt,
					actor:
						row.actorEmail !== null
							? {
									firstName: row.actorFirstName ?? null,
									lastName: row.actorLastName ?? null,
									email: row.actorEmail,
								}
							: null,
				})),
				total,
			};
		}),
});
