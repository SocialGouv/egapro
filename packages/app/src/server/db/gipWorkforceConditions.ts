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

// NULLS LAST spelled out both ways: Postgres defaults to NULLS FIRST on DESC.
export function gipWorkforceSortKey(sortOrder: "asc" | "desc"): SQL {
	return sortOrder === "asc"
		? sql`${gipMdsData.workforceEma} ASC NULLS LAST`
		: sql`${gipMdsData.workforceEma} DESC NULLS LAST`;
}
