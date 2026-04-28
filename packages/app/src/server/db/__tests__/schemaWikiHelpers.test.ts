import { describe, expect, it } from "vitest";
import {
	camelToSnake,
	escapeCell,
	injectComments,
	parseCells,
} from "~/server/db/schemaWikiHelpers";

describe("camelToSnake", () => {
	it("converts simple camelCase", () => {
		expect(camelToSnake("firstName")).toBe("first_name");
	});

	it("handles consecutive uppercase (e.g. indicatorA)", () => {
		expect(camelToSnake("indicatorAAnnualWomen")).toBe(
			"indicator_a_annual_women",
		);
	});

	it("handles single uppercase suffix", () => {
		expect(camelToSnake("indicatorBHourlyMen")).toBe("indicator_b_hourly_men");
	});

	it("leaves snake_case strings unchanged", () => {
		expect(camelToSnake("already_snake")).toBe("already_snake");
	});

	it("handles single lowercase word", () => {
		expect(camelToSnake("siren")).toBe("siren");
	});
});

describe("escapeCell", () => {
	it("escapes pipe characters", () => {
		expect(escapeCell("GIP-MDS | SUIT: foo")).toBe("GIP-MDS \\| SUIT: foo");
	});

	it("leaves strings without pipes unchanged", () => {
		expect(escapeCell("no pipes here")).toBe("no pipes here");
	});

	it("escapes multiple pipes", () => {
		expect(escapeCell("a | b | c")).toBe("a \\| b \\| c");
	});

	it("returns empty string unchanged", () => {
		expect(escapeCell("")).toBe("");
	});
});

describe("parseCells", () => {
	it("splits a standard markdown row into trimmed cells", () => {
		expect(parseCells("| id | VARCHAR | No |")).toEqual([
			"id",
			"VARCHAR",
			"No",
		]);
	});

	it("does not split on escaped pipes", () => {
		const cells = parseCells("| siren | VARCHAR | GIP-MDS \\| SUIT: foo |");
		expect(cells).toEqual(["siren", "VARCHAR", "GIP-MDS \\| SUIT: foo"]);
	});
});

describe("injectComments", () => {
	const HEADER = "| Column | Type | Nullable |";
	const SEPARATOR = "|--------|------|----------|";

	it("returns empty lines for fewer than 2 input lines", () => {
		expect(injectComments([], {}).lines).toEqual([]);
		expect(injectComments(["| only header |"], {}).injected).toBe(0);
	});

	it("adds Commentaire column to a table without one", () => {
		const tableLines = [
			HEADER,
			SEPARATOR,
			"| id | VARCHAR | No |",
			"| siren | VARCHAR | No |",
		];
		const comments = { siren: "Company SIREN identifier" };
		const { lines, injected } = injectComments(tableLines, comments);

		expect(injected).toBe(1);
		expect(lines[0]).toContain("Commentaire");
		expect(lines[1]).toContain("---");
		expect(lines[3]).toContain("Company SIREN identifier");
	});

	it("escapes pipes in injected comment values", () => {
		const tableLines = [HEADER, SEPARATOR, "| siren | VARCHAR | No |"];
		const comments = { siren: "GIP-MDS | SUIT: code_entreprise" };
		const { lines } = injectComments(tableLines, comments);

		expect(lines[2]).toContain("GIP-MDS \\| SUIT: code_entreprise");
	});

	it("maps camelCase column names to snake_case keys", () => {
		const tableLines = [
			HEADER,
			SEPARATOR,
			"| indicatorAAnnualWomen | NUMERIC | Yes |",
		];
		const comments = { indicator_a_annual_women: "GIP-MDS | SUIT: Rem_F" };
		const { injected, lines } = injectComments(tableLines, comments);

		expect(injected).toBe(1);
		expect(lines[2]).toContain("GIP-MDS \\| SUIT: Rem_F");
	});

	it("leaves rows without a map entry with an empty comment cell", () => {
		const tableLines = [HEADER, SEPARATOR, "| totalMen | INTEGER | Yes |"];
		const { lines, injected } = injectComments(tableLines, {});

		expect(injected).toBe(0);
		expect(lines[2]).toMatch(/\|\s*\|$/);
	});

	it("is idempotent when Commentaire column already exists and value matches", () => {
		const existing = [
			"| Column | Type | Nullable | Commentaire |",
			"|--------|------|----------| --- |",
			"| siren | VARCHAR | No | Company SIREN identifier |",
		];
		const comments = { siren: "Company SIREN identifier" };
		const { lines, injected } = injectComments(existing, comments);

		expect(injected).toBe(0);
		expect(lines[0]).toBe(existing[0]);
	});

	it("updates existing Commentaire cells when value changes", () => {
		const existing = [
			"| Column | Type | Nullable | Commentaire |",
			"|--------|------|----------| --- |",
			"| siren | VARCHAR | No | old comment |",
		];
		const comments = { siren: "new comment" };
		const { lines, injected } = injectComments(existing, comments);

		expect(injected).toBe(1);
		expect(lines[2]).toContain("new comment");
	});

	it("correctly handles already-escaped pipe in existing cell (idempotency)", () => {
		const existing = [
			"| Column | Type | Nullable | Commentaire |",
			"|--------|------|----------| --- |",
			"| siren | VARCHAR | No | GIP-MDS \\| SUIT: code |",
		];
		const comments = { siren: "GIP-MDS | SUIT: code" };
		const { lines, injected } = injectComments(existing, comments);

		expect(injected).toBe(0);
		expect(lines[2]).toContain("GIP-MDS \\| SUIT: code");
	});
});
