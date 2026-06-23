/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import superjson from "superjson";
import { ZodError } from "zod";
import { getCurrentYear } from "~/modules/domain";
import { parseSiren } from "~/modules/shared/parseSiren";
import { auditMiddleware as runAuditMiddleware } from "~/server/audit/trpcMiddleware";
import { auth } from "~/server/auth";
import { assertNotImpersonating } from "~/server/auth/companyAccess";
import { db } from "~/server/db";
import { declarations } from "~/server/db/schema";
import { getActiveLock } from "~/server/services/declarationLockService";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth();

	return {
		db,
		session,
		...opts,
	};
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware adding an artificial delay in development.
 *
 * Helps catch unwanted waterfalls by simulating network latency
 * that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next }) => {
	if (t._config.isDev) {
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	return next();
});

/**
 * Audit middleware — records every mutation and every explicitly-listed
 * sensitive query in `audit.action_log` (issue #3174). The actual logic lives
 * in `~/server/audit/trpcMiddleware` and is wrapped here so it integrates
 * with the tRPC middleware pipeline (correct return type).
 */
const auditMiddleware = t.middleware(({ ctx, path, getRawInput, next }) =>
	runAuditMiddleware({ ctx, path, getRawInput, next }),
);

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure
	.use(timingMiddleware)
	.use(auditMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(auditMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session?.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return next({
			ctx: {
				// infers the `session` as non-nullable
				session: { ...ctx.session, user: ctx.session.user },
			},
		});
	});

/**
 * Admin procedure — authenticated + `session.user.isAdmin === true`.
 *
 * Use this for any backoffice procedure that must be restricted to staff.
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (!ctx.session.user.isAdmin) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Accès réservé aux administrateurs.",
		});
	}
	return next({ ctx });
});

/**
 * Company procedure — authenticated + SIREN extracted from session.
 *
 * Guarantees `ctx.siren` is a valid 9-digit SIREN.
 * Use this for any procedure that operates on company-scoped data.
 */
export const companyProcedure = protectedProcedure.use(({ ctx, next }) => {
	// Admin impersonation short-circuit: when an admin is currently mimoquing
	// a company, every company-scoped procedure operates on the impersonated
	// SIREN instead of the admin's own SIRET from ProConnect. The admin flag
	// is checked to prevent a non-admin from ever resolving a foreign SIREN.
	const impersonatedSiren =
		ctx.session.user.isAdmin && ctx.session.user.impersonation
			? ctx.session.user.impersonation.siren
			: null;

	const siren = impersonatedSiren ?? parseSiren(ctx.session.user.siret);
	if (!siren) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "SIRET manquant ou invalide dans la session",
		});
	}
	return next({ ctx: { ...ctx, siren } });
});

/**
 * Company-scoped write procedure — same as {@link companyProcedure} plus the
 * admin-impersonation read-only guard. Every tRPC mutation that writes
 * company-scoped data MUST use this instead of `companyProcedure` so an
 * admin currently mimoquing the company cannot alter the user's data
 * (issue #3230).
 */
export const companyWriteProcedure = companyProcedure.use(({ ctx, next }) => {
	assertNotImpersonating(ctx.session);
	return next();
});

/**
 * Resolve the current-year declaration for the given SIREN. Shared between
 * `declarationProcedure` (reads) and `declarationWriteProcedure` (mutations)
 * so the lookup logic stays in a single place. Throws `NOT_FOUND` when the
 * declaration does not exist yet.
 */
async function fetchCurrentDeclarationId(
	database: typeof db,
	siren: string,
): Promise<string> {
	const year = getCurrentYear();
	const rows = await database
		.select({ id: declarations.id })
		.from(declarations)
		.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
		.limit(1);

	const declaration = rows[0];
	if (!declaration) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Déclaration introuvable pour l'année en cours",
		});
	}

	return declaration.id;
}

/**
 * Declaration procedure — company + current declaration resolved.
 *
 * Guarantees `ctx.declarationId` is the ID of the current year's declaration.
 * Use this for any procedure that operates on declaration-scoped data
 * (CSE opinions, joint evaluation files, etc.).
 */
export const declarationProcedure = companyProcedure.use(
	async ({ ctx, next }) => {
		const declarationId = await fetchCurrentDeclarationId(ctx.db, ctx.siren);
		return next({ ctx: { ...ctx, declarationId } });
	},
);

/**
 * Declaration-scoped write procedure — same as {@link declarationProcedure}
 * plus the admin-impersonation read-only guard. Use this for every mutation
 * that writes declaration-scoped data (CSE opinions, joint evaluation files,
 * etc.) so the data cannot be altered while an admin is mimoquing the
 * company (issue #3230).
 *
 * The impersonation guard runs before the declaration lookup (inherited
 * from `companyWriteProcedure`) so a blocked request never hits the
 * database.
 */
export const declarationWriteProcedure = companyWriteProcedure.use(
	async ({ ctx, next }) => {
		const declarationId = await fetchCurrentDeclarationId(ctx.db, ctx.siren);
		return next({ ctx: { ...ctx, declarationId } });
	},
);

/**
 * Declaration-scoped write procedure guarded by the collaborative edit lock.
 *
 * Same as {@link declarationWriteProcedure} plus the `enforceLock` middleware:
 * the request only proceeds when an **active** lock on `ctx.declarationId` is
 * held by the current user. Any other case — no lock, an expired lock, or a
 * lock held by another co-declarant — is rejected with `CONFLICT` so two
 * co-declarants can never write to the same declaration concurrently
 * (epic #3556). The editing UI is responsible for acquiring the lock via
 * `declarationLock.acquireLock` before enabling writes.
 */
export const declarationLockedWriteProcedure = declarationWriteProcedure.use(
	async ({ ctx, next }) => {
		const lock = await getActiveLock(ctx.db, ctx.declarationId);
		if (!lock || lock.userId !== ctx.session.user.id) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Déclaration verrouillée par un autre utilisateur.",
			});
		}
		return next();
	},
);
