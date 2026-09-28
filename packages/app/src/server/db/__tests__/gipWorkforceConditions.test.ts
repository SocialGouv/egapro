import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	type CompanySizeRange,
	getOptionalCompanySizeRange,
} from "~/modules/domain";

import {
	gipSizeRangeFilter,
	gipWorkforceJoinCondition,
	gipWorkforceSortKey,
} from "../gipWorkforceConditions";

// Same casing as the app's db instance, so the generated column names match.
const dialect = new PgDialect({ casing: "snake_case" });

const RANGE_KEYS = Object.keys(COMPANY_SIZE_RANGES) as CompanySizeRange[];

describe("gipWorkforceJoinCondition", () => {
	it("attaches the GIP row on both SIREN and campaign year", () => {
		const { sql } = dialect.sqlToQuery(gipWorkforceJoinCondition());

		expect(sql).toContain("siren");
		expect(sql).toContain("year");
	});
});

describe("gipSizeRangeFilter", () => {
	it("matches every row when no bracket is selected", () => {
		const { sql } = dialect.sqlToQuery(gipSizeRangeFilter(undefined));

		expect(sql.trim()).toBe("TRUE");
	});

	it.each(
		RANGE_KEYS,
	)("floors the GIP headcount for the %s bracket", (range) => {
		const { sql } = dialect.sqlToQuery(gipSizeRangeFilter(range));

		expect(sql).toContain("floor(");
		expect(sql).toContain("workforce_ema");
	});

	it("bounds a closed bracket by its domain min and max", () => {
		const { sql, params } = dialect.sqlToQuery(gipSizeRangeFilter("100-149"));

		expect(sql).toContain("BETWEEN");
		expect(params).toEqual([
			COMPANY_SIZE_RANGES["100-149"].min,
			COMPANY_SIZE_RANGES["100-149"].max,
		]);
	});

	it("leaves the open-ended bracket without an upper bound", () => {
		const { sql, params } = dialect.sqlToQuery(gipSizeRangeFilter("250+"));

		expect(sql).not.toContain("BETWEEN");
		expect(sql).toContain(">=");
		expect(params).toEqual([COMPANY_SIZE_RANGES["250+"].min]);
	});

	// Mirror of `getOptionalCompanySizeRange`: an unknown headcount belongs to no
	// bracket. In SQL the NULL propagates through the comparison, so no
	// `coalesce(workforce_ema, 0)` may creep in — it would fold "unknown" into
	// the smallest bracket.
	it("never coalesces an unknown headcount into a bracket", () => {
		expect(getOptionalCompanySizeRange(null)).toBeUndefined();

		for (const range of RANGE_KEYS) {
			expect(dialect.sqlToQuery(gipSizeRangeFilter(range)).sql).not.toContain(
				"coalesce",
			);
		}
	});
});

describe("gipWorkforceSortKey", () => {
	it("sorts ascending with the unknown headcounts last", () => {
		const { sql } = dialect.sqlToQuery(gipWorkforceSortKey("asc"));

		expect(sql).toContain("workforce_ema");
		expect(sql).toContain("ASC");
		expect(sql).toContain("NULLS LAST");
	});

	// Postgres defaults to NULLS FIRST on DESC: the keyword has to be spelled out
	// or every unknown headcount floats to the top of the first page.
	it("sorts descending with the unknown headcounts last too", () => {
		const { sql } = dialect.sqlToQuery(gipWorkforceSortKey("desc"));

		expect(sql).toContain("workforce_ema");
		expect(sql).toContain("DESC");
		expect(sql).toContain("NULLS LAST");
		expect(sql).not.toContain("NULLS FIRST");
	});
});
