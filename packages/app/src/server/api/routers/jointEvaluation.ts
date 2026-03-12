import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { jointEvaluationFiles } from "~/server/db/schema";

function getSiren(siret: string | null | undefined): string {
	if (!siret) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "SIRET manquant dans la session",
		});
	}
	return siret.slice(0, 9);
}

function getCurrentYear() {
	return new Date().getFullYear();
}

export const jointEvaluationRouter = createTRPCRouter({
	uploadFile: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				filePath: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);
			const year = getCurrentYear();
			const declarantId = ctx.session.user.id;

			// Upsert: delete existing file for this siren/year, then insert
			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(jointEvaluationFiles)
					.where(
						and(
							eq(jointEvaluationFiles.siren, siren),
							eq(jointEvaluationFiles.year, year),
						),
					);

				await tx.insert(jointEvaluationFiles).values({
					siren,
					year,
					fileName: input.fileName,
					filePath: input.filePath,
					declarantId,
				});
			});

			return { success: true };
		}),

	getFile: protectedProcedure.query(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);
		const year = getCurrentYear();

		const rows = await ctx.db
			.select({
				fileName: jointEvaluationFiles.fileName,
				filePath: jointEvaluationFiles.filePath,
				uploadedAt: jointEvaluationFiles.uploadedAt,
			})
			.from(jointEvaluationFiles)
			.where(
				and(
					eq(jointEvaluationFiles.siren, siren),
					eq(jointEvaluationFiles.year, year),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}),
});
