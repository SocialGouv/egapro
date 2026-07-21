import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPT_PATH = join(APP_ROOT, "scripts/generate-test-inventory.mjs");

const { parseVitest, parsePlaywright, sectionLabel, buildInventoryMarkdown } =
	await import(SCRIPT_PATH);

describe("parseVitest", () => {
	it("keeps only real test files and splits file from the describe/it chain", () => {
		const output = [
			"src/modules/domain/__tests__/gap.test.ts > gap > computes the gap",
			"src/modules/admin/__tests__/bar.test.tsx > Bar > renders > shows title",
		].join("\n");
		expect(parseVitest(output)).toEqual([
			{
				file: "src/modules/domain/__tests__/gap.test.ts",
				title: "gap > computes the gap",
			},
			{
				file: "src/modules/admin/__tests__/bar.test.tsx",
				title: "Bar > renders > shows title",
			},
		]);
	});

	it("filters interleaved noise (DB NOTICE objects, non-test files)", () => {
		const output = [
			"{",
			"  severity_local: 'NOTICE',",
			"  message: 'identifier will be truncated',",
			"}",
			"not-a-test-file.ts > something > x",
			"src/server/api/__tests__/baz.test.ts > baz > works",
		].join("\n");
		expect(parseVitest(output)).toEqual([
			{ file: "src/server/api/__tests__/baz.test.ts", title: "baz > works" },
		]);
	});

	it("returns an empty list for null output (command unavailable)", () => {
		expect(parseVitest(null)).toEqual([]);
	});
});

describe("parsePlaywright", () => {
	it("strips project + location, dedupes tests listed under several projects", () => {
		const output = [
			"Listing tests:",
			"  [setup] › auth.setup.ts:5:1 › authenticate",
			"  [chromium] › admin.e2e.ts:8:2 › admin access › reaches /admin",
			"  [chromium] › admin.e2e.ts:16:2 › admin access › reaches /admin/x",
			"  [logout] › admin.e2e.ts:8:2 › admin access › reaches /admin",
			"Total: 3 tests in 2 files",
		].join("\n");
		expect(parsePlaywright(output)).toEqual([
			{ file: "auth.setup.ts", title: "authenticate" },
			{ file: "admin.e2e.ts", title: "admin access › reaches /admin" },
			{ file: "admin.e2e.ts", title: "admin access › reaches /admin/x" },
		]);
	});
});

describe("sectionLabel", () => {
	it("maps known domain prefixes to French labels", () => {
		expect(
			sectionLabel("src/modules/domain/__tests__/gap.test.ts", false),
		).toBe("Règles métier (domaine)");
		expect(sectionLabel("any.e2e.ts", true)).toBe("Scénarios E2E");
	});

	it("falls back to the module path for an unmapped module (never dropped)", () => {
		expect(
			sectionLabel("src/modules/unknownmod/__tests__/x.test.ts", false),
		).toBe("src/modules/unknownmod");
	});
});

describe("buildInventoryMarkdown", () => {
	const fixture = {
		unit: [
			{
				file: "src/modules/domain/__tests__/gap.test.ts",
				title: "gap > computes",
			},
			{
				file: "src/modules/unknownmod/__tests__/x.test.ts",
				title: "x > works",
			},
		],
		integration: [
			{
				file: "src/server/audit/__tests__/cleanup.integration.test.ts",
				title: "cleanup > deletes old rows",
			},
		],
		e2e: [{ file: "admin.e2e.ts", title: "admin access › reaches /admin" }],
		generatedOn: "2026-01-01",
	};

	it("renders totals, the generation date and French section labels", () => {
		const md = buildInventoryMarkdown(fixture);
		expect(md).toContain("_Généré le 2026-01-01._");
		expect(md).toContain("| Tests unitaires | 2 | 2 |");
		expect(md).toContain("| Scénarios E2E | 1 | 1 |");
		expect(md).toContain("### Règles métier (domaine)");
		expect(md).toContain("### Scénarios E2E");
		// Unmapped module still appears under its raw path (S3 fallback).
		expect(md).toContain("### src/modules/unknownmod");
	});

	it("is deterministic for a fixed input (idempotence at the pure layer)", () => {
		expect(buildInventoryMarkdown(fixture)).toBe(
			buildInventoryMarkdown(fixture),
		);
	});

	it("shows a warning banner when a source is unavailable", () => {
		const md = buildInventoryMarkdown({
			...fixture,
			integrationAvailable: false,
		});
		expect(md).toContain("⚠️");
		expect(md).toContain("tests d'intégration n'a pas pu être récupérée");
	});
});
