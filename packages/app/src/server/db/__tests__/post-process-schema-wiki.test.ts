import { describe, expect, it } from "vitest";
import { processMarkdown } from "#scripts/post-process-schema-wiki.mjs";

const MINIMAL_MD = `# Schema

## app_declaration

| column | type | nullable |
| --- | --- | --- |
| id | varchar(255) | false |
| indicator_a_annual_women | numeric | true |

## app_user

| column | type | nullable |
| --- | --- | --- |
| id | varchar(255) | false |
| email | varchar(255) | false |
`;

describe("processMarkdown", () => {
	it("adds Commentaire column header and empty cells when no comments", () => {
		const { output, injectedByTable } = processMarkdown(MINIMAL_MD, {});
		expect(output).toContain("| column | type | nullable | Commentaire |");
		expect(output).toContain("| --- | --- | --- | --- |");
		expect(output).toContain("| id | varchar(255) | false |  |");
		expect(injectedByTable).toEqual({});
	});

	it("injects comment for a matching table and column", () => {
		const comments = {
			declaration: { indicator_a_annual_women: "GIP-MDS test" },
		};
		const { output, injectedByTable } = processMarkdown(MINIMAL_MD, comments);
		expect(output).toContain(
			"| indicator_a_annual_women | numeric | true | GIP-MDS test |",
		);
		expect(injectedByTable).toEqual({ declaration: 1 });
	});

	it("escapes pipe characters in comment values", () => {
		const comments = { declaration: { id: "A | B" } };
		const { output } = processMarkdown(MINIMAL_MD, comments);
		expect(output).toContain("| id | varchar(255) | false | A \\| B |");
	});

	it("warns about tables in comments map not found in markdown", () => {
		const comments = { nonexistent: { col: "val" } };
		const { warningTables } = processMarkdown(MINIMAL_MD, comments);
		expect(warningTables).toEqual(["nonexistent"]);
	});

	it("does not warn about tables that are present in markdown", () => {
		const comments = { declaration: { id: "ok" } };
		const { warningTables } = processMarkdown(MINIMAL_MD, comments);
		expect(warningTables).toEqual([]);
	});

	it("is idempotent: re-running does not duplicate the Commentaire column", () => {
		const comments = { declaration: { id: "some comment" } };
		const { output: first } = processMarkdown(MINIMAL_MD, comments);
		const { output: second } = processMarkdown(first, comments);
		expect(second).toBe(first);
	});

	it("handles ### section headers (triple hash)", () => {
		const md = `### app_declaration\n\n| column | type |\n| --- | --- |\n| id | varchar |\n`;
		const { output } = processMarkdown(md, {});
		expect(output).toContain("| column | type | Commentaire |");
	});

	it("leaves non-table prose sections unchanged", () => {
		const md = `# Title\n\nSome prose text.\n\n## app_user\n\n| col | type |\n| --- | --- |\n| id | varchar |\n`;
		const { output } = processMarkdown(md, {});
		expect(output).toContain("Some prose text.");
		expect(output).toContain("| col | type | Commentaire |");
	});

	it("handles multiple tables with partial comment coverage", () => {
		const comments = { declaration: { id: "decl id" } };
		const { output, injectedByTable } = processMarkdown(MINIMAL_MD, comments);
		expect(output).toContain("| id | varchar(255) | false | decl id |");
		expect(injectedByTable).toEqual({ declaration: 1 });
		const userSection = output.split("## app_user")[1];
		expect(userSection).toContain("| column | type | nullable | Commentaire |");
		expect(userSection).toContain("| id | varchar(255) | false |  |");
	});
});
