import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getCurrentYear } from "~/modules/domain";
import {
	createTRPCRouter,
	declarationProcedure,
	declarationWriteProcedure,
} from "~/server/api/trpc";
import { declarationStatusHistory, declarations } from "~/server/db/schema";
import { loadRules } from "~/server/rules/engine";
import {
	buildFormalNoticeFacts,
	FORMAL_NOTICE_ACTION,
	findFormalNoticeFile,
	isFormalNoticeAvailableFor,
	loadGapCseOpinionsFor,
} from "~/server/services/formalNoticeExposure";
import {
	applyActionOrRefuse,
	buildHistoryInserts,
	computeProjectionUpdates,
	lockAndReadDeclaration,
} from "./statusHistoryHelpers";

const FORMAL_NOTICE_UNAVAILABLE_ERROR =
	"Le rapport de l'évaluation conjointe suite à une mise en demeure ne peut pas être transmis pour cette démarche.";

const FORMAL_NOTICE_FILE_MISSING_ERROR =
	"Le rapport de l'évaluation conjointe doit être déposé avant sa transmission.";

export const formalNoticeRouter = createTRPCRouter({
	get: declarationProcedure.query(async ({ ctx }) => {
		const [available, existingFile] = await Promise.all([
			isFormalNoticeAvailableFor(ctx.db, ctx.declarationId),
			findFormalNoticeFile(ctx.db, ctx.declarationId),
		]);
		return {
			available,
			existingFile,
			declarationId: ctx.declarationId,
			siren: ctx.siren,
			year: getCurrentYear(),
		};
	}),

	submit: declarationWriteProcedure.mutation(async ({ ctx }) => {
		const year = getCurrentYear();

		await ctx.db.transaction(async (tx) => {
			const declaration = await lockAndReadDeclaration(
				tx,
				ctx.declarationId,
				ctx.siren,
				year,
			);

			const { nextStatus, events } = applyActionOrRefuse(
				buildFormalNoticeFacts(
					declaration,
					await loadGapCseOpinionsFor(tx, declaration.id),
				),
				FORMAL_NOTICE_ACTION,
				loadRules(declaration.rulesVersion),
				FORMAL_NOTICE_UNAVAILABLE_ERROR,
			);

			if (!(await findFormalNoticeFile(tx, declaration.id))) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: FORMAL_NOTICE_FILE_MISSING_ERROR,
				});
			}

			await tx
				.insert(declarationStatusHistory)
				.values(
					buildHistoryInserts(declaration.id, events, ctx.session.user.id),
				);
			await tx
				.update(declarations)
				.set({
					...computeProjectionUpdates(events, nextStatus),
					updatedAt: new Date(),
				})
				.where(eq(declarations.id, declaration.id));
		});

		const email = ctx.session.user.email;
		if (email) {
			const { enqueueReceipt } = await import("~/modules/mail/server");
			await enqueueReceipt({
				kind: "formalNoticeJointEvaluation",
				to: email,
				siren: ctx.siren,
				year,
				userId: ctx.session.user.id,
				isResend: false,
			});
		}

		return { success: true };
	}),
});
