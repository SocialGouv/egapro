import { and, eq, type SQL, sql } from "drizzle-orm";

import { COMPANY_SIZE_RANGES, type CompanySizeRange } from "~/modules/domain";

import { declarations, gipMdsData } from "./schema";

/**
 * SQL mirrors of the GIP headcount rules, shared by every admin query that
 * reads an effectif. The GIP-MDS file is the single source of the headcount
 * across the admin layer, so these helpers read `workforce_ema` and never the
 * Weez / INSEE `company.workforce`. Keeping one definition here is what stops
 * the two routers from drifting apart — the failure mode of issue #4185.
 */

/**
 * Join condition attaching the GIP row of the declaration's own campaign year.
 * Always used as a LEFT join: a company absent from the file has no headcount,
 * and letting the NULL propagate keeps it out of the workforce filters without
 * dropping it from the unfiltered list, which an INNER join would do.
 */
export function gipWorkforceJoinCondition(): SQL {
	return and(
		eq(gipMdsData.siren, declarations.siren),
		eq(gipMdsData.year, declarations.year),
	) as SQL;
}

// Mirrors `getOptionalCompanySizeRange` (domain) as a SQL predicate, on the GIP
// headcount floored the way `floorWorkforce` (domain) floors it. An unknown
// headcount belongs to no bucket: the NULL propagates through the comparison and
// the row leaves the filter, rather than being folded into the smallest bucket.
export function gipSizeRangeFilter(
	sizeRange: CompanySizeRange | undefined,
): SQL {
	if (!sizeRange) return sql`TRUE`;

	const { min, max } = COMPANY_SIZE_RANGES[sizeRange];
	const ema = sql<number>`floor(${gipMdsData.workforceEma})`;
	return max === null
		? sql`${ema} >= ${min}`
		: sql`${ema} BETWEEN ${min} AND ${max}`;
}

/**
 * Order-by key for the GIP headcount, with `NULLS LAST` spelled out in both
 * directions. Postgres defaults to NULLS LAST on ASC but NULLS FIRST on DESC:
 * relying on the default would float every unknown headcount to the top of the
 * first page on a descending sort, which is the opposite of what the sort is
 * asked for. Unknown headcounts stay at the end either way.
 */
export function gipWorkforceSortKey(sortOrder: "asc" | "desc"): SQL {
	return sortOrder === "asc"
		? sql`${gipMdsData.workforceEma} ASC NULLS LAST`
		: sql`${gipMdsData.workforceEma} DESC NULLS LAST`;
}
