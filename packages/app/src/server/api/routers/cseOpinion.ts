import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
} from "~/modules/cseOpinion/schemas";
import { getCurrentYear } from "~/modules/domain";
import { sendReceipt } from "~/modules/mail";
import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { cseOpinions, files } from "~/server/db/schema";
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

			const email = ctx.session.user.email;
			if (email) {
				await sendReceipt({
					kind: "cseOpinion",
					to: email,
					siren: ctx.siren,
					year: getCurrentYear(),
					userId: ctx.session.user.id,
					isResend: false,
				});
			}

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

	deleteFile: declarationProcedure
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
