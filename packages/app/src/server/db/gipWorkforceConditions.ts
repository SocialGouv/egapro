import { and, eq, type SQL, sql } from "drizzle-orm";

import { COMPANY_SIZE_RANGES, type CompanySizeRange } from "~/modules/domain";

import { declarations, gipMdsData } from "./schema";

// LEFT join only: an INNER join would drop companies absent from the GIP file.
export function gipWorkforceJoinCondition(): SQL {
	return and(
		eq(gipMdsData.siren, declarations.siren),
		eq(gipMdsData.year, declarations.year),
	) as SQL;
}

// Mirrors `getCompanySizeRangeForGip` (domain) as a SQL predicate, on the GIP
// headcount floored the way `floorWorkforce` (domain) floors it. A company
// absent from the GIP file, or present with no headcount, is of the voluntary
// tier: `coalesce(…, 0)` folds the NULL into the smallest bucket instead of
// letting it propagate out of the comparison.
export function gipSizeRangeFilter(
	sizeRange: CompanySizeRange | undefined,
): SQL {
	if (!sizeRange) return sql`TRUE`;

	const { min, max } = COMPANY_SIZE_RANGES[sizeRange];
	const ema = sql<number>`coalesce(floor(${gipMdsData.workforceEma}), 0)`;
	return max === null
		? sql`${ema} >= ${min}`
		: sql`${ema} BETWEEN ${min} AND ${max}`;
}

// NULLS LAST spelled out both ways: Postgres defaults to NULLS FIRST on DESC.
export function gipWorkforceSortKey(sortOrder: "asc" | "desc"): SQL {
	return sortOrder === "asc"
		? sql`${gipMdsData.workforceEma} ASC NULLS LAST`
		: sql`${gipMdsData.workforceEma} DESC NULLS LAST`;
}
