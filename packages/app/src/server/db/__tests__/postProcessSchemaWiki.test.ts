import { describe, expect, it } from "vitest";

import {
	injectTableComments,
	locateSection,
	parseTableNames,
	parseTableRow,
	processMarkdown,
} from "~/server/db/postProcessSchemaWiki";

// ---------------------------------------------------------------------------
// Sample Markdown that mimics db-schema-toolkit (v1.1.x) output format:
//   - Section headers: `## Table: <camelCaseName>`
//   - Separator: `|--------|------|` (dashes only, no spaces inside)
//   - Column names: camelCase (match Drizzle field names)
// ---------------------------------------------------------------------------

const SAMPLE_MARKDOWN = `# schema

## Table: declaration

| Column | Type | Nullable |
|--------|------|----------|
| id | VARCHAR | No |
| indicatorAAnnualWomen | NUMERIC | Yes |
| indicatorAAnnualMen | NUMERIC | Yes |

### Indexes

### Foreign Keys

## Table: user

| Column | Type | Nullable |
|--------|------|----------|
| id | VARCHAR | No |
| email | VARCHAR | No |
`;

// ---------------------------------------------------------------------------
// parseTableNames
// ---------------------------------------------------------------------------

describe("parseTableNames", () => {
	it("returns all table names found in the Markdown", () => {
		const names = parseTableNames(SAMPLE_MARKDOWN);
		expect(names).toEqual(["declaration", "user"]);
	});

	it("returns an empty array when no table headers are present", () => {
		expect(parseTableNames("# Title\n\nSome text.")).toEqual([]);
	});

	it("only matches ## Table: headers, not ### sub-sections", () => {
		const md = "## Table: foo\n\n### Indexes\n\n## Table: bar\n";
		expect(parseTableNames(md)).toEqual(["foo", "bar"]);
	});
});

// ---------------------------------------------------------------------------
// parseTableRow
// ---------------------------------------------------------------------------

describe("parseTableRow", () => {
	it("splits a pipe-delimited row into cells", () => {
		const cells = parseTableRow("| id | VARCHAR | No |\n");
		expect(cells).toHaveLength(3);
		expect(cells[0]?.trim()).toBe("id");
		expect(cells[1]?.trim()).toBe("VARCHAR");
		expect(cells[2]?.trim()).toBe("No");
	});

	it("handles rows without trailing newline", () => {
		const cells = parseTableRow("| a | b |");
		expect(cells).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// locateSection
// ---------------------------------------------------------------------------

describe("locateSection", () => {
	it("finds the correct start and end for a section", () => {
		const result = locateSection(SAMPLE_MARKDOWN, "declaration");
		if (result === null) throw new Error("expected non-null result");
		const section = SAMPLE_MARKDOWN.slice(
			result.sectionStart,
			result.sectionEnd,
		);
		expect(section).toContain("Table: declaration");
		expect(section).toContain("indicatorAAnnualWomen");
		expect(section).not.toContain("Table: user");
	});

	it("returns null when the table is not found", () => {
		expect(locateSection(SAMPLE_MARKDOWN, "nonexistent")).toBeNull();
	});

	it("handles the last section (no following ## header)", () => {
		const result = locateSection(SAMPLE_MARKDOWN, "user");
		if (result === null) throw new Error("expected non-null result");
		const section = SAMPLE_MARKDOWN.slice(
			result.sectionStart,
			result.sectionEnd,
		);
		expect(section).toContain("Table: user");
		expect(section).toContain("email");
	});
});

// ---------------------------------------------------------------------------
// injectTableComments — happy path
// ---------------------------------------------------------------------------

describe("injectTableComments — injection", () => {
	it("adds a Commentaire column for matched entries", () => {
		const comments = {
			indicatorAAnnualWomen: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F",
		};

		const { markdown: result, injected } = injectTableComments(
			SAMPLE_MARKDOWN,
			"declaration",
			comments,
		);

		expect(injected).toBe(1);
		expect(result).toContain("Commentaire");
		expect(result).toContain("GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F");
	});

	it("adds empty cells for columns without a comment entry", () => {
		const comments = {
			indicatorAAnnualWomen: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F",
		};

		const { markdown: result } = injectTableComments(
			SAMPLE_MARKDOWN,
			"declaration",
			comments,
		);

		// The id and indicatorAAnnualMen rows should have an empty comment cell.
		const lines = result.split("\n");
		const idRow = lines.find((l) => /^\| id \|/.test(l));
		expect(idRow).toContain("|  |");
	});

	it("returns injected = 0 when no comments match any column", () => {
		const { injected } = injectTableComments(
			SAMPLE_MARKDOWN,
			"declaration",
			{},
		);
		expect(injected).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// injectTableComments — idempotency
// ---------------------------------------------------------------------------

describe("injectTableComments — idempotency", () => {
	it("does not add a second Commentaire column when already present", () => {
		const comments = { indicatorAAnnualWomen: "test comment" };
		const { markdown: once } = injectTableComments(
			SAMPLE_MARKDOWN,
			"declaration",
			comments,
		);
		const { markdown: twice, injected } = injectTableComments(
			once,
			"declaration",
			comments,
		);

		// Only one Commentaire column header in the whole document.
		const count = (twice.match(/Commentaire/g) ?? []).length;
		expect(count).toBe(1);
		expect(injected).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// injectTableComments — unknown table
// ---------------------------------------------------------------------------

describe("injectTableComments — unknown table", () => {
	it("returns the original markdown unchanged when the table is not found", () => {
		const { markdown: result, injected } = injectTableComments(
			SAMPLE_MARKDOWN,
			"nonexistent",
			{ someCol: "comment" },
		);
		expect(result).toBe(SAMPLE_MARKDOWN);
		expect(injected).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// processMarkdown — full pipeline
// ---------------------------------------------------------------------------

describe("processMarkdown", () => {
	it("injects comments for multiple tables", () => {
		const comments = {
			declaration: { indicatorAAnnualWomen: "GIP-MDS | annual women" },
			user: { email: "Contact email" },
		};

		const { result, stats } = processMarkdown(SAMPLE_MARKDOWN, comments);

		expect(result).toContain("GIP-MDS | annual women");
		expect(result).toContain("Contact email");
		expect(stats.declaration).toBeGreaterThan(0);
		expect(stats.user).toBeGreaterThan(0);
	});

	it("warns but does not throw for entries pointing to missing tables", () => {
		const comments = {
			nonexistentTable: { col: "value" },
		};

		expect(() => processMarkdown(SAMPLE_MARKDOWN, comments)).not.toThrow();
	});

	it("returns unchanged markdown when the comments map is empty", () => {
		const { result, stats } = processMarkdown(SAMPLE_MARKDOWN, {});
		expect(result).toBe(SAMPLE_MARKDOWN);
		expect(stats).toEqual({});
	});

	it("is idempotent: running twice produces identical output", () => {
		const comments = {
			declaration: { indicatorAAnnualWomen: "test comment" },
		};

		const { result: first } = processMarkdown(SAMPLE_MARKDOWN, comments);
		const { result: second } = processMarkdown(first, comments);

		expect(second).toBe(first);
	});
});
