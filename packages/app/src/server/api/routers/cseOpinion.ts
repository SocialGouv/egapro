import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { saveOpinionsSchema } from "~/modules/cseOpinion/schemas";
import { companyProcedure, createTRPCRouter } from "~/server/api/trpc";
import { cseOpinionFiles, cseOpinions } from "~/server/db/schema";

function getCseYear() {
	return new Date().getFullYear() + 1;
}

export const cseOpinionRouter = createTRPCRouter({
	get: companyProcedure.query(async ({ ctx }) => {
		const year = getCseYear();

		const rows = await ctx.db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				opinion: cseOpinions.opinion,
				opinionDate: cseOpinions.opinionDate,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(and(eq(cseOpinions.siren, ctx.siren), eq(cseOpinions.year, year)));

		return { opinions: rows };
	}),

	saveOpinions: companyProcedure
		.input(saveOpinionsSchema)
		.mutation(async ({ ctx, input }) => {
			const year = getCseYear();
			const declarantId = ctx.session.user.id;

			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(cseOpinions)
					.where(
						and(eq(cseOpinions.siren, ctx.siren), eq(cseOpinions.year, year)),
					);

				const rows: (typeof cseOpinions.$inferInsert)[] = [];

				rows.push({
					siren: ctx.siren,
					year,
					declarationNumber: 1,
					type: "accuracy",
					opinion: input.firstDeclaration.accuracyOpinion,
					opinionDate: input.firstDeclaration.accuracyDate,
					declarantId,
				});

				rows.push({
					siren: ctx.siren,
					year,
					declarationNumber: 1,
					type: "gap",
					gapConsulted: input.firstDeclaration.gapConsulted,
					opinion: input.firstDeclaration.gapOpinion,
					opinionDate: input.firstDeclaration.gapDate,
					declarantId,
				});

				if (input.secondDeclaration) {
					rows.push({
						siren: ctx.siren,
						year,
						declarationNumber: 2,
						type: "accuracy",
						opinion: input.secondDeclaration.accuracyOpinion,
						opinionDate: input.secondDeclaration.accuracyDate,
						declarantId,
					});

					rows.push({
						siren: ctx.siren,
						year,
						declarationNumber: 2,
						type: "gap",
						gapConsulted: input.secondDeclaration.gapConsulted,
						opinion: input.secondDeclaration.gapOpinion,
						opinionDate: input.secondDeclaration.gapDate,
						declarantId,
					});
				}

				await tx.insert(cseOpinions).values(rows);
			});

			return { success: true };
		}),

	uploadFile: companyProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				filePath: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const year = getCseYear();
			const declarantId = ctx.session.user.id;

			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(cseOpinionFiles)
					.where(
						and(
							eq(cseOpinionFiles.siren, ctx.siren),
							eq(cseOpinionFiles.year, year),
						),
					);

				await tx.insert(cseOpinionFiles).values({
					siren: ctx.siren,
					year,
					fileName: input.fileName,
					filePath: input.filePath,
					declarantId,
				});
			});

			return { success: true };
		}),

	getFile: companyProcedure.query(async ({ ctx }) => {
		const year = getCseYear();

		const rows = await ctx.db
			.select({
				fileName: cseOpinionFiles.fileName,
				filePath: cseOpinionFiles.filePath,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(
				and(
					eq(cseOpinionFiles.siren, ctx.siren),
					eq(cseOpinionFiles.year, year),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}),
});
