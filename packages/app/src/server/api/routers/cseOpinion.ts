import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
	uploadFileSchema,
} from "~/modules/cseOpinion/schemas";
import { MAX_CSE_FILES } from "~/modules/cseOpinion/types";
import { getCurrentYear } from "~/modules/domain";
import { companyProcedure, createTRPCRouter } from "~/server/api/trpc";
import { cseOpinionFiles, cseOpinions } from "~/server/db/schema";
import { deleteFile as deleteS3File } from "~/server/services/s3";

export const cseOpinionRouter = createTRPCRouter({
	get: companyProcedure.query(async ({ ctx }) => {
		const year = getCurrentYear();

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
			const year = getCurrentYear();
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

	getFiles: companyProcedure.query(async ({ ctx }) => {
		const year = getCurrentYear();

		const rows = await ctx.db
			.select({
				id: cseOpinionFiles.id,
				fileName: cseOpinionFiles.fileName,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(
				and(
					eq(cseOpinionFiles.siren, ctx.siren),
					eq(cseOpinionFiles.year, year),
				),
			);

		return { files: rows };
	}),

	uploadFile: companyProcedure
		.input(uploadFileSchema)
		.mutation(async ({ ctx, input }) => {
			const year = getCurrentYear();
			const declarantId = ctx.session.user.id;

			await ctx.db.transaction(async (tx) => {
				const existingFiles = await tx
					.select({ id: cseOpinionFiles.id })
					.from(cseOpinionFiles)
					.where(
						and(
							eq(cseOpinionFiles.siren, ctx.siren),
							eq(cseOpinionFiles.year, year),
						),
					);

				if (existingFiles.length >= MAX_CSE_FILES) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Nombre maximum de fichiers atteint (${MAX_CSE_FILES}).`,
					});
				}

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

	deleteFile: companyProcedure
		.input(deleteFileSchema)
		.mutation(async ({ ctx, input }) => {
			const year = getCurrentYear();

			const rows = await ctx.db
				.select({ filePath: cseOpinionFiles.filePath })
				.from(cseOpinionFiles)
				.where(
					and(
						eq(cseOpinionFiles.id, input.fileId),
						eq(cseOpinionFiles.siren, ctx.siren),
						eq(cseOpinionFiles.year, year),
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
						eq(cseOpinionFiles.siren, ctx.siren),
						eq(cseOpinionFiles.year, year),
					),
				);

			await deleteS3File(file.filePath);

			return { success: true };
		}),
});
