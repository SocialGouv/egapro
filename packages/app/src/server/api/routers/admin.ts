import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";

import { impersonateSearchSchema } from "~/modules/admin/schemas";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { adminImpersonationEvents, companies } from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";

const LAST_IMPERSONATED_LIMIT = 5;

/**
 * Admin / backoffice router.
 *
 * All procedures are gated by `adminProcedure`. The actual impersonation
 * state lives in the NextAuth JWT; this router only serves the data the
 * backoffice UI needs (search a company, list recently impersonated
 * companies). The audit trail and the JWT mutation happen atomically in
 * the `jwt` callback when the client calls `session.update(...)`.
 */
export const adminRouter = createTRPCRouter({
	/**
	 * Resolve a SIREN to a company preview, shown before the admin
	 * confirms they want to impersonate it. Pure read — no DB mutation.
	 */
	searchCompany: adminProcedure
		.input(impersonateSearchSchema)
		.mutation(async ({ input }) => {
			let info: Awaited<ReturnType<typeof fetchCompanyBySiren>>;
			try {
				info = await fetchCompanyBySiren(input.siren);
			} catch (error) {
				console.error("admin.searchCompany — Weez error", error);
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
	 * Return the last N distinct companies the current admin has
	 * impersonated, for the datalist suggestions under the SIREN input.
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
