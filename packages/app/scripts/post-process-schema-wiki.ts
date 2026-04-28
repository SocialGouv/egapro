#!/usr/bin/env tsx
/**
 * Injects SUIT/GIP-MDS column comments from schema-comments.ts into the
 * Markdown produced by db-schema-toolkit before wiki publication.
 *
 * Usage: tsx packages/app/scripts/post-process-schema-wiki.ts
 * (called by the db-schema.yaml workflow after the db-schema-toolkit export step)
 *
 * Expects schema-doc.md in the current working directory (repo root).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEMA_COLUMN_COMMENTS } from "../src/server/db/schema-comments";

const SCHEMA_DOC_PATH = resolve(process.cwd(), "schema-doc.md");

if (!existsSync(SCHEMA_DOC_PATH)) {
	console.error(`Error: schema-doc.md not found at ${SCHEMA_DOC_PATH}`);
	console.error("Run db-schema-toolkit export before this script.");
	process.exit(1);
}

/** Convert camelCase to snake_case for comment map lookup. */
function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

const lines = readFileSync(SCHEMA_DOC_PATH, "utf8").split("\n");
const output: string[] = [];

let currentTable: string | null = null;
let inTable = false;
let headerProcessed = false;
let totalInjected = 0;
const warnedTables = new Set<string>();

for (const line of lines) {
	// db-schema-toolkit produces headers like: ## Table: declaration
	const headerMatch = /^#{2,3}\s+(?:Table:\s+)?(\w+)/.exec(line);
	if (headerMatch) {
		currentTable = headerMatch[1] ?? null;
		inTable = false;
		headerProcessed = false;
		output.push(line);
		continue;
	}

	// Detect markdown table separator row (e.g. |---|---|---|)
	if (currentTable && /^\|[-| :]+\|$/.test(line)) {
		if (!inTable) {
			inTable = true;
			const headerRowIndex = output.length - 1;
			const headerRow = output[headerRowIndex];

			if (headerRow?.startsWith("|")) {
				const cols = headerRow.split("|").map((c) => c.trim());
				const alreadyHasComment = cols.some(
					(c) => c === "Commentaire" || c === "Description",
				);

				if (!alreadyHasComment) {
					output[headerRowIndex] = headerRow.replace(/\|$/, "| Commentaire |");
					output.push(line.replace(/\|$/, "| --- |"));
					headerProcessed = true;
					continue;
				}
			}
		}
		output.push(line);
		continue;
	}

	// Process data rows in the current table
	if (inTable && currentTable && line.startsWith("|")) {
		const cells = line.split("|");
		// cells layout: ["", col1, col2, ..., ""]
		const colNameRaw = cells[1]?.trim() ?? "";
		const colSnake = toSnakeCase(colNameRaw);
		const tableComments = SCHEMA_COLUMN_COMMENTS[currentTable];
		const comment = tableComments?.[colSnake] ?? "";

		if (comment) {
			totalInjected++;
		}

		const safeComment = comment.replace(/\|/g, "\\|");

		if (headerProcessed) {
			output.push(line.replace(/\|$/, `| ${safeComment} |`));
		} else {
			output.push(line);
		}
		continue;
	}

	// End of table block (blank line or new section)
	if (inTable && !line.startsWith("|")) {
		inTable = false;
		headerProcessed = false;
	}

	output.push(line);
}

// Warn about map entries with no matching table in the Markdown
const fullDoc = readFileSync(SCHEMA_DOC_PATH, "utf8");
for (const tableName of Object.keys(SCHEMA_COLUMN_COMMENTS)) {
	if (!fullDoc.includes(tableName) && !warnedTables.has(tableName)) {
		warnedTables.add(tableName);
		console.warn(
			`WARN: table "${tableName}" found in schema-comments.ts but not in schema-doc.md`,
		);
	}
}

writeFileSync(SCHEMA_DOC_PATH, output.join("\n"), "utf8");

console.log("Post-processing complete.");
console.log(`  Comments injected: ${totalInjected}`);

for (const [table, cols] of Object.entries(SCHEMA_COLUMN_COMMENTS)) {
	const count = Object.keys(cols).length;
	if (count > 0) {
		console.log(`  table "${table}": ${count} comment(s)`);
	}
}
