/**
 * Post-processes the Markdown produced by `db-schema-toolkit export` to inject
 * SUIT / GIP-MDS column-level documentation from `schema-comments.ts`.
 *
 * The script reads `schema-doc.md` from the CWD (repo root in CI), enriches
 * every table's column table with a "Commentaire" column sourced from
 * `SCHEMA_COLUMN_COMMENTS`, then overwrites the file.
 *
 * The pure processing logic lives in `src/server/db/postProcessSchemaWiki.ts`
 * and is loaded here via tsx (registered as an ESM loader).
 *
 * Usage (CI workflow, from repo root):
 *   pnpm --filter app run post-process-schema-wiki
 *
 * Usage (local, from repo root):
 *   pnpm --filter app run post-process-schema-wiki
 *
 * Issue: #3312 — post-processing infrastructure for DB schema wiki.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// ---------------------------------------------------------------------------
// Load TypeScript modules (tsx must be registered as an ESM loader).
// ---------------------------------------------------------------------------

/** @type {import("../src/server/db/schema-comments.js")} */
const { SCHEMA_COLUMN_COMMENTS } = await import(
	/* @vite-ignore */
	resolve(__dirname, "../src/server/db/schema-comments.ts")
);

/** @type {import("../src/server/db/postProcessSchemaWiki.js")} */
const { processMarkdown } = await import(
	/* @vite-ignore */
	resolve(__dirname, "../src/server/db/postProcessSchemaWiki.ts")
);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

// schema-doc.md is generated at the repo root by db-schema-toolkit.
// When the script is run via `pnpm run` from packages/app, process.cwd() is
// packages/app — so we also look two levels up (repo root) as fallback.
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
