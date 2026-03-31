import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
	uploadFileSchema,
} from "~/modules/cseOpinion/schemas";
import { MAX_CSE_FILES } from "~/modules/cseOpinion/types";
import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { cseOpinionFiles, cseOpinions } from "~/server/db/schema";
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

	saveOpinions: declarationProcedure
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
				id: cseOpinionFiles.id,
				fileName: cseOpinionFiles.fileName,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(eq(cseOpinionFiles.declarationId, ctx.declarationId));

		return { files: rows };
	}),

	uploadFile: declarationProcedure
		.input(uploadFileSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				const existingFiles = await tx
					.select({ id: cseOpinionFiles.id })
					.from(cseOpinionFiles)
					.where(eq(cseOpinionFiles.declarationId, ctx.declarationId));

				if (existingFiles.length >= MAX_CSE_FILES) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Nombre maximum de fichiers atteint (${MAX_CSE_FILES}).`,
					});
				}

				await tx.insert(cseOpinionFiles).values({
					declarationId: ctx.declarationId,
					fileName: input.fileName,
					filePath: input.filePath,
				});
			});

			return { success: true };
		}),

	deleteFile: declarationProcedure
		.input(deleteFileSchema)
		.mutation(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({ filePath: cseOpinionFiles.filePath })
				.from(cseOpinionFiles)
				.where(
					and(
						eq(cseOpinionFiles.id, input.fileId),
						eq(cseOpinionFiles.declarationId, ctx.declarationId),
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
				.delete(cseOpinionFiles)
				.where(
					and(
						eq(cseOpinionFiles.id, input.fileId),
						eq(cseOpinionFiles.declarationId, ctx.declarationId),
					),
				);

			await deleteS3File(file.filePath);

			return { success: true };
		}),
});
