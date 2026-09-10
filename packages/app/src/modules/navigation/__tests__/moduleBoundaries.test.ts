import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MODULE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			return entry.name === "__tests__" ? [] : sourceFiles(path);
		}
		return entry.name.endsWith(".ts") ? [path] : [];
	});
}

const IMPORT_RE = /^import\s+(type\s+)?[^"']*from\s+"([^"]+)";$/gm;

// Modelled on `routes/__tests__/moduleBoundaries.test.ts`, and for the same
// reason: Mon espace and `app/avis-cse` must be able to import this table from a
// client component without a server module coming in behind it. That is the
// whole point of hosting it here rather than in `declaration-remuneration`.
//
// Two specifiers are allowed and no more: `~/modules/routes` (strings, itself
// runtime-free) and `~/modules/domain` as **types only** — the domain is pure,
// but a value import would make this module a runtime edge into it for nothing.
const ALLOWED_IMPORTS = new Set([
	"~/modules/routes (value)",
	"~/modules/routes (type)",
	"~/modules/domain (type)",
]);

describe("the navigation module stays free of runtime dependencies", () => {
	const files = sourceFiles(MODULE_ROOT);

	it("has source files to check", () => {
		expect(files.length).toBeGreaterThan(1);
	});

	it.each(
		files.map((file) => [file.slice(MODULE_ROOT.length + 1), file]),
	)("%s imports nothing but routes and domain types", (_name, file) => {
		const source = readFileSync(file, "utf-8");
		for (const match of source.matchAll(IMPORT_RE)) {
			const specifier = match[2];
			if (specifier === undefined || specifier.startsWith(".")) continue;
			const kind = match[1] === undefined ? "value" : "type";
			expect(
				ALLOWED_IMPORTS.has(`${specifier} (${kind})`),
				`unexpected import in ${file}: ${match[0]}`,
			).toBe(true);
		}
	});
});
