import { and, eq } from "drizzle-orm";
import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { files } from "~/server/db/schema";

export const jointEvaluationRouter = createTRPCRouter({
	getFile: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				id: files.id,
				fileName: files.fileName,
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
