import { companyRouter } from "~/server/api/routers/company";
import { cseOpinionRouter } from "~/server/api/routers/cseOpinion";
import { declarationRouter } from "~/server/api/routers/declaration";
import { gipMdsRouter } from "~/server/api/routers/gipMds";
import { profileRouter } from "~/server/api/routers/profile";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	company: companyRouter,
	cseOpinion: cseOpinionRouter,
	declaration: declarationRouter,
	gipMds: gipMdsRouter,
	profile: profileRouter,
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
