import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import {
	findJointEvaluationFile,
	findTransmittedJointEvaluation,
} from "./declarationHelpers";

export const jointEvaluationRouter = createTRPCRouter({
	getFile: declarationProcedure.query(({ ctx }) =>
		findJointEvaluationFile(ctx.db, ctx.declarationId),
	),
	transmittedRound: declarationProcedure.query(async ({ ctx }) => {
		const transmitted = await findTransmittedJointEvaluation(
			ctx.db,
			ctx.declarationId,
		);
		return transmitted?.submission.round ?? null;
	}),
});
