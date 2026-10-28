import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
	deleteFileSchema,
	saveOpinionsSchema,
	setFileContentTypesSchema,
} from "~/modules/cseOpinion/schemas";
import { getCurrentYear } from "~/modules/domain";
import {
	createTRPCRouter,
	declarationProcedure,
	declarationWriteProcedure,
} from "~/server/api/trpc";
import {
	companies,
	cseOpinionFiles,
	cseOpinions,
	declarationStatusHistory,
	declarations,
	files,
	users,
} from "~/server/db/schema";
import { loadRules } from "~/server/rules/engine";
import {
	contentTypeKey,
	getRequiredContentTypes,
	pruneStaleContentTypeAssociations,
} from "~/server/services/cseRequiredContentTypes";
import { deleteFile as deleteS3File, getFileSize } from "~/server/services/s3";
import { findJointEvaluationFile } from "./declarationHelpers";
import {
	applyActionOrRefuse,
	buildHistoryInserts,
	computeProjectionUpdates,
	lockAndReadDeclaration,
	lockDeclaration,
} from "./statusHistoryHelpers";

const CSE_OPINION_UNAVAILABLE_ERROR =
	"Les avis du CSE ne peuvent pas être transmis à cette étape de la démarche.";

function assertRequiredContentTypesCovered(
	requiredTypes: Awaited<ReturnType<typeof getRequiredContentTypes>>,
	associations: Array<{ declarationNumber: number; type: string }>,
) {
	const coveredKeys = new Set(
		associations.map((association) =>
			contentTypeKey(association.declarationNumber, association.type),
		),
	);
	for (const required of requiredTypes) {
		const key = contentTypeKey(required.declarationNumber, required.type);
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
}

export const cseOpinionRouter = createTRPCRouter({
	getSubmittedView: declarationProcedure.query(async ({ ctx }) => {
		// The revision marker and mutable opinion/file rows must come from one
		// snapshot: a concurrent edit commits marker + content atomically.
		return ctx.db.transaction(
			async (tx) => {
				const [submission] = await tx
					.select({ createdAt: declarationStatusHistory.createdAt })
					.from(declarationStatusHistory)
					.where(
						and(
							eq(declarationStatusHistory.declarationId, ctx.declarationId),
							eq(declarationStatusHistory.eventType, "cse_opinion_submit"),
						),
					)
					.orderBy(desc(declarationStatusHistory.createdAt))
					.limit(1);

				if (!submission) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Aucun avis du CSE transmis pour cette déclaration.",
					});
				}

				const [identity] = await tx
					.select({
						companyName: companies.name,
						siren: companies.siren,
						declarationYear: declarations.year,
						declarantFirstName: users.firstName,
						declarantLastName: users.lastName,
						declarantEmail: users.email,
						declarantPhone: users.phone,
						secondDeclReferencePeriodStart:
							declarations.secondDeclReferencePeriodStart,
						secondDeclReferencePeriodEnd:
							declarations.secondDeclReferencePeriodEnd,
						cseOpinionDraftUpdatedAt: declarations.cseOpinionDraftUpdatedAt,
					})
					.from(declarations)
					.innerJoin(companies, eq(declarations.siren, companies.siren))
					.innerJoin(users, eq(declarations.declarantId, users.id))
					.where(eq(declarations.id, ctx.declarationId))
					.limit(1);

				if (!identity) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}
				if (identity.cseOpinionDraftUpdatedAt) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Les avis du CSE ont été modifiés depuis leur dernière transmission.",
					});
				}
				const [jointSubmission] = await tx
					.select({ createdAt: declarationStatusHistory.createdAt })
					.from(declarationStatusHistory)
					.where(
						and(
							eq(declarationStatusHistory.declarationId, ctx.declarationId),
							eq(declarationStatusHistory.eventType, "joint_evaluation_submit"),
						),
					)
					.orderBy(desc(declarationStatusHistory.createdAt))
					.limit(1);
				const jointFile = jointSubmission
					? await findJointEvaluationFile(tx, ctx.declarationId)
					: null;
				const hasSubmittedJointEvaluation = Boolean(
					jointSubmission &&
						jointFile &&
						jointFile.uploadedAt <= jointSubmission.createdAt,
				);

				const [opinions, associations, secondSubmissions] = await Promise.all([
					tx
						.select({
							declarationNumber: cseOpinions.declarationNumber,
							type: cseOpinions.type,
							gapConsulted: cseOpinions.gapConsulted,
							opinion: cseOpinions.opinion,
							opinionDate: cseOpinions.opinionDate,
						})
						.from(cseOpinions)
						.where(eq(cseOpinions.declarationId, ctx.declarationId)),
					tx
						.select({
							declarationNumber: cseOpinionFiles.declarationNumber,
							type: cseOpinionFiles.type,
							fileId: files.id,
							fileName: files.fileName,
							uploadedAt: files.uploadedAt,
						})
						.from(cseOpinionFiles)
						.innerJoin(
							files,
							and(
								eq(cseOpinionFiles.fileId, files.id),
								eq(files.declarationId, ctx.declarationId),
								eq(files.type, "cse_opinion"),
							),
						)
						.where(eq(cseOpinionFiles.declarationId, ctx.declarationId)),
					tx
						.select({ id: declarationStatusHistory.id })
						.from(declarationStatusHistory)
						.where(
							and(
								eq(declarationStatusHistory.declarationId, ctx.declarationId),
								eq(
									declarationStatusHistory.eventType,
									"second_declaration_submit",
								),
							),
						)
						.limit(1),
				]);

				const {
					cseOpinionDraftUpdatedAt: _draftRevision,
					...submittedIdentity
				} = identity;
				return {
					...submittedIdentity,
					submittedAt: submission.createdAt,
					opinions,
					associations,
					hasSubmittedSecondDeclaration: secondSubmissions.length > 0,
					hasSubmittedJointEvaluation,
				};
			},
			{ isolationLevel: "repeatable read" },
		);
	}),

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
				await lockDeclaration(tx, ctx.declarationId);
				await tx
					.update(declarations)
					.set({ cseOpinionDraftUpdatedAt: new Date() })
					.where(eq(declarations.id, ctx.declarationId));
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
				await pruneStaleContentTypeAssociations(tx, ctx.declarationId);
			});

			return { success: true };
		}),

	getFiles: declarationProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				id: files.id,
				fileName: files.fileName,
				filePath: files.filePath,
				uploadedAt: files.uploadedAt,
			})
			.from(files)
			.where(
				and(
					eq(files.declarationId, ctx.declarationId),
					eq(files.type, "cse_opinion"),
				),
			);

		// Object size is not persisted on the file row; read it from S3 (best
		// effort, in parallel). A failed HEAD yields a null size, never a 500.
		const filesWithSize = await Promise.all(
			rows.map(async ({ filePath, ...file }) => ({
				...file,
				fileSize: await getFileSize(filePath),
			})),
		);

		return { files: filesWithSize };
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

			const keys = associations.map((a) =>
				contentTypeKey(a.declarationNumber, a.type),
			);
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
				await lockDeclaration(tx, ctx.declarationId);
				await tx
					.update(declarations)
					.set({ cseOpinionDraftUpdatedAt: new Date() })
					.where(eq(declarations.id, ctx.declarationId));
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
		await ctx.db.transaction(async (tx) => {
			const declaration = await lockAndReadDeclaration(
				tx,
				ctx.declarationId,
				ctx.siren,
				getCurrentYear(),
			);
			const [opinionCount, fileRows, existingAssociations] = await Promise.all([
				tx
					.select({ count: sql<number>`count(*)::int` })
					.from(cseOpinions)
					.where(eq(cseOpinions.declarationId, ctx.declarationId)),
				tx
					.select({ id: files.id, fileName: files.fileName })
					.from(files)
					.where(
						and(
							eq(files.declarationId, ctx.declarationId),
							eq(files.type, "cse_opinion"),
						),
					),
				tx
					.select({
						declarationNumber: cseOpinionFiles.declarationNumber,
						type: cseOpinionFiles.type,
						fileId: cseOpinionFiles.fileId,
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
			if (fileRows.length === 0) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Au moins un fichier d'avis CSE doit être transmis.",
				});
			}

			const requiredTypes = await getRequiredContentTypes(
				tx,
				ctx.declarationId,
			);

			assertRequiredContentTypesCovered(requiredTypes, existingAssociations);

			// Every uploaded file must carry at least one content type: a file row left
			// with no checkbox checked is an orphan and blocks finalize. Checked after
			// the required-type guard so a fully-empty matrix reports the missing type
			// first.
			const associatedFileIds = new Set(
				existingAssociations.map((association) => association.fileId),
			);
			const orphanFile = fileRows.find(
				(file) => !associatedFileIds.has(file.id),
			);
			if (orphanFile) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Le fichier « ${orphanFile.fileName} » n'est associé à aucun type de contenu. Cochez au moins un type, ou supprimez le fichier.`,
				});
			}

			const { nextStatus, events } = applyActionOrRefuse(
				{ currentState: declaration.status },
				"submit_cse_opinion",
				loadRules(declaration.rulesVersion),
				CSE_OPINION_UNAVAILABLE_ERROR,
			);

			await tx
				.insert(declarationStatusHistory)
				.values(
					buildHistoryInserts(ctx.declarationId, events, ctx.session.user.id),
				);
			await tx
				.update(declarations)
				.set({
					...computeProjectionUpdates(events, nextStatus),
					cseOpinionDraftUpdatedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(declarations.id, ctx.declarationId));

			if (declaration.draft) {
				const current = declaration.draft as Record<string, unknown>;
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

		const email = ctx.session.user.email;
		if (email) {
			const { enqueueReceipt } = await import("~/modules/mail/server");
			await enqueueReceipt({
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

			await ctx.db.transaction(async (tx) => {
				await lockDeclaration(tx, ctx.declarationId);
				await tx
					.update(declarations)
					.set({ cseOpinionDraftUpdatedAt: new Date() })
					.where(eq(declarations.id, ctx.declarationId));
				await tx
					.delete(files)
					.where(
						and(
							eq(files.id, input.fileId),
							eq(files.declarationId, ctx.declarationId),
							eq(files.type, "cse_opinion"),
						),
					);
			});

			await deleteS3File(file.filePath);

			return { success: true };
		}),
});
