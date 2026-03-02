import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { declarationCategories, declarations } from "~/server/db/schema";

function getSiren(siret: string | null | undefined): string {
	if (!siret) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "SIRET manquant dans la session",
		});
	}
	return siret.slice(0, 9);
}

const currentYear = new Date().getFullYear();

export const declarationRouter = createTRPCRouter({
	getOrCreate: protectedProcedure.query(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);

		const existing = await ctx.db
			.select()
			.from(declarations)
			.where(
				and(eq(declarations.siren, siren), eq(declarations.year, currentYear)),
			)
			.limit(1);

		if (existing.length > 0) {
			const categories = await ctx.db
				.select()
				.from(declarationCategories)
				.where(
					and(
						eq(declarationCategories.siren, siren),
						eq(declarationCategories.year, currentYear),
					),
				);
			const declaration = existing[0];
			if (!declaration)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Declaration introuvable",
				});
			return { declaration, categories };
		}

		const newDeclaration = await ctx.db
			.insert(declarations)
			.values({
				siren,
				year: currentYear,
				declarantId: ctx.session.user.id,
				currentStep: 0,
				status: "draft",
			})
			.returning();

		const declaration = newDeclaration[0];
		if (!declaration)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Erreur lors de la création",
			});
		return { declaration, categories: [] };
	}),

	updateStep1: protectedProcedure
		.input(
			z.object({
				categories: z.array(
					z.object({
						name: z.string(),
						women: z.number().int().min(0),
						men: z.number().int().min(0),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);

			const totalWomen = input.categories.reduce((sum, c) => sum + c.women, 0);
			const totalMen = input.categories.reduce((sum, c) => sum + c.men, 0);

			await ctx.db.transaction(async (tx) => {
				// Check if step 1 data changed → reset subsequent steps
				const existing = await tx
					.select()
					.from(declarations)
					.where(
						and(
							eq(declarations.siren, siren),
							eq(declarations.year, currentYear),
						),
					)
					.limit(1);

				const hasChanged =
					existing[0]?.totalWomen !== totalWomen ||
					existing[0]?.totalMen !== totalMen;

				if (hasChanged) {
					// Delete categories for steps 2-5
					await tx
						.delete(declarationCategories)
						.where(
							and(
								eq(declarationCategories.siren, siren),
								eq(declarationCategories.year, currentYear),
							),
						);
				}

				// Update declaration
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
						and(
							eq(declarations.siren, siren),
							eq(declarations.year, currentYear),
						),
					);

				// Upsert step 1 categories
				await tx
					.delete(declarationCategories)
					.where(
						and(
							eq(declarationCategories.siren, siren),
							eq(declarationCategories.year, currentYear),
							eq(declarationCategories.step, 1),
						),
					);

				if (input.categories.length > 0) {
					await tx.insert(declarationCategories).values(
						input.categories.map((c) => ({
							siren,
							year: currentYear,
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

	updateStepCategories: protectedProcedure
		.input(
			z.object({
				step: z.number().int().min(2).max(5),
				categories: z.array(
					z.object({
						name: z.string(),
						womenCount: z.number().int().min(0).optional(),
						menCount: z.number().int().min(0).optional(),
						womenValue: z.string().optional(),
						menValue: z.string().optional(),
						womenMedianValue: z.string().optional(),
						menMedianValue: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);

			await ctx.db.transaction(async (tx) => {
				// Delete existing categories for this step
				await tx
					.delete(declarationCategories)
					.where(
						and(
							eq(declarationCategories.siren, siren),
							eq(declarationCategories.year, currentYear),
							eq(declarationCategories.step, input.step),
						),
					);

				if (input.categories.length > 0) {
					await tx.insert(declarationCategories).values(
						input.categories.map((c) => ({
							siren,
							year: currentYear,
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
						and(
							eq(declarations.siren, siren),
							eq(declarations.year, currentYear),
						),
					);
			});

			return { success: true };
		}),

	submit: protectedProcedure.mutation(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);

		await ctx.db
			.update(declarations)
			.set({
				status: "submitted",
				currentStep: 6,
				updatedAt: new Date(),
			})
			.where(
				and(eq(declarations.siren, siren), eq(declarations.year, currentYear)),
			);

		return { success: true };
	}),
});
