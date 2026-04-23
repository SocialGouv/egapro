/**
 * Pure processing functions for the DB schema wiki post-processing pipeline.
 *
 * These functions are consumed by `scripts/post-process-schema-wiki.mjs` (via
 * dynamic import with tsx) and unit-tested via Vitest.
 *
 * None of these functions perform I/O — they operate on strings only.
 *
 * db-schema-toolkit output format (v1.1.x):
 *   - Table sections open with `## Table: <camelCaseName>` (Drizzle field name,
 *     no `app_` prefix).
 *   - Sub-sections (Indexes, Foreign Keys) use `### …`.
 *   - Column tables use `|--------|------|---------|----|` style separators
 *     (dashes only, varying widths, no spaces inside cells).
 *   - Column names match the Drizzle field names (camelCase).
 *
 * Issue: #3312 — post-processing infrastructure for DB schema wiki.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses the Markdown produced by db-schema-toolkit and returns the list of
 * table names found. The toolkit emits `## Table: <name>` headers.
 */
export function parseTableNames(markdown: string): string[] {
	const tableNames: string[] = [];
	const headerRegex = /^## Table:\s+(\w+)\s*$/gm;
	let match = headerRegex.exec(markdown);
	while (match !== null) {
		const name = match[1];
		if (name !== undefined) tableNames.push(name);
		match = headerRegex.exec(markdown);
	}
	return tableNames;
}

/**
 * Splits a Markdown table row into its cells, trimming the surrounding `|`.
 */
export function parseTableRow(row: string): string[] {
	return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
}

/**
 * Locates the start and end byte offsets of a table section
 * (`## Table: <name>`) inside a Markdown string.
 */
export function locateSection(
	markdown: string,
	tableName: string,
): { sectionStart: number; sectionEnd: number } | null {
	const headerPattern = new RegExp(
		`^## Table:\\s+${escapeRegex(tableName)}\\s*$`,
		"m",
	);
	const match = headerPattern.exec(markdown);
	if (!match) return null;

	const sectionStart = match.index;

	// Section ends at the next `## ` header (same or higher level), or EOF.
	const rest = markdown.slice(sectionStart + match[0].length);
	const nextMatch = /^## /m.exec(rest);
	const sectionEnd =
		nextMatch !== null
			? sectionStart + match[0].length + nextMatch.index
			: markdown.length;

	return { sectionStart, sectionEnd };
}

/**
 * Injects a "Commentaire" column into a Markdown table section for a given
 * table name. If the column already exists it is left untouched (idempotent).
 *
 * The separator row style `|-----|------|` (dashes only, varying widths) is
 * matched with `\|[-|]+\|`.
 */
export function injectTableComments(
	markdown: string,
	tableName: string,
	columnComments: Record<string, string>,
): { markdown: string; injected: number } {
	const fullMatch = locateSection(markdown, tableName);
	if (!fullMatch) return { markdown, injected: 0 };

	const { sectionStart, sectionEnd } = fullMatch;
	let section = markdown.slice(sectionStart, sectionEnd);
	const before = markdown.slice(0, sectionStart);
	const after = markdown.slice(sectionEnd);

	// Check if "Commentaire" column already exists in the columns table of
	// this section (only the first table — the column list).
	const firstTableEnd = findFirstTableEnd(section);
	const columnsRegion = section.slice(0, firstTableEnd);
	if (/\|\s*Commentaire\s*\|/.test(columnsRegion)) {
		return { markdown, injected: 0 };
	}

	// Match only the first Markdown table in the section (the column list).
	// Separator style: |-----|------|  (dashes only, no spaces, varying widths).
	const tableRegex = /(\|[^\n]+\|\n)(\|[-|]+\|\n)((?:\|[^\n]+\|\n)*)/;
	let injected = 0;

	const tableMatch = tableRegex.exec(section);
	if (!tableMatch) return { markdown, injected: 0 };

	// Groups are guaranteed by the regex — guard for noUncheckedIndexedAccess.
	const headerRow = tableMatch[1] ?? "";
	const sepRow = tableMatch[2] ?? "";
	const bodyRows = tableMatch[3] ?? "";

	// Add header column.
	const newHeader = headerRow.trimEnd().replace(/\|$/, "| Commentaire |\n");

	// Add separator column.
	const newSep = sepRow.trimEnd().replace(/\|$/, "|-------------||\n");

	// Determine the column index for "Column" in the header.
	const headers = parseTableRow(headerRow);
	const colIdx = headers.findIndex((h) => /^column$/i.test(h.trim()));

	// Add data to body rows.
	const newBody = bodyRows.replace(/(\|[^\n]+\|)\n/g, (rowLine: string) => {
		const cells = parseTableRow(rowLine);
		const columnName =
			colIdx >= 0 && colIdx < cells.length ? (cells[colIdx] ?? "").trim() : "";
		const comment = columnComments[columnName] ?? "";
		if (comment) injected++;
		return rowLine.trimEnd().replace(/\|$/, `| ${comment} |\n`);
	});

	const originalTable = tableMatch[0];
	const replacedTable = newHeader + newSep + newBody;
	section = section.replace(originalTable, replacedTable);

	return { markdown: before + section + after, injected };
}

/**
 * Main post-processing function. Applies all comments from the provided map
 * to the Markdown content and returns the enriched result.
 *
 * Tables in the map that are not found in the Markdown produce a console.warn
 * but do not cause the function to throw.
 */
export function processMarkdown(
	markdown: string,
	comments: Record<string, Record<string, string>>,
): { result: string; stats: Record<string, number> } {
	let result = markdown;
	const stats: Record<string, number> = {};

	for (const [tableName, columnComments] of Object.entries(comments)) {
		const section = locateSection(result, tableName);
		if (!section) {
			console.warn(
				`[post-process-schema-wiki] warn: table "${tableName}" not found in schema-doc.md (skipped)`,
			);
			continue;
		}

		const { markdown: updated, injected } = injectTableComments(
			result,
			tableName,
			columnComments,
		);
		result = updated;
		stats[tableName] = injected;
	}

	return { result, stats };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the character offset where the first Markdown table in a string ends
 * (i.e. the position after the last `| … |\n` row of the first table).
 * Returns the full string length when no table is found.
 */
function findFirstTableEnd(text: string): number {
	const tableRegex = /\|[^\n]+\|\n(?:\|[-|]+\|\n)(?:\|[^\n]+\|\n)*/;
	const m = tableRegex.exec(text);
	if (!m) return text.length;
	return m.index + m[0].length;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
