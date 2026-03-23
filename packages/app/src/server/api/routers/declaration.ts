import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
	saveCompliancePathSchema,
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
	updateStepCategoriesSchema,
} from "~/modules/declaration-remuneration/schemas";
import { mapGipToFormData } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import { getCurrentYear } from "~/modules/domain";
import { companyProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	declarationCategories,
	declarations,
	employeeCategories,
	gipMdsData,
	jobCategories,
} from "~/server/db/schema";
import {
	buildEmployeeCategoryValues,
	deleteJobAndEmployeeCategories,
	fetchAllCategories,
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
					...(await fetchAllCategories(tx, siren, year, declaration.id)),
				};
			}

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
					...(await fetchAllCategories(tx, siren, year, declaration.id)),
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
				categories: [],
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

		return {
			...result,
			gipPrefillData,
		};
	}),

	updateStep1: companyProcedure
		.input(updateStep1Schema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			const totalWomen = input.categories.reduce((sum, c) => sum + c.women, 0);
			const totalMen = input.categories.reduce((sum, c) => sum + c.men, 0);

			await ctx.db.transaction(async (tx) => {
				const existing = await tx
					.select()
					.from(declarations)
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					)
					.limit(1);

				const hasChanged =
					existing[0]?.totalWomen !== totalWomen ||
					existing[0]?.totalMen !== totalMen;

				if (hasChanged) {
					await tx
						.delete(declarationCategories)
						.where(
							and(
								eq(declarationCategories.siren, siren),
								eq(declarationCategories.year, year),
							),
						);

					const declarationId = existing[0]?.id;
					if (declarationId) {
						await deleteJobAndEmployeeCategories(tx, declarationId);
					}
				}

				await tx
					.update(declarations)
					.set({
						totalWomen,
						totalMen,
						currentStep: 1,
						updatedAt: new Date(),
						...(hasChanged
							? {
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

				// Upsert step 1 categories
				await tx
					.delete(declarationCategories)
					.where(
						and(
							eq(declarationCategories.siren, siren),
							eq(declarationCategories.year, year),
							eq(declarationCategories.step, 1),
						),
					);

				if (input.categories.length > 0) {
					await tx.insert(declarationCategories).values(
						input.categories.map((c) => ({
							siren,
							year,
							step: 1,
							categoryName: c.name,
							womenCount: c.women,
							menCount: c.men,
						})),
					);
				}
			});

			return { success: true };
		}),

	updateStepCategories: companyProcedure
		.input(updateStepCategoriesSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = ctx.siren;
			const year = getCurrentYear();

			await ctx.db.transaction(async (tx) => {
				// Delete existing categories for this step
				await tx
					.delete(declarationCategories)
					.where(
						and(
							eq(declarationCategories.siren, siren),
							eq(declarationCategories.year, year),
							eq(declarationCategories.step, input.step),
						),
					);

				if (input.categories.length > 0) {
					await tx.insert(declarationCategories).values(
						input.categories.map((c) => ({
							siren,
							year,
							step: input.step,
							categoryName: c.name,
							womenCount: c.womenCount ?? null,
							menCount: c.menCount ?? null,
							womenValue: c.womenValue || null,
							menValue: c.menValue || null,
							womenMedianValue: c.womenMedianValue || null,
							menMedianValue: c.menMedianValue || null,
						})),
					);
				}

				// Update current step
				await tx
					.update(declarations)
					.set({
						currentStep: input.step,
						updatedAt: new Date(),
					})
					.where(
						and(eq(declarations.siren, siren), eq(declarations.year, year)),
					);
			});

			return { success: true };
		}),

	updateEmployeeCategories: companyProcedure
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
								detail: cat.detail || null,
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

	submitSecondDeclaration: companyProcedure.mutation(async ({ ctx }) => {
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

		return { success: true };
	}),

	submit: companyProcedure.mutation(async ({ ctx }) => {
		const siren = ctx.siren;
		const year = getCurrentYear();

		await ctx.db
			.update(declarations)
			.set({
				status: "submitted",
				currentStep: 6,
				updatedAt: new Date(),
			})
			.where(and(eq(declarations.siren, siren), eq(declarations.year, year)));

		return { success: true };
	}),

	saveCompliancePath: companyProcedure
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

	completeCompliancePath: companyProcedure.mutation(async ({ ctx }) => {
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
