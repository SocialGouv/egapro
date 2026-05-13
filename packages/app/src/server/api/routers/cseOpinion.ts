import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
} from "~/modules/cseOpinion/schemas";
import {
	createTRPCRouter,
	declarationProcedure,
	declarationWriteProcedure,
} from "~/server/api/trpc";
import {
	cseOpinions,
	declarationStatusHistory,
	declarations,
	files,
} from "~/server/db/schema";
import { applyAction, loadRules } from "~/server/rules/engine";
import { deleteFile as deleteS3File } from "~/server/services/s3";
import {
	buildHistoryInserts,
	computeProjectionUpdates,
} from "./statusHistoryHelpers";

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
		const [opinionCount, fileCount, declarationRow] = await Promise.all([
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
			ctx.db
				.select()
				.from(declarations)
				.where(eq(declarations.id, ctx.declarationId))
				.limit(1),
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

		const declaration = declarationRow[0];
		if (!declaration) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Déclaration introuvable",
			});
		}

		const rules = loadRules(declaration.rulesVersion);
		const facts = { currentState: declaration.status };
		const { nextStatus, events } = applyAction(
			facts,
			"submit_cse_opinion",
			rules,
		);

		const projection = computeProjectionUpdates(events, nextStatus);
		const historyInserts = buildHistoryInserts(
			ctx.declarationId,
			events,
			ctx.session.user.id,
		);

		await ctx.db.transaction(async (tx) => {
			await tx.insert(declarationStatusHistory).values(historyInserts);
			await tx
				.update(declarations)
				.set({ ...projection, updatedAt: new Date() })
				.where(eq(declarations.id, ctx.declarationId));
		});

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
