/**
 * Post-process the Markdown produced by `db-schema-toolkit export` to inject
 * column-level comments from `schema-comments.ts` before publishing to the
 * GitHub Wiki.
 *
 * Run from the repo root:
 *   node --import ./packages/app/node_modules/tsx/dist/esm/index.mjs \
 *     packages/app/scripts/post-process-schema-wiki.mjs
 *
 * Reads `schema-doc.md` in the CWD and overwrites it in place.
 */

// tsx/esm is registered via --import flag at invocation time.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { SCHEMA_COLUMN_COMMENTS } = await import(
	resolve(__dirname, "../src/server/db/schema-comments.ts")
);
const { injectComments } = await import(
	resolve(__dirname, "../src/server/db/schemaWikiHelpers.ts")
);

const SCHEMA_DOC_PATH = resolve(process.cwd(), "schema-doc.md");

if (!existsSync(SCHEMA_DOC_PATH)) {
	console.error(`Error: schema-doc.md not found at ${SCHEMA_DOC_PATH}`);
	process.exit(1);
}

const content = readFileSync(SCHEMA_DOC_PATH, "utf8");
const lines = content.split("\n");

// Track totals for end-of-run summary.
const totalByTable = {};
const missingTables = [];

const result = [];
let i = 0;

while (i < lines.length) {
	const line = lines[i];

	// Match table section headers: "## Table: <tableName>"
	const tableMatch = line.match(/^##\s+Table:\s+(\S+)/);
	if (tableMatch) {
		const tableName = tableMatch[1];
		const tableKey = tableName.replace(/^app_/, "");
		const columnComments = SCHEMA_COLUMN_COMMENTS[tableKey];

		result.push(line);
		i++;

		// Skip blank lines between the section header and the Markdown table.
		while (i < lines.length && lines[i].trim() === "") {
			result.push(lines[i]);
			i++;
		}

		if (!columnComments) {
			// No comments defined for this table — move on without processing.
			continue;
		}

		// Collect all lines belonging to the Markdown table that follows.
		const tableLines = [];
		while (i < lines.length && lines[i].startsWith("|")) {
			tableLines.push(lines[i]);
			i++;
		}

		if (tableLines.length === 0) {
			// Section header found but no table — warn and move on.
			console.warn(
				`Warning: table section "${tableName}" has no Markdown table body.`,
			);
			continue;
		}

		const { lines: injectedLines, injected } = injectComments(
			tableLines,
			columnComments,
		);
		totalByTable[tableKey] = injected;
		result.push(...injectedLines);
		continue;
	}

	result.push(line);
	i++;
}

// Warn about map entries whose table is absent from the Markdown.
for (const tableKey of Object.keys(SCHEMA_COLUMN_COMMENTS)) {
	if (totalByTable[tableKey] === undefined) {
		missingTables.push(tableKey);
		console.warn(
			`Warning: table "${tableKey}" is in SCHEMA_COLUMN_COMMENTS but was not found in schema-doc.md.`,
		);
	}
}

writeFileSync(SCHEMA_DOC_PATH, result.join("\n"), "utf8");

const totalInjected = Object.values(totalByTable).reduce((a, b) => a + b, 0);
console.log(
	`Injected ${totalInjected} comment(s) across ${Object.keys(totalByTable).length} table(s).`,
);
for (const [table, count] of Object.entries(totalByTable)) {
	console.log(`  ${table}: ${count} comment(s)`);
}
if (missingTables.length > 0) {
	console.warn(
		`Tables in map not found in Markdown: ${missingTables.join(", ")}`,
	);
}
