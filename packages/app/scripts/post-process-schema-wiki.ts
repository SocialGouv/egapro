/**
 * Post-processes the Markdown file produced by `db-schema-toolkit export` to
 * inject column-level comments from `schema-comments.ts` before publishing to
 * the GitHub Wiki.
 *
 * Usage (from repo root):
 *   npx tsx packages/app/scripts/post-process-schema-wiki.ts
 *
 * Reads `schema-doc.md` from the current working directory and overwrites it
 * in-place with an extra "Commentaire" column in each table.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SchemaColumnComments } from "../src/server/db/schema-comments";
import { SCHEMA_COLUMN_COMMENTS } from "../src/server/db/schema-comments";

const TABLE_HEADER_RE = /^##\s+Table:\s+(\w+)/;
const TABLE_ROW_RE = /^\|/;
const SEPARATOR_CELL_RE = /^-+$/;
const COMMENT_COLUMN_HEADER = "Commentaire";

function camelToSnake(name: string): string {
	return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export type InjectionResult = {
	result: string;
	stats: Record<string, number>;
	warnings: string[];
};

export function injectComments(
	markdown: string,
	comments: SchemaColumnComments,
): InjectionResult {
	const lines = markdown.split("\n");
	const output: string[] = [];
	const stats: Record<string, number> = {};
	const warnings: string[] = [];

	let currentTable: string | null = null;
	let seenTableHeader = false;
	let seenSeparator = false;
	let hasCommentColumn = false;

	for (const line of lines) {
		const sectionMatch = TABLE_HEADER_RE.exec(line);
		if (sectionMatch) {
			currentTable = sectionMatch[1] ?? null;
			seenTableHeader = false;
			seenSeparator = false;
			hasCommentColumn = false;
			output.push(line);
			continue;
		}

		if (currentTable !== null && TABLE_ROW_RE.test(line)) {
			const cells = line
				.split("|")
				.slice(1, -1)
				.map((c) => c.trim());

			if (!seenTableHeader) {
				hasCommentColumn = cells.includes(COMMENT_COLUMN_HEADER);
				seenTableHeader = true;
				output.push(
					hasCommentColumn
						? line
						: line.replace(/\|$/, `| ${COMMENT_COLUMN_HEADER} |`),
				);
				continue;
			}

			if (!seenSeparator) {
				seenSeparator = true;
				const allDashes = cells.every((c) => SEPARATOR_CELL_RE.test(c));
				output.push(
					allDashes && !hasCommentColumn
						? line.replace(/\|$/, "| --- |")
						: line,
				);
				continue;
			}

			if (!hasCommentColumn) {
				const rawColName = cells[0] ?? "";
				const colKey = camelToSnake(rawColName);
				const tableComments = comments[currentTable];
				const rawComment = tableComments?.[colKey] ?? "";
				const comment = rawComment.replace(/\|/g, "\\|");
				if (rawComment) {
					stats[currentTable] = (stats[currentTable] ?? 0) + 1;
				}
				output.push(line.replace(/\|$/, `| ${comment} |`));
				continue;
			}
		} else if (currentTable !== null && !TABLE_ROW_RE.test(line)) {
			seenTableHeader = false;
			seenSeparator = false;
			hasCommentColumn = false;
		}

		output.push(line);
	}

	for (const tableName of Object.keys(comments)) {
		const hasEntries = Object.keys(comments[tableName] ?? {}).length > 0;
		const injectedCount = stats[tableName] ?? 0;
		if (hasEntries && injectedCount === 0) {
			warnings.push(
				`Table "${tableName}" in SCHEMA_COLUMN_COMMENTS not found in Markdown`,
			);
		}
	}

	return { result: output.join("\n"), stats, warnings };
}

async function main(): Promise<void> {
	const inputPath = "schema-doc.md";
	if (!existsSync(inputPath)) {
		console.error(
			`Error: ${inputPath} not found. Run db-schema-toolkit export first.`,
		);
		process.exit(1);
	}

	const markdown = readFileSync(inputPath, "utf8");
	const { result, stats, warnings } = injectComments(
		markdown,
		SCHEMA_COLUMN_COMMENTS,
	);

	for (const warning of warnings) {
		console.warn(`[warn] ${warning}`);
	}

	for (const [table, count] of Object.entries(stats)) {
		console.log(`  ${table}: ${count} comment(s) injected`);
	}
	const totalComments = Object.values(stats).reduce((a, b) => a + b, 0);
	console.log(
		`Total: ${totalComments} comment(s) injected across ${Object.keys(stats).length} table(s)`,
	);

	writeFileSync(inputPath, result, "utf8");
	console.log(`Wrote ${inputPath}`);
}

const isMain =
	typeof process !== "undefined" &&
	process.argv[1] !== undefined &&
	fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
	main().catch((err: unknown) => {
		console.error(err);
		process.exit(1);
	});
}
