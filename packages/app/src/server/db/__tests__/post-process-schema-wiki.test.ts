import { describe, expect, it } from "vitest";
import { injectComments } from "#scripts/post-process-schema-wiki";

const TABLE_SECTION = `## Table: declaration

| Column | Type | Nullable | PK | Unique | Default |
|--------|------|----------|----|--------|---------|
| id | VARCHAR | No | Yes |  |  |
| indicatorAAnnualWomen | NUMERIC | Yes |  |  |  |
| indicatorAAnnualMen | NUMERIC | Yes |  |  |  |

`;

describe("injectComments", () => {
	it("adds Commentaire column to table header and separator", () => {
		const { result } = injectComments(TABLE_SECTION, {});
		expect(result).toContain("| Commentaire |");
		expect(result).toContain("| --- |");
	});

	it("injects comment for matched column (snake_case lookup)", () => {
		const comments = {
			declaration: {
				indicator_a_annual_women:
					"GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F",
			},
		};
		const { result, stats } = injectComments(TABLE_SECTION, comments);
		expect(result).toContain(
			"GIP-MDS \\| SUIT: Rem_globale_annuelle_moyenne_F",
		);
		expect(stats["declaration"]).toBe(1);
	});

	it("leaves empty cell for columns not in the map", () => {
		const comments = { declaration: {} };
		const { result } = injectComments(TABLE_SECTION, comments);
		expect(result).toMatch(/indicatorAAnnualWomen \|.*\| {2}\|$/m);
	});

	it("does not add a second Commentaire column when already present", () => {
		const markdownWithComment = `## Table: declaration

| Column | Type | Commentaire |
|--------|------|-------------|
| id | VARCHAR |  |

`;
		const { result } = injectComments(markdownWithComment, {});
		const headerLine = result
			.split("\n")
			.find((l) => l.includes("Column") && l.includes("Type"));
		const occurrences = (headerLine ?? "").split("Commentaire").length - 1;
		expect(occurrences).toBe(1);
	});

	it("warns about map tables not found in Markdown", () => {
		const comments = {
			nonexistent: { some_col: "comment" },
		};
		const { warnings } = injectComments(TABLE_SECTION, comments);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("nonexistent");
	});

	it("does not warn when map table has no entries", () => {
		const comments = { nonexistent: {} };
		const { warnings } = injectComments(TABLE_SECTION, comments);
		expect(warnings).toHaveLength(0);
	});

	it("handles multiple tables in the same Markdown", () => {
		const multiTable = `## Table: declaration

| Column | Type |
|--------|------|
| id | VARCHAR |

## Table: company

| Column | Type |
|--------|------|
| siren | VARCHAR |

`;
		const comments = {
			declaration: { id: "Primary key" },
			company: { siren: "SIREN identifier" },
		};
		const { result, stats } = injectComments(multiTable, comments);
		expect(result).toContain("Primary key");
		expect(result).toContain("SIREN identifier");
		expect(stats["declaration"]).toBe(1);
		expect(stats["company"]).toBe(1);
	});

	it("returns empty stats when no comments match", () => {
		const { stats } = injectComments(TABLE_SECTION, {});
		expect(Object.keys(stats)).toHaveLength(0);
	});

	it("is idempotent when called twice with an already-processed Markdown", () => {
		const comments = {
			declaration: { indicator_a_annual_women: "GIP-MDS" },
		};
		const { result: firstPass } = injectComments(TABLE_SECTION, comments);
		const { result: secondPass } = injectComments(firstPass, comments);
		expect(firstPass).toBe(secondPass);
	});

	it("passes through non-table lines unchanged", () => {
		const input = `# schema\n\n**Tables:** 1\n\n${TABLE_SECTION}`;
		const { result } = injectComments(input, {});
		expect(result).toContain("# schema");
		expect(result).toContain("**Tables:** 1");
	});
});
