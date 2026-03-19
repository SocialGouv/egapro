import { and, eq } from "drizzle-orm";

import { jointEvaluationUploadSchema } from "~/modules/declaration-remuneration/schemas";
import { companyProcedure, createTRPCRouter } from "~/server/api/trpc";
import { jointEvaluationFiles } from "~/server/db/schema";

function getCurrentYear() {
	return new Date().getFullYear();
}

export const jointEvaluationRouter = createTRPCRouter({
	uploadFile: companyProcedure
		.input(jointEvaluationUploadSchema)
		.mutation(async ({ ctx, input }) => {
			const year = getCurrentYear();
			const declarantId = ctx.session.user.id;

			// Upsert: one file per company/year — any declarant of the company can replace it
			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(jointEvaluationFiles)
					.where(
						and(
							eq(jointEvaluationFiles.siren, ctx.siren),
							eq(jointEvaluationFiles.year, year),
						),
					);

				await tx.insert(jointEvaluationFiles).values({
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
					eq(jointEvaluationFiles.siren, ctx.siren),
					eq(jointEvaluationFiles.year, year),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}),
});
