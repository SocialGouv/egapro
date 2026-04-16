import { TRPCError } from "@trpc/server";
import { and, desc, eq, type SQL, sql } from "drizzle-orm";

import {
	campaignStatsSchema,
	impersonateSearchSchema,
} from "~/modules/admin/schemas";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_RANGES,
	COMPANY_SIZE_VOLUNTARY_MAX,
	type CompanySizeRange,
	TRIENNIAL_ANCHOR_YEAR,
	TRIENNIAL_CYCLE,
} from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	adminImpersonationEvents,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";
import { fetchCompanyBySiren } from "~/server/services/weez";

const LAST_IMPERSONATED_LIMIT = 5;

/**
 * Build the SQL predicate matching the companies legally obligated to
 * declare for a given campaign `year`, based on their GIP MDS workforce
 * (`workforceEma`). Mirrors `isObligatedForYear` in the domain layer.
 */
function obligatedForYearPredicate(year: number): SQL {
	const annualMin = COMPANY_SIZE_ANNUAL_MIN;
	const voluntaryMax = COMPANY_SIZE_VOLUNTARY_MAX;
	const isTriennialYear =
		year >= TRIENNIAL_ANCHOR_YEAR &&
		(year - TRIENNIAL_ANCHOR_YEAR) % TRIENNIAL_CYCLE === 0;
	if (isTriennialYear) {
		return sql`${gipMdsData.workforceEma} >= ${voluntaryMax}`;
	}
	return sql`${gipMdsData.workforceEma} >= ${annualMin}`;
}

/** Optional `workforceEma BETWEEN min AND max` filter. */
function sizeRangePredicate(
	sizeRange: CompanySizeRange | undefined,
): SQL | null {
	if (!sizeRange) return null;
	const { min, max } = COMPANY_SIZE_RANGES[sizeRange];
	if (max === null) return sql`${gipMdsData.workforceEma} >= ${min}`;
	return sql`${gipMdsData.workforceEma} BETWEEN ${min} AND ${max}`;
}

type StatsAggregate = { totalObligated: number; totalSubmitted: number };

async function aggregateForYear(
	db: typeof import("~/server/db").db,
	year: number,
	sizeRange: CompanySizeRange | undefined,
): Promise<StatsAggregate> {
	const predicates: SQL[] = [
		eq(gipMdsData.year, year),
		obligatedForYearPredicate(year),
	];
	const rangePredicate = sizeRangePredicate(sizeRange);
	if (rangePredicate) predicates.push(rangePredicate);

	const whereClause = and(...predicates) as SQL;

	// One round trip: JOIN declarations on the obligated denominator set so
	// the submitted count is filtered by the same size + obligation criteria.
	const [row] = await db
		.select({
			totalObligated: sql<number>`count(*)::int`,
			totalSubmitted: sql<number>`count(*) filter (
				where ${declarations.status} = 'submitted'
			)::int`,
		})
		.from(gipMdsData)
		.leftJoin(
			declarations,
			and(
				eq(declarations.siren, gipMdsData.siren),
				eq(declarations.year, gipMdsData.year),
			),
		)
		.where(whereClause);

	return {
		totalObligated: row?.totalObligated ?? 0,
		totalSubmitted: row?.totalSubmitted ?? 0,
	};
}

function toRate({
	totalObligated,
	totalSubmitted,
}: StatsAggregate): number | null {
	if (totalObligated === 0) return null;
	return Math.round((totalSubmitted / totalObligated) * 1000) / 10;
}

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

	/**
	 * KPI K1 — declaration rate for a campaign year.
	 *
	 * Numerator: submitted declarations for the year, restricted to companies
	 * legally obligated to declare that year (driven by `workforceEma` from
	 * `gip_mds_data`) and, if provided, within the selected workforce range.
	 *
	 * Denominator: companies with a `gip_mds_data` row for the year that meet
	 * the same obligation + size filter. Companies missing a GIP row for the
	 * year are intentionally excluded — the GIP feed is the source of truth
	 * for the year-scoped workforce.
	 *
	 * Returns the current-year rate plus the previous-year rate so the UI can
	 * show a points-delta badge; `previousYearRate` is `null` when no GIP
	 * data (or no obligated companies) exist for `year - 1`.
	 */
	getCampaignStats: adminProcedure
		.input(campaignStatsSchema)
		.query(async ({ ctx, input }) => {
			const [current, previous] = await Promise.all([
				aggregateForYear(ctx.db, input.year, input.sizeRange),
				aggregateForYear(ctx.db, input.year - 1, input.sizeRange),
			]);

			return {
				totalObligated: current.totalObligated,
				totalSubmitted: current.totalSubmitted,
				submissionRate: toRate(current),
				previousYearRate: toRate(previous),
			};
		}),
});
