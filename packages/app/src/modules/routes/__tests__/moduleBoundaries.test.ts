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

// Why this module is its own tree rather than constants hung off each feature
// barrel: it must stay importable from a client component without dragging a
// server module in behind it. `my-space/declarationProcessState.ts` used to
// import `declaration-representation/steps` through the submodule for exactly
// that reason — this test is what keeps the workaround unnecessary.
describe("the routes module stays free of runtime dependencies", () => {
	const files = sourceFiles(MODULE_ROOT);

	it("has source files to check", () => {
		expect(files.length).toBeGreaterThan(5);
	});

	it.each(
		files.map((file) => [file.slice(MODULE_ROOT.length + 1), file]),
	)("%s imports nothing but strings", (_name, file) => {
		const source = readFileSync(file, "utf-8");
		for (const match of source.matchAll(IMPORT_RE)) {
			const specifier = match[2];
			if (specifier === undefined || specifier.startsWith(".")) continue;
			const kind = match[1] === undefined ? "value" : "type";
			// The only outside name the module needs is Next's `Route` type, and
			// it is erased at compile time.
			expect(
				`${specifier} (${kind})`,
				`unexpected import in ${file}: ${match[0]}`,
			).toBe("next (type)");
		}
	});
});
