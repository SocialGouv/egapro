import { createTRPCRouter, declarationProcedure } from "~/server/api/trpc";
import { findJointEvaluationFile } from "./declarationHelpers";

export const jointEvaluationRouter = createTRPCRouter({
	getFile: declarationProcedure.query(({ ctx }) =>
		findJointEvaluationFile(ctx.db, ctx.declarationId),
	),
});
