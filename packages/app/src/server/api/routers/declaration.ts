import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
	saveCompliancePathSchema,
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
	updateStep2Schema,
	updateStep3Schema,
	updateStep4Schema,
} from "~/modules/declaration-remuneration/schemas";
import { mapGipToFormData } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import { getCurrentYear } from "~/modules/domain";
import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";
import { assertNotImpersonating } from "~/server/auth/companyAccess";
import {
	declarations,
	employeeCategories,
	gipMdsData,
	jobCategories,
} from "~/server/db/schema";
import {
	buildEmployeeCategoryValues,
	buildPlaceholderDeclaration,
	deleteJobAndEmployeeCategories,
	fetchAllCategories,
	fetchPreviousYearJobCategories,
} from "./declarationHelpers";

export const declarationRouter = createTRPCRouter({
	getOrCreate: companyProcedure.query(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		const result = await ctx.db.transaction(async (tx) => {
			const existing = await tx
				.select()
				.from(declarations)
				.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
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

			// Admins impersonating a company can view an existing declaration in
			// read-only mode, but must not silently create a new draft in the
			// user's name (issue #3230). When no row exists yet, return a
			// transient placeholder so the read-only UI can still render — it
			// is never persisted.
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

			// Handle concurrent insert: if onConflictDoNothing returned nothing, re-select
			if (newDeclaration.length === 0) {
				const retried = await tx
					.select()
					.from(declarations)
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					)
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

		// Fetch GIP data for automatic prefilling (no user choice needed)
		const gipRow = await ctx.db
			.select()
			.from(gipMdsData)
			.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
			.limit(1);

		const gipPrefillData = gipRow[0] ? mapGipToFormData(gipRow[0]) : null;

		// Fetch job categories from the most recent previous declaration that
		// contains indicator 7, for automatic prefilling when step 5 is empty.
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
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					)
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
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					);
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
				.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

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
				.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

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
				.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

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
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					)
					.limit(1);

				if (!declaration)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Déclaration introuvable",
					});

				// Check existing job categories
				const existingJobs = await tx
					.select()
					.from(jobCategories)
					.where(eq(jobCategories.declarationId, declaration.id));

				if (input.declarationType === "initial") {
					// For initial: recreate job categories + employee data
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
					// For correction: reuse existing job categories, upsert employee data
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

	submitSecondDeclaration: companyWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		await ctx.db
			.update(declarations)
			.set({
				secondDeclarationStatus: "submitted",
				secondDeclarationStep: 3,
				updatedAt: new Date(),
			})
			.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

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

	submit: companyWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();
		const now = new Date();

		// Preserve the very first submission date — resubmissions after
		// corrections must not move the campaign progression curve.
		const [existing] = await ctx.db
			.select({ submittedAt: declarations.submittedAt })
			.from(declarations)
			.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
			.limit(1);

		await ctx.db
			.update(declarations)
			.set({
				status: "submitted",
				currentStep: 6,
				submittedAt: existing?.submittedAt ?? now,
				updatedAt: now,
			})
			.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

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
		.input(saveCompliancePathSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db
				.update(declarations)
				.set({
					compliancePath: input.path,
					updatedAt: new Date(),
				})
				.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

			return { success: true };
		}),

	completeCompliancePath: companyWriteProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();
		const now = new Date();

		// Idempotent: only set complianceCompletedAt on first completion
		// Also requires status = 'submitted' to prevent stale fire-and-forget
		// mutations from overwriting a reset declaration.
		await ctx.db
			.update(declarations)
			.set({ complianceCompletedAt: now, updatedAt: now })
			.where(
				and(
					eq(declarations.siren, siren),
					eq(declarations.year, year),
					eq(declarations.status, "submitted"),
					isNull(declarations.complianceCompletedAt),
				),
			);

		return { success: true };
	}),
});
