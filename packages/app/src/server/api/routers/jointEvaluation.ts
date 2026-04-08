import { and, eq } from "drizzle-orm";
import { jointEvaluationUploadSchema } from "~/modules/declaration-remuneration/schemas";
import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { files } from "~/server/db/schema";

export const jointEvaluationRouter = createTRPCRouter({
	uploadFile: declarationProcedure
		.input(jointEvaluationUploadSchema)
		.mutation(async ({ ctx, input }) => {
			// Upsert: one file per declaration — any declarant of the company can replace it
			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(files)
					.where(
						and(
							eq(files.declarationId, ctx.declarationId),
							eq(files.type, "joint_evaluation"),
						),
					);

				await tx.insert(files).values({
					declarationId: ctx.declarationId,
					fileName: input.fileName,
					filePath: input.filePath,
					type: "joint_evaluation",
				});
			});

			return { success: true };
		}),

	getFile: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				fileName: files.fileName,
				filePath: files.filePath,
				uploadedAt: files.uploadedAt,
			})
			.from(files)
			.where(
				and(
					eq(files.declarationId, ctx.declarationId),
					eq(files.type, "joint_evaluation"),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}),
});
