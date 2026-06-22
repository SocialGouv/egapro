import { adminRouter } from "~/server/api/routers/admin";
import { adminDeclarationsRouter } from "~/server/api/routers/adminDeclarations";
import { adminReferentsRouter } from "~/server/api/routers/adminReferents";
import { adminSettingsRouter } from "~/server/api/routers/adminSettings";
import { adminStatsRouter } from "~/server/api/routers/adminStats";
import { companyRouter } from "~/server/api/routers/company";
import { cseOpinionRouter } from "~/server/api/routers/cseOpinion";
import { declarationRouter } from "~/server/api/routers/declaration";
import { declarationDraftRouter } from "~/server/api/routers/declarationDraft";
import { gipMdsRouter } from "~/server/api/routers/gipMds";
import { jointEvaluationRouter } from "~/server/api/routers/jointEvaluation";
import { mailRouter } from "~/server/api/routers/mail";
import { profileRouter } from "~/server/api/routers/profile";
import { publicReferentsRouter } from "~/server/api/routers/publicReferents";
import { publicStatsRouter } from "~/server/api/routers/publicStats";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	admin: adminRouter,
	adminDeclarations: adminDeclarationsRouter,
	adminReferents: adminReferentsRouter,
	adminSettings: adminSettingsRouter,
	adminStats: adminStatsRouter,
	company: companyRouter,
	cseOpinion: cseOpinionRouter,
	declaration: declarationRouter,
	declarationDraft: declarationDraftRouter,
	gipMds: gipMdsRouter,
	jointEvaluation: jointEvaluationRouter,
	mail: mailRouter,
	profile: profileRouter,
	publicReferents: publicReferentsRouter,
	publicStats: publicStatsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
