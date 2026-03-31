import { eq } from "drizzle-orm";
import { jointEvaluationUploadSchema } from "~/modules/declaration-remuneration/schemas";
import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { jointEvaluationFiles } from "~/server/db/schema";

export const jointEvaluationRouter = createTRPCRouter({
	uploadFile: declarationProcedure
		.input(jointEvaluationUploadSchema)
		.mutation(async ({ ctx, input }) => {
			// Upsert: one file per declaration — any declarant of the company can replace it
			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(jointEvaluationFiles)
					.where(eq(jointEvaluationFiles.declarationId, ctx.declarationId));

				await tx.insert(jointEvaluationFiles).values({
					declarationId: ctx.declarationId,
					fileName: input.fileName,
					filePath: input.filePath,
				});
			});

			return { success: true };
		}),

	getFile: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				fileName: jointEvaluationFiles.fileName,
				filePath: jointEvaluationFiles.filePath,
				uploadedAt: jointEvaluationFiles.uploadedAt,
			})
			.from(jointEvaluationFiles)
			.where(eq(jointEvaluationFiles.declarationId, ctx.declarationId))
			.limit(1);

		return rows[0] ?? null;
	}),
});
