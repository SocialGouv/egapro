import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

import {
	impersonateSearchSchema,
	startImpersonateSchema,
} from "~/modules/admin/schemas";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { adminImpersonationEvents, companies } from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";

const LAST_IMPERSONATED_LIMIT = 5;

/**
 * Admin / backoffice router.
 *
 * Procedures are all gated by `adminProcedure` — a logged-in admin flag is
 * required. The actual session mutation (marking the JWT as impersonating
 * a given company) happens client-side via `session.update()` in the
 * NextAuth `update` trigger; these procedures only return the data the UI
 * needs and write the audit trail.
 */
export const adminRouter = createTRPCRouter({
	/**
	 * Search a company by SIREN for the impersonation UI.
	 *
	 * Upserts the company into `app_company` so that the audit-log foreign
	 * key can be satisfied when the admin starts impersonating it.
	 */
	searchCompany: adminProcedure
		.input(impersonateSearchSchema)
		.mutation(async ({ input }) => {
			let info: Awaited<ReturnType<typeof fetchCompanyBySiren>>;
			try {
				info = await fetchCompanyBySiren(input.siren);
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erreur lors de la recherche de l'entreprise.",
				});
			}

			if (!info) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Aucune entreprise trouvée pour le SIREN ${input.siren}.`,
				});
			}

			return {
				siren: input.siren,
				name: info.name,
				address: info.address,
				nafCode: info.nafCode,
				workforce: info.workforce,
			};
		}),

	/**
	 * Record the start of an impersonation session in the audit log.
	 *
	 * Must be called before the client calls `session.update()` — the UI
	 * uses the returned `{ siren, name }` as the payload for the NextAuth
	 * update trigger, so the JWT and the audit log stay in sync.
	 */
	startImpersonate: adminProcedure
		.input(startImpersonateSchema)
		.mutation(async ({ ctx, input }) => {
			const info = await fetchCompanyBySiren(input.siren);
			if (!info) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Aucune entreprise trouvée pour le SIREN ${input.siren}.`,
				});
			}

			await ctx.db.transaction(async (tx) => {
				// Ensure the company exists so the FK on the event table holds.
				await tx
					.insert(companies)
					.values({
						siren: input.siren,
						name: info.name,
						address: info.address,
						nafCode: info.nafCode,
						workforce: info.workforce,
					})
					.onConflictDoUpdate({
						target: companies.siren,
						set: {
							name: info.name,
							address: info.address,
							nafCode: info.nafCode,
							workforce: info.workforce,
							updatedAt: new Date(),
						},
					});

				// Close any previously open session for this admin, so
				// `stoppedAt IS NULL` uniquely identifies the current one.
				await tx
					.update(adminImpersonationEvents)
					.set({ stoppedAt: new Date() })
					.where(
						and(
							eq(adminImpersonationEvents.adminUserId, ctx.session.user.id),
							isNull(adminImpersonationEvents.stoppedAt),
						),
					);

				await tx.insert(adminImpersonationEvents).values({
					adminUserId: ctx.session.user.id,
					siren: input.siren,
				});
			});

			return { siren: input.siren, name: info.name };
		}),

	/**
	 * Stop the currently active impersonation session for the admin.
	 *
	 * Idempotent: calling it when no session is open is a no-op.
	 */
	stopImpersonate: adminProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.update(adminImpersonationEvents)
			.set({ stoppedAt: new Date() })
			.where(
				and(
					eq(adminImpersonationEvents.adminUserId, ctx.session.user.id),
					isNull(adminImpersonationEvents.stoppedAt),
				),
			);
	}),

	/**
	 * Return the last N distinct companies the current admin has impersonated.
	 * Used by the UI as a `<datalist>` of suggestions under the SIREN input.
	 */
	getLastImpersonated: adminProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				siren: adminImpersonationEvents.siren,
				name: companies.name,
				lastStartedAt: sql<Date>`max(${adminImpersonationEvents.startedAt})`,
			})
			.from(adminImpersonationEvents)
			.innerJoin(companies, eq(adminImpersonationEvents.siren, companies.siren))
			.where(eq(adminImpersonationEvents.adminUserId, ctx.session.user.id))
			.groupBy(adminImpersonationEvents.siren, companies.name)
			.orderBy(desc(sql`max(${adminImpersonationEvents.startedAt})`))
			.limit(LAST_IMPERSONATED_LIMIT);

		return rows.map((r) => ({ siren: r.siren, name: r.name }));
	}),
});
