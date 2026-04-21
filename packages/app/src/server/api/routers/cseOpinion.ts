import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
} from "~/modules/cseOpinion/schemas";
import {
	createTRPCRouter,
	declarationProcedure,
	declarationWriteProcedure,
} from "~/server/api/trpc";
import { cseOpinions, declarations, files } from "~/server/db/schema";
import { deleteFile as deleteS3File } from "~/server/services/s3";

export const cseOpinionRouter = createTRPCRouter({
	get: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				opinion: cseOpinions.opinion,
				opinionDate: cseOpinions.opinionDate,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(eq(cseOpinions.declarationId, ctx.declarationId));

		return { opinions: rows };
	}),

	saveOpinions: declarationWriteProcedure
		.input(saveOpinionsSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(cseOpinions)
					.where(eq(cseOpinions.declarationId, ctx.declarationId));

				const rows: (typeof cseOpinions.$inferInsert)[] = [];

				rows.push({
					declarationId: ctx.declarationId,
					declarationNumber: 1,
					type: "accuracy",
					opinion: input.firstDeclaration.accuracyOpinion,
					opinionDate: input.firstDeclaration.accuracyDate,
				});

				rows.push({
					declarationId: ctx.declarationId,
					declarationNumber: 1,
					type: "gap",
					gapConsulted: input.firstDeclaration.gapConsulted,
					opinion: input.firstDeclaration.gapOpinion,
					opinionDate: input.firstDeclaration.gapDate,
				});

				if (input.secondDeclaration) {
					rows.push({
						declarationId: ctx.declarationId,
						declarationNumber: 2,
						type: "accuracy",
						opinion: input.secondDeclaration.accuracyOpinion,
						opinionDate: input.secondDeclaration.accuracyDate,
					});

					rows.push({
						declarationId: ctx.declarationId,
						declarationNumber: 2,
						type: "gap",
						gapConsulted: input.secondDeclaration.gapConsulted,
						opinion: input.secondDeclaration.gapOpinion,
						opinionDate: input.secondDeclaration.gapDate,
					});
				}

				await tx.insert(cseOpinions).values(rows);
			});

			return { success: true };
		}),

	getFiles: declarationProcedure.query(async ({ ctx }) => {
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
					eq(files.type, "cse_opinion"),
				),
			);

		return { files: rows };
	}),

	finalize: declarationWriteProcedure.mutation(async ({ ctx }) => {
		const [opinionCount, fileCount] = await Promise.all([
			ctx.db
				.select({ count: sql<number>`count(*)::int` })
				.from(cseOpinions)
				.where(eq(cseOpinions.declarationId, ctx.declarationId)),
			ctx.db
				.select({ count: sql<number>`count(*)::int` })
				.from(files)
				.where(
					and(
						eq(files.declarationId, ctx.declarationId),
						eq(files.type, "cse_opinion"),
					),
				),
		]);

		if ((opinionCount[0]?.count ?? 0) === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Les avis du CSE doivent être renseignés avant validation.",
			});
		}
		if ((fileCount[0]?.count ?? 0) === 0) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Au moins un fichier d'avis CSE doit être transmis.",
			});
		}

		const now = new Date();
		// Idempotent: only sets cseOpinionCompletedAt the first time.
		await ctx.db
			.update(declarations)
			.set({ cseOpinionCompletedAt: now, updatedAt: now })
			.where(
				and(
					eq(declarations.id, ctx.declarationId),
					isNull(declarations.cseOpinionCompletedAt),
				),
			);

		return { success: true };
	}),

	deleteFile: declarationWriteProcedure
		.input(deleteFileSchema)
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({ filePath: files.filePath })
				.from(files)
				.where(
					and(
						eq(files.id, input.fileId),
						eq(files.declarationId, ctx.declarationId),
						eq(files.type, "cse_opinion"),
					),
				)
				.limit(1);

			const file = rows[0];
			if (!file) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Fichier introuvable.",
				});
			}

			await ctx.db
				.delete(files)
				.where(
					and(
						eq(files.id, input.fileId),
						eq(files.declarationId, ctx.declarationId),
						eq(files.type, "cse_opinion"),
					),
				);

			await deleteS3File(file.filePath);

			return { success: true };
		}),
});
