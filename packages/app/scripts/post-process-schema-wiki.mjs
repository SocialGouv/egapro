/**
 * Post-processes the Markdown produced by `db-schema-toolkit export` to inject
 * SUIT / GIP-MDS column-level documentation from `schema-comments.ts`.
 *
 * Reads `schema-doc.md` from the repo root (CWD in CI), enriches every table's
 * column table with a "Commentaire" column sourced from `SCHEMA_COLUMN_COMMENTS`,
 * then overwrites the file.
 *
 * The script is intentionally self-contained (no dynamic TypeScript imports) so
 * it can run with plain Node.js. The same processing logic lives in
 * `src/server/db/postProcessSchemaWiki.ts` and is covered by Vitest unit tests.
 *
 * Usage (CI workflow, from repo root):
 *   pnpm --filter app run post-process-schema-wiki
 *
 * Usage (local, from packages/app):
 *   pnpm run post-process-schema-wiki
 *
 * Issue: #3312 — post-processing infrastructure for DB schema wiki.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// ---------------------------------------------------------------------------
// Inline processing logic (mirrors postProcessSchemaWiki.ts — kept in sync)
// ---------------------------------------------------------------------------

/** @param {string} str */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} text
 * @returns {number}
 */
function findFirstTableEnd(text) {
	const m = /\|[^\n]+\|\n(?:\|[-|]+\|\n)(?:\|[^\n]+\|\n)*/.exec(text);
	return m ? m.index + m[0].length : text.length;
}

/**
 * @param {string} row
 * @returns {string[]}
 */
function parseTableRow(row) {
	return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
}

/**
 * @param {string} markdown
 * @param {string} tableName
 * @returns {{ sectionStart: number; sectionEnd: number } | null}
 */
function locateSection(markdown, tableName) {
	const headerPattern = new RegExp(
		`^## Table:\\s+${escapeRegex(tableName)}\\s*$`,
		"m",
	);
	const match = headerPattern.exec(markdown);
	if (!match) return null;

	const sectionStart = match.index;
	const rest = markdown.slice(sectionStart + match[0].length);
	const nextMatch = /^## /m.exec(rest);
	const sectionEnd =
		nextMatch !== null
			? sectionStart + match[0].length + nextMatch.index
			: markdown.length;

	return { sectionStart, sectionEnd };
}

/**
 * @param {string} markdown
 * @param {string} tableName
 * @param {Record<string, string>} columnComments
 * @returns {{ markdown: string; injected: number }}
 */
function injectTableComments(markdown, tableName, columnComments) {
	const fullMatch = locateSection(markdown, tableName);
	if (!fullMatch) return { markdown, injected: 0 };

	const { sectionStart, sectionEnd } = fullMatch;
	let section = markdown.slice(sectionStart, sectionEnd);
	const before = markdown.slice(0, sectionStart);
	const after = markdown.slice(sectionEnd);

	const firstTableEnd = findFirstTableEnd(section);
	const columnsRegion = section.slice(0, firstTableEnd);
	if (/\|\s*Commentaire\s*\|/.test(columnsRegion)) {
		return { markdown, injected: 0 };
	}

	const tableRegex = /(\|[^\n]+\|\n)(\|[-|]+\|\n)((?:\|[^\n]+\|\n)*)/;
	let injected = 0;

	const tableMatch = tableRegex.exec(section);
	if (!tableMatch) return { markdown, injected: 0 };

	const headerRow = tableMatch[1] ?? "";
	const sepRow = tableMatch[2] ?? "";
	const bodyRows = tableMatch[3] ?? "";

	const newHeader = headerRow.trimEnd().replace(/\|$/, "| Commentaire |\n");
	const newSep = sepRow.trimEnd().replace(/\|$/, "|-------------||\n");

	const headers = parseTableRow(headerRow);
	const colIdx = headers.findIndex((h) => /^column$/i.test(h.trim()));

	const newBody = bodyRows.replace(/(\|[^\n]+\|)\n/g, (rowLine) => {
		const cells = parseTableRow(rowLine);
		const columnName =
			colIdx >= 0 && colIdx < cells.length ? (cells[colIdx] ?? "").trim() : "";
		const comment = columnComments[columnName] ?? "";
		if (comment) injected++;
		return rowLine.trimEnd().replace(/\|$/, `| ${comment} |\n`);
	});

	const originalTable = tableMatch[0];
	section = section.replace(originalTable, newHeader + newSep + newBody);
	return { markdown: before + section + after, injected };
}

/**
 * @param {string} markdown
 * @param {Record<string, Record<string, string>>} comments
 * @returns {{ result: string; stats: Record<string, number> }}
 */
function processMarkdown(markdown, comments) {
	let result = markdown;
	/** @type {Record<string, number>} */
	const stats = {};

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
// Load column comments from the TypeScript source via tsx
// ---------------------------------------------------------------------------

// tsx is registered as a loader by the pnpm script (`tsx scripts/...`), so
// static-style imports of .ts files work transparently.
const { SCHEMA_COLUMN_COMMENTS } = await import(
	"../src/server/db/schema-comments.ts"
);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

// schema-doc.md is generated at the repo root by db-schema-toolkit.
// When the script is run via `pnpm run` from packages/app, process.cwd() is
// packages/app — so we also look up to the repo root as fallback.
// __dirname = packages/app/scripts/ → ../../../ = repo root.
const cwdPath = resolve(process.cwd(), "schema-doc.md");
const repoRootPath = resolve(__dirname, "../../../schema-doc.md");
const schemaDocPath = existsSync(cwdPath) ? cwdPath : repoRootPath;

if (!existsSync(schemaDocPath)) {
	console.error(
		`[post-process-schema-wiki] error: schema-doc.md not found at ${schemaDocPath}`,
	);
	process.exit(1);
}

const markdown = readFileSync(schemaDocPath, "utf8");
const { result, stats } = processMarkdown(markdown, SCHEMA_COLUMN_COMMENTS);

writeFileSync(schemaDocPath, result, "utf8");

const totalInjected = Object.values(stats).reduce((a, b) => a + b, 0);
console.log(
	`[post-process-schema-wiki] done: ${totalInjected} comment(s) injected across ${Object.keys(stats).length} table(s).`,
);
for (const [table, count] of Object.entries(stats)) {
	if (count > 0) {
		console.log(`  - ${table}: ${count} comment(s)`);
	}
}
