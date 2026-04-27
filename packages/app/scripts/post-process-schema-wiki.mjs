import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Escapes pipe characters in a Markdown table cell value.
 * @param {string} value
 * @returns {string}
 */
function escapeMdCell(value) {
	return value.replace(/\|/g, "\\|");
}

/**
 * Applies schema column comments to Markdown output from db-schema-toolkit.
 *
 * For each table present in `comments`, adds a "Commentaire" column to the
 * corresponding Markdown table. Tables absent from `comments` are left untouched.
 * Warns (to stderr) for each table key in `comments` that has no matching
 * section in the Markdown.
 *
 * @param {string} markdown - Raw Markdown from db-schema-toolkit
 * @param {Record<string, Record<string, string>>} comments - table → column → comment
 * @returns {string} Modified Markdown
 */
export function applySchemaComments(markdown, comments) {
	if (Object.keys(comments).length === 0) return markdown;

	const lines = markdown.split("\n");
	const result = [];
	const foundTables = new Set();

	let currentTableKey = null;
	let inMdTable = false;
	let headerSeen = false;
	let separatorSeen = false;
	let hasCommentaire = false;

	for (const line of lines) {
		// Detect section headers: ## app_xxx or ### app_xxx
		const headerMatch = line.match(/^#{2,3}\s+(app_\w+)\b/);
		if (headerMatch) {
			const fullName = headerMatch[1]; // e.g. "app_declaration"
			const key = fullName.slice(4); // strip "app_" prefix → "declaration"
			currentTableKey = key in comments ? key : null;
			if (currentTableKey) foundTables.add(currentTableKey);
			inMdTable = false;
			headerSeen = false;
			separatorSeen = false;
			hasCommentaire = false;
			result.push(line);
			continue;
		}

		if (currentTableKey !== null && line.startsWith("|")) {
			if (!inMdTable) {
				inMdTable = true;
				// Check idempotency: if "Commentaire" header already present, skip this table
				hasCommentaire = /\|\s*[Cc]ommentaire\s*\|/.test(line);
			}

			if (hasCommentaire) {
				result.push(line);
				continue;
			}

			if (!headerSeen) {
				// Column header row (e.g. "| name | type | ...")
				headerSeen = true;
				result.push(line.trimEnd() + " | Commentaire |");
				continue;
			}

			if (!separatorSeen) {
				// Separator row (e.g. "| --- | --- | ...")
				separatorSeen = true;
				result.push(line.trimEnd() + " --- |");
				continue;
			}

			// Data row: extract first cell (column name) and inject comment
			const firstCellMatch = line.match(/^\|\s*([^|]+?)\s*\|/);
			const columnName = firstCellMatch?.[1]?.trim() ?? "";
			const tableComments = comments[currentTableKey];
			const comment =
				tableComments && columnName && columnName in tableComments
					? escapeMdCell(tableComments[columnName])
					: "";
			result.push(line.trimEnd() + ` | ${comment} |`);
			continue;
		} else if (inMdTable && !line.startsWith("|")) {
			// End of Markdown table
			inMdTable = false;
			headerSeen = false;
			separatorSeen = false;
		}

		result.push(line);
	}

	// Warn for table keys not found in the Markdown
	for (const key of Object.keys(comments)) {
		if (!foundTables.has(key)) {
			process.stderr.write(
				`[post-process-schema-wiki] WARNING: table "${key}" in SCHEMA_COLUMN_COMMENTS not found in Markdown (looked for "app_${key}" section header). Skipping.\n`,
			);
		}
	}

	return result.join("\n");
}

// ── Main entry point ──────────────────────────────────────────────────────────

const schemaDocPath = resolve(process.cwd(), "schema-doc.md");

let markdownContent;
try {
	markdownContent = readFileSync(schemaDocPath, "utf8");
} catch {
	process.stderr.write(
		`[post-process-schema-wiki] ERROR: cannot read ${schemaDocPath}. Run db-schema-toolkit first.\n`,
	);
	process.exit(1);
}

// Dynamic import of the TypeScript source (requires tsx loader at runtime).
// Invocation: npx tsx packages/app/scripts/post-process-schema-wiki.mjs
const commentsModulePath = join(__dirname, "../src/server/db/schema-comments.ts");
const { SCHEMA_COLUMN_COMMENTS } = await import(commentsModulePath);

const totalAnnotations = Object.values(SCHEMA_COLUMN_COMMENTS).reduce(
	(acc, cols) => acc + Object.keys(cols).length,
	0,
);

if (totalAnnotations === 0) {
	process.stdout.write(
		"[post-process-schema-wiki] INFO: SCHEMA_COLUMN_COMMENTS is empty — no annotations injected.\n",
	);
	process.exit(0);
}

const updated = applySchemaComments(markdownContent, SCHEMA_COLUMN_COMMENTS);
writeFileSync(schemaDocPath, updated, "utf8");

const injected = Object.entries(SCHEMA_COLUMN_COMMENTS)
	.map(([table, cols]) => `  app_${table}: ${Object.keys(cols).length} annotations`)
	.join("\n");
process.stdout.write(
	`[post-process-schema-wiki] OK — injected annotations:\n${injected}\n`,
);
