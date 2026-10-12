import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { containsInsensitive, startsWithInsensitive } from "../likeConditions";
import { companies } from "../schema";

const dialect = new PgDialect({ casing: "snake_case" });

describe("containsInsensitive", () => {
	it("matches the value anywhere, case-insensitively", () => {
		const { sql, params } = dialect.sqlToQuery(
			containsInsensitive(companies.name, "Démo"),
		);

		expect(sql.toLowerCase()).toContain("ilike");
		expect(params).toEqual(["%Démo%"]);
	});

	it.each([
		["_", "%\\_%"],
		["%", "%\\%%"],
		["\\", "%\\\\%"],
		["50%_off\\", "%50\\%\\_off\\\\%"],
	])("escapes the LIKE wildcards of %s", (value, pattern) => {
		const { params } = dialect.sqlToQuery(
			containsInsensitive(companies.name, value),
		);

		expect(params).toEqual([pattern]);
	});
});

describe("startsWithInsensitive", () => {
	it("anchors the escaped value at the start", () => {
		const { params } = dialect.sqlToQuery(
			startsWithInsensitive(companies.nafCode, "6_"),
		);

		expect(params).toEqual(["6\\_%"]);
	});
});
