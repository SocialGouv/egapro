import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import {
	findJointEvaluationFile,
	findTransmittedJointEvaluation,
} from "./declarationHelpers";

export const jointEvaluationRouter = createTRPCRouter({
	getFile: declarationProcedure.query(({ ctx }) =>
		findJointEvaluationFile(ctx.db, ctx.declarationId),
	),
	isTransmitted: declarationProcedure.query(
		async ({ ctx }) =>
			(await findTransmittedJointEvaluation(ctx.db, ctx.declarationId)) !==
			null,
	),
});
