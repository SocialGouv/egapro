import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import {
	loadDraftSnapshot,
	readStagedJointUpload,
} from "~/server/services/declarationDraftStaging";
import {
	findJointEvaluationFile,
	findTransmittedJointEvaluation,
} from "./declarationHelpers";

export const jointEvaluationRouter = createTRPCRouter({
	getFile: declarationProcedure.query(async ({ ctx }) => {
		// A report staged on a closed démarche is the one the déposant sees and
		// will transmit; the transmitted row stays untouched until then.
		const snapshot = await loadDraftSnapshot(ctx.db, ctx.declarationId);
		const staged = readStagedJointUpload(snapshot);
		if (staged) {
			return {
				id: staged.fileId,
				fileName: staged.fileName,
				uploadedAt: new Date(staged.uploadedAt),
			};
		}
		return findJointEvaluationFile(ctx.db, ctx.declarationId);
	}),
	transmittedRound: declarationProcedure.query(async ({ ctx }) => {
		const transmitted = await findTransmittedJointEvaluation(
			ctx.db,
			ctx.declarationId,
		);
		return transmitted?.submission.round ?? null;
	}),
});
