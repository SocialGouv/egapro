import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
	notCancelledCondition,
	submittedDeclarationCondition,
} from "../declarationConditions";

// Same casing as the app's db instance, so the generated column names match.
const dialect = new PgDialect({ casing: "snake_case" });

// Parity guard: these Drizzle conditions are the SQL mirrors of the domain
// predicates `isDeclarationSubmitted` / `isCancelled`. Assert the generated SQL
// stays aligned with those definitions ("status" <> 'draft' and not cancelled).

describe("submittedDeclarationCondition", () => {
	it("excludes draft declarations (mirror of isDeclarationSubmitted)", () => {
		const { sql, params } = dialect.sqlToQuery(submittedDeclarationCondition());
		expect(sql).toContain("status");
		expect(sql).toMatch(/<>|!=/);
		expect(params).toEqual(["draft"]);
	});
});

describe("notCancelledCondition", () => {
	it("excludes cancelled declarations (mirror of isCancelled)", () => {
		const { sql, params } = dialect.sqlToQuery(notCancelledCondition());
		expect(sql).toContain("cancelled_at");
		expect(sql.toLowerCase()).toContain("is null");
		expect(params).toEqual([]);
	});
});
