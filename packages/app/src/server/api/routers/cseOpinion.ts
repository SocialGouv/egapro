import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
	setFileContentTypesSchema,
} from "~/modules/cseOpinion/schemas";
import {
	createTRPCRouter,
	declarationProcedure,
	declarationWriteProcedure,
} from "~/server/api/trpc";
import {
	cseOpinionFiles,
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

	getFileContentTypes: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				declarationNumber: cseOpinionFiles.declarationNumber,
				type: cseOpinionFiles.type,
				fileId: cseOpinionFiles.fileId,
			})
			.from(cseOpinionFiles)
			.where(eq(cseOpinionFiles.declarationId, ctx.declarationId));

		return { associations: rows };
	}),

	setFileContentTypes: declarationWriteProcedure
		.input(setFileContentTypesSchema)
		.mutation(async ({ ctx, input }) => {
			const { associations } = input;

			const keys = associations.map((a) => `${a.declarationNumber}:${a.type}`);
			const uniqueKeys = new Set(keys);
			if (uniqueKeys.size !== keys.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Chaque couple (numéro de déclaration, type) ne peut être associé qu'à un seul fichier.",
				});
			}

			if (associations.length > 0) {
				const fileIds = [...new Set(associations.map((a) => a.fileId))];
				const validFiles = await ctx.db
					.select({ id: files.id })
					.from(files)
					.where(
						and(
							eq(files.declarationId, ctx.declarationId),
							eq(files.type, "cse_opinion"),
							inArray(files.id, fileIds),
						),
					);

				if (validFiles.length !== fileIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Un ou plusieurs fichiers sont introuvables ou invalides pour cette déclaration.",
					});
				}
			}

			await ctx.db.transaction(async (tx) => {
				await tx
					.delete(cseOpinionFiles)
					.where(eq(cseOpinionFiles.declarationId, ctx.declarationId));

				if (associations.length > 0) {
					await tx.insert(cseOpinionFiles).values(
						associations.map((a) => ({
							declarationId: ctx.declarationId,
							declarationNumber: a.declarationNumber,
							type: a.type,
							fileId: a.fileId,
						})),
					);
				}
			});

			return { success: true };
		}),

	finalize: declarationWriteProcedure.mutation(async ({ ctx }) => {
		const [opinionCount, fileCount, declarationRow, existingAssociations] =
			await Promise.all([
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
				ctx.db
					.select({
						declarationNumber: cseOpinionFiles.declarationNumber,
						type: cseOpinionFiles.type,
					})
					.from(cseOpinionFiles)
					.where(eq(cseOpinionFiles.declarationId, ctx.declarationId)),
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

		const opinions = await ctx.db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(eq(cseOpinions.declarationId, ctx.declarationId));

		const hasSecondDeclaration = declaration.secondDeclarationStep !== null;

		const gapConsultedFirst = opinions.find(
			(o) => o.declarationNumber === 1 && o.type === "gap",
		)?.gapConsulted;
		const gapConsultedSecond = opinions.find(
			(o) => o.declarationNumber === 2 && o.type === "gap",
		)?.gapConsulted;

		type RequiredType = { declarationNumber: number; type: string };
		const requiredTypes: RequiredType[] = [
			{ declarationNumber: 1, type: "accuracy" },
		];
		if (gapConsultedFirst === true) {
			requiredTypes.push({ declarationNumber: 1, type: "gap" });
		}
		if (hasSecondDeclaration) {
			requiredTypes.push({ declarationNumber: 2, type: "accuracy" });
			if (gapConsultedSecond === true) {
				requiredTypes.push({ declarationNumber: 2, type: "gap" });
			}
		}

		const coveredKeys = new Set(
			existingAssociations.map((a) => `${a.declarationNumber}:${a.type}`),
		);

		for (const required of requiredTypes) {
			const key = `${required.declarationNumber}:${required.type}`;
			if (!coveredKeys.has(key)) {
				const typeLabel =
					required.type === "accuracy" ? "Exactitude" : "Justification";
				const declLabel =
					required.declarationNumber === 1
						? "première déclaration"
						: "deuxième déclaration";
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Le type de contenu « ${typeLabel} » de la ${declLabel} doit être associé à un fichier avant validation.`,
				});
			}
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

			const [declRow] = await tx
				.select()
				.from(declarations)
				.where(eq(declarations.id, ctx.declarationId))
				.limit(1);

			if (declRow?.draft) {
				const current = declRow.draft as Record<string, unknown>;
				const { cse: _removed, ...remaining } = current;
				const isEmpty = Object.keys(remaining).length === 0;
				await tx
					.update(declarations)
					.set({
						draft: isEmpty ? null : remaining,
						draftUpdatedAt: isEmpty ? null : new Date(),
					})
					.where(eq(declarations.id, ctx.declarationId));
			}
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
