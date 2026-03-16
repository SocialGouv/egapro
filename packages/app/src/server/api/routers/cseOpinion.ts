import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import {
	deleteFileSchema,
	saveOpinionsSchema,
	submitFilesSchema,
} from "~/modules/cseOpinion/schemas";
import { getCseYear, getSiren } from "~/server/api/shared/sessionHelpers";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	cseOpinionFileLinks,
	cseOpinionFiles,
	cseOpinions,
} from "~/server/db/schema";
import { deleteFile } from "~/server/services/s3";

export const cseOpinionRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);
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
			.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

		return { opinions: rows };
	}),

	saveOpinions: protectedProcedure
		.input(saveOpinionsSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);
			const year = getCseYear();
			const declarantId = ctx.session.user.id;

			await ctx.db.transaction(async (tx) => {
				// Delete existing opinions for this siren/year
				await tx
					.delete(cseOpinions)
					.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

				const rows: (typeof cseOpinions.$inferInsert)[] = [];

				// First declaration — accuracy
				rows.push({
					siren,
					year,
					declarationNumber: 1,
					type: "accuracy",
					opinion: input.firstDeclaration.accuracyOpinion,
					opinionDate: input.firstDeclaration.accuracyDate,
					declarantId,
				});

				// First declaration — gap
				rows.push({
					siren,
					year,
					declarationNumber: 1,
					type: "gap",
					gapConsulted: input.firstDeclaration.gapConsulted,
					opinion: input.firstDeclaration.gapOpinion,
					opinionDate: input.firstDeclaration.gapDate,
					declarantId,
				});

				// Second declaration — accuracy
				rows.push({
					siren,
					year,
					declarationNumber: 2,
					type: "accuracy",
					opinion: input.secondDeclaration.accuracyOpinion,
					opinionDate: input.secondDeclaration.accuracyDate,
					declarantId,
				});

				// Second declaration — gap
				rows.push({
					siren,
					year,
					declarationNumber: 2,
					type: "gap",
					gapConsulted: input.secondDeclaration.gapConsulted,
					opinion: input.secondDeclaration.gapOpinion,
					opinionDate: input.secondDeclaration.gapDate,
					declarantId,
				});

				await tx.insert(cseOpinions).values(rows);
			});

			return { success: true };
		}),

	getFiles: protectedProcedure.query(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);
		const year = getCseYear();

		const rows = await ctx.db
			.select({
				id: cseOpinionFiles.id,
				fileName: cseOpinionFiles.fileName,
				fileSize: cseOpinionFiles.fileSize,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(
				and(eq(cseOpinionFiles.siren, siren), eq(cseOpinionFiles.year, year)),
			);

		return { files: rows };
	}),

	deleteFile: protectedProcedure
		.input(deleteFileSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);

			const [file] = await ctx.db
				.select({
					id: cseOpinionFiles.id,
					filePath: cseOpinionFiles.filePath,
				})
				.from(cseOpinionFiles)
				.where(
					and(
						eq(cseOpinionFiles.id, input.fileId),
						eq(cseOpinionFiles.siren, siren),
					),
				);

			if (!file) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Fichier introuvable",
				});
			}

			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(cseOpinionFileLinks)
					.where(eq(cseOpinionFileLinks.fileId, file.id));
				await tx.delete(cseOpinionFiles).where(eq(cseOpinionFiles.id, file.id));
			});

			await deleteFile(file.filePath);

			return { success: true };
		}),

	submitFiles: protectedProcedure
		.input(submitFilesSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);
			const year = getCseYear();

			// Verify all files belong to this siren/year
			const files = await ctx.db
				.select({ id: cseOpinionFiles.id })
				.from(cseOpinionFiles)
				.where(
					and(eq(cseOpinionFiles.siren, siren), eq(cseOpinionFiles.year, year)),
				);

			const ownedFileIds = new Set(files.map((f) => f.id));
			const allOwned = input.fileIds.every((id) => ownedFileIds.has(id));

			if (!allOwned) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Certains fichiers ne vous appartiennent pas",
				});
			}

			// Get opinions for this siren/year to link files
			const opinions = await ctx.db
				.select({ id: cseOpinions.id })
				.from(cseOpinions)
				.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

			if (opinions.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Aucun avis CSE trouvé pour cette période",
				});
			}

			await ctx.db.transaction(async (tx) => {
				// Clear existing file links for these opinions
				for (const opinion of opinions) {
					await tx
						.delete(cseOpinionFileLinks)
						.where(eq(cseOpinionFileLinks.opinionId, opinion.id));
				}

				// Create new links: each file linked to each opinion
				const links: (typeof cseOpinionFileLinks.$inferInsert)[] = [];
				for (const fileId of input.fileIds) {
					for (const opinion of opinions) {
						links.push({ fileId, opinionId: opinion.id });
					}
				}

				if (links.length > 0) {
					await tx.insert(cseOpinionFileLinks).values(links);
				}
			});

			return { success: true };
		}),
});
