import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_OUTPUT_PATH,
	DEFAULT_RESULTS_PATH,
	parseArgs,
	resultsPathLabel,
} from "#scripts/report-grille";
import { reportWith } from "./helpers/playwrightReportFixture";

describe("parseArgs", () => {
	it("parses scope, commit and report-url flags", () => {
		expect(
			parseArgs([
				"--scope",
				"2030 uniquement",
				"--commit",
				"abc1234",
				"--report-url",
				"https://example.com",
			]),
		).toEqual({
			scope: "2030 uniquement",
			commit: "abc1234",
			reportUrl: "https://example.com",
			results: DEFAULT_RESULTS_PATH,
			out: DEFAULT_OUTPUT_PATH,
		});
	});

	it("parses --results and --out, defaulting the other flags", () => {
		expect(
			parseArgs(["--results", "/tmp/r.json", "--out", "/tmp/o.md"]),
		).toEqual({
			scope: "tous les cas",
			commit: "N/A",
			reportUrl: "playwright-report/html/index.html",
			results: "/tmp/r.json",
			out: "/tmp/o.md",
		});
	});

	it("falls back to the exported default paths when no path flags are provided", () => {
		expect(parseArgs([])).toEqual({
			scope: "tous les cas",
			commit: "N/A",
			reportUrl: "playwright-report/html/index.html",
			results: DEFAULT_RESULTS_PATH,
			out: DEFAULT_OUTPUT_PATH,
		});
	});

	it("anchors the default paths on the playwright-report/ files the grille config and workflow rely on", () => {
		const reportDir = join(process.cwd(), "playwright-report");
		expect(DEFAULT_RESULTS_PATH).toBe(join(reportDir, "grille-results.json"));
		expect(DEFAULT_OUTPUT_PATH).toBe(join(reportDir, "grille-recette.md"));
	});

	it("defaults a flag value to an empty string when it is the last token", () => {
		expect(parseArgs(["--scope"]).scope).toBe("");
	});

	it("ignores unknown flags", () => {
		expect(parseArgs(["--unknown", "value", "--commit", "deadbee"])).toEqual({
			scope: "tous les cas",
			commit: "deadbee",
			reportUrl: "playwright-report/html/index.html",
			results: DEFAULT_RESULTS_PATH,
			out: DEFAULT_OUTPUT_PATH,
		});
	});
});

describe("resultsPathLabel", () => {
	it("names the recette convention, not the absolute path, for the default results file", () => {
		expect(resultsPathLabel(DEFAULT_RESULTS_PATH)).toBe(
			"playwright-report/grille-results.json",
		);
	});

	it("names an injected results path as given", () => {
		expect(resultsPathLabel("/tmp/autre-recette.json")).toBe(
			"/tmp/autre-recette.json",
		);
	});
});

describe("main — CLI entrypoint", () => {
	// Every path used below lives under a fresh mkdtempSync() directory: the
	// suite must never read or write packages/app/playwright-report/, the
	// artefacts a real ten-minute recette run produces.
	function tempPaths() {
		const dir = mkdtempSync(join(tmpdir(), "report-grille-main-"));
		return {
			dir,
			results: join(dir, "grille-results.json"),
			out: join(dir, "grille-recette.md"),
		};
	}

	function fileSnapshot(path: string): string | null {
		return existsSync(path) ? readFileSync(path, "utf-8") : null;
	}

	beforeEach(() => {
		// Set for real on a GitHub runner: unstubbed, main() appends the whole report to the CI job summary.
		vi.stubEnv("GITHUB_STEP_SUMMARY", "");
	});

	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		process.argv = process.argv.slice(0, 2);
	});

	async function runMain(argv: string[]): Promise<void> {
		process.argv = ["node", "report-grille.ts", ...argv];
		vi.resetModules();
		await import("#scripts/report-grille");
	}

	it("writes to --results/--out and leaves the default playwright-report/ artefacts untouched", async () => {
		const before = {
			results: fileSnapshot(DEFAULT_RESULTS_PATH),
			out: fileSnapshot(DEFAULT_OUTPUT_PATH),
		};

		const { results, out } = tempPaths();
		writeFileSync(
			results,
			JSON.stringify(
				reportWith([
					{
						title: "grille [2030-249-CAS01]",
						tests: [
							{
								title: "t",
								ok: true,
								results: [{ status: "passed", duration: 5 }],
							},
						],
					},
				]),
			),
			"utf-8",
		);

		await runMain(["--results", results, "--out", out, "--scope", "probe"]);

		expect(readFileSync(out, "utf-8")).toContain(
			"# Recette métier — Grille 185 coordonnées",
		);

		expect(fileSnapshot(DEFAULT_RESULTS_PATH)).toBe(before.results);
		expect(fileSnapshot(DEFAULT_OUTPUT_PATH)).toBe(before.out);
	});

	it("does not write the output file when the module is imported without direct invocation", async () => {
		const { out } = tempPaths();
		process.argv = ["node", "/fake/test-runner", "--out", out];
		vi.resetModules();
		await import("#scripts/report-grille");
		expect(existsSync(out)).toBe(false);
	});

	it("creates a nonexistent output subfolder and writes the report", async () => {
		const { dir, results } = tempPaths();
		const nestedOut = join(dir, "nested", "sub", "grille-recette.md");
		writeFileSync(results, JSON.stringify(reportWith([])), "utf-8");

		await runMain(["--results", results, "--out", nestedOut]);

		expect(existsSync(nestedOut)).toBe(true);
	});

	it("writes the report and the GitHub step summary from a real results file", async () => {
		const { results, out } = tempPaths();
		const summaryPath = join(
			mkdtempSync(join(tmpdir(), "gh-summary-")),
			"summary.md",
		);
		writeFileSync(summaryPath, "", "utf-8");
		vi.stubEnv("GITHUB_STEP_SUMMARY", summaryPath);
		writeFileSync(
			results,
			JSON.stringify(
				reportWith([
					{
						title: "grille [2030-249-CAS01]",
						tests: [
							{
								title: "t",
								ok: true,
								results: [{ status: "passed", duration: 5 }],
							},
						],
					},
				]),
			),
			"utf-8",
		);

		await runMain([
			"--results",
			results,
			"--out",
			out,
			"--scope",
			"probe",
			"--commit",
			"abc1234",
			"--report-url",
			"http://x",
		]);

		expect(readFileSync(out, "utf-8")).toContain(
			"# Recette métier — Grille 185 coordonnées",
		);
		const summary = readFileSync(summaryPath, "utf-8");
		expect(summary).toContain("# Recette métier — Grille 185 coordonnées");
		expect(summary).toContain("| probe |");
	});

	it("reports every coordinate non joué when --results points to invalid JSON", async () => {
		const { results, out } = tempPaths();
		writeFileSync(results, "{ not json", "utf-8");

		await runMain(["--results", results, "--out", out]);

		const output = readFileSync(out, "utf-8");
		expect(output).toContain("**0 passé / 0 échoué / 185 non joués** sur 185");
		expect(output).toContain("Fichier de résultats illisible ou invalide");
	});

	it("reports every coordinate non joué when --results points to a missing file", async () => {
		const { dir, out } = tempPaths();
		const missingResults = join(dir, "grille-results.json");

		await runMain(["--results", missingResults, "--out", out]);

		const output = readFileSync(out, "utf-8");
		expect(output).toContain("**0 passé / 0 échoué / 185 non joués** sur 185");
		expect(output).toContain(
			`Fichier de résultats introuvable (${missingResults})`,
		);
	});
});
