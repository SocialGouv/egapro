import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	acquireLockSchema,
	getLockStateSchema,
	heartbeatSchema,
	releaseLockSchema,
} from "~/modules/declaration-remuneration/schemas";
import { DEFAULT_LOCK_TIMEOUT_MINUTES, getCurrentYear } from "~/modules/domain";
import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import type { DB } from "~/server/db";
import { GLOBAL_SETTINGS_ID } from "~/server/db/getGlobalSettings";
import { declarations, globalSettings } from "~/server/db/schema";
import {
	acquireOrRefreshLock,
	getActiveLock,
	refreshLock,
	releaseLock,
} from "~/server/services/declarationLockService";
import { activeDeclarationFilter } from "./declarationHelpers";

/**
 * Resolve the current-year declaration for `siren` and assert it matches the
 * `declarationId` the client claims to operate on. Resolving server-side from
 * the session SIREN (never trusting the raw input) closes the IDOR window: a
 * co-declarant cannot lock or release a declaration belonging to another
 * company by forging an arbitrary id.
 */
async function resolveOwnDeclarationId(
	db: DB,
	siren: string,
	claimedDeclarationId: string,
): Promise<string> {
	const [row] = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(activeDeclarationFilter(siren, getCurrentYear()))
		.limit(1);

	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Déclaration introuvable pour l'année en cours",
		});
	}

	if (row.id !== claimedDeclarationId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Déclaration non autorisée.",
		});
	}

	return row.id;
}

async function readLockTimeoutMinutes(db: DB): Promise<number> {
	const [settings] = await db
		.select({ minutes: globalSettings.declarationLockTimeoutMinutes })
		.from(globalSettings)
		.where(eq(globalSettings.id, GLOBAL_SETTINGS_ID))
		.limit(1);

	return settings?.minutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
}

export const declarationLockRouter = createTRPCRouter({
	getActiveLockForCurrentDeclaration: companyProcedure.query(
		async ({ ctx }) => {
			const [row] = await ctx.db
				.select({ id: declarations.id })
				.from(declarations)
				.where(activeDeclarationFilter(ctx.siren, getCurrentYear()))
				.limit(1);

			if (!row) {
				return { lockedByOther: false, holder: null };
			}

			const holder = await getActiveLock(ctx.db, row.id);
			return {
				lockedByOther: holder !== null && holder.userId !== ctx.session.user.id,
				holder: holder
					? {
							firstName: holder.firstName,
							lastName: holder.lastName,
							email: holder.email,
						}
					: null,
			};
		},
	),

	acquireLock: companyWriteProcedure
		.input(acquireLockSchema)
		.mutation(async ({ ctx, input }) => {
			const declarationId = await resolveOwnDeclarationId(
				ctx.db,
				ctx.siren,
				input.declarationId,
			);
			const timeoutMinutes = await readLockTimeoutMinutes(ctx.db);
			const userId = ctx.session.user.id;

			const { acquired, holder } = await acquireOrRefreshLock(
				ctx.db,
				declarationId,
				userId,
				timeoutMinutes,
			);

			// Audit only a real takeover: `acquired` is false when another user
			// already holds an active lock (the row is left untouched), so logging
			// every poll would pollute the trail with phantom "lock_acquired" rows.
			if (acquired) {
				const requestContext = buildRequestContext(ctx.headers);
				void logAction({
					action: AUDIT_ACTIONS.DECLARATION_LOCK_ACQUIRED,
					status: "success",
					userId,
					userEmail: ctx.session.user.email,
					siren: ctx.siren,
					resourceType: "declaration",
					resourceId: declarationId,
					ipAddress: requestContext.ipAddress,
					userAgent: requestContext.userAgent,
				});
			}

			return { acquired, holder };
		}),

	heartbeat: companyWriteProcedure
		.input(heartbeatSchema)
		.mutation(async ({ ctx, input }) => {
			const declarationId = await resolveOwnDeclarationId(
				ctx.db,
				ctx.siren,
				input.declarationId,
			);
			const timeoutMinutes = await readLockTimeoutMinutes(ctx.db);

			const held = await refreshLock(
				ctx.db,
				declarationId,
				ctx.session.user.id,
				timeoutMinutes,
			);

			return { held };
		}),

	releaseLock: companyWriteProcedure
		.input(releaseLockSchema)
		.mutation(async ({ ctx, input }) => {
			const declarationId = await resolveOwnDeclarationId(
				ctx.db,
				ctx.siren,
				input.declarationId,
			);
			const userId = ctx.session.user.id;

			const active = await getActiveLock(ctx.db, declarationId);
			const released = active?.userId === userId;

			if (released) {
				await releaseLock(ctx.db, declarationId, userId);

				const requestContext = buildRequestContext(ctx.headers);
				void logAction({
					action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
					status: "success",
					userId,
					userEmail: ctx.session.user.email,
					siren: ctx.siren,
					resourceType: "declaration",
					resourceId: declarationId,
					ipAddress: requestContext.ipAddress,
					userAgent: requestContext.userAgent,
				});
			}

			return { released };
		}),

	getLockState: companyProcedure
		.input(getLockStateSchema)
		.query(async ({ ctx, input }) => {
			const declarationId = await resolveOwnDeclarationId(
				ctx.db,
				ctx.siren,
				input.declarationId,
			);

			const holder = await getActiveLock(ctx.db, declarationId);

			return {
				locked: holder !== null,
				isOwnLock: holder?.userId === ctx.session.user.id,
				holder,
			};
		}),
});
