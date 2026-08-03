import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildReport,
	type CoordResult,
	deepestFailingStep,
	extractTestResults,
	loadResults,
	type PlaywrightReport,
	parseArgs,
	type StepResult,
} from "#scripts/report-grille";
import { buildGrid, type Coordinate } from "~/e2e/grille/coordinates";

const GRID = buildGrid();

function resultsFor(
	ids: string[],
	partial?: Partial<CoordResult>,
): Map<string, CoordResult> {
	const map = new Map<string, CoordResult>();
	for (const id of ids) {
		map.set(id, {
			status: "passed",
			failingStep: null,
			duration: 1000,
			...partial,
		});
	}
	return map;
}

function baseOptions(results: Map<string, CoordResult>) {
	return {
		results,
		grid: GRID,
		scope: "tous les cas",
		commit: "abc1234def",
		reportUrl: "playwright-report/html/index.html",
		startTime: "2033-03-15T09:00:00.000Z",
		durationMs: 90_000,
	};
}

function reportWith(suites: PlaywrightReport["suites"]): PlaywrightReport {
	return {
		suites,
		stats: {
			startTime: "2033-03-15T09:00:00.000Z",
			duration: 1000,
			expected: 1,
			unexpected: 0,
			skipped: 0,
			flaky: 0,
		},
	};
}

function writeTempJson(content: string): string {
	const dir = mkdtempSync(join(tmpdir(), "report-grille-test-"));
	const path = join(dir, "grille-results.json");
	writeFileSync(path, content, "utf-8");
	return path;
}

describe("buildReport — header verdict", () => {
	it("counts 185 passed when every coordinate is green", () => {
		const results = resultsFor(GRID.map((c) => c.id));

		const report = buildReport(baseOptions(results));

		expect(report).toContain(
			"**185 passés / 0 échoués / 0 non joués** sur 185",
		);
		expect(report).toContain("# Recette métier — Grille 185 coordonnées");
	});

	it("counts only the targeted run — 12 for effmax=249 / year=2030", () => {
		const targeted = GRID.filter(
			(c) => c.effmax === "249" && c.year === 2030,
		).map((c) => c.id);
		expect(targeted).toHaveLength(12);
		const results = resultsFor(targeted);

		const report = buildReport({
			...baseOptions(results),
			scope: "2030 uniquement — 249",
		});

		expect(report).toContain(
			"**12 passés / 0 échoués / 173 non joués** sur 185",
		);
	});

	it("marks the 185 coordinates non joués when the JSON is absent", () => {
		const report = buildReport({
			...baseOptions(new Map()),
			noJsonReason:
				"Fichier de résultats introuvable (playwright-report/grille-results.json)",
		});

		expect(report).toContain(
			"**0 passés / 0 échoués / 185 non joués** sur 185",
		);
		expect(report).toContain(
			"> ⚠️ Fichier de résultats introuvable (playwright-report/grille-results.json) — les 185 coordonnées sont marquées non jouées.",
		);
	});

	it("omits the warning line when no reason is provided", () => {
		const report = buildReport(baseOptions(new Map()));

		expect(report).not.toContain("⚠️");
	});
});

describe("buildReport — failures section", () => {
	const FAILED_ID = "2033-149-CAS08";

	function failedCoord(): Coordinate {
		const coord = GRID.find((c) => c.id === FAILED_ID);
		if (!coord) throw new Error("fixture coordinate missing from grid");
		return coord;
	}

	it("renders a business-readable failure block with a Playwright link", () => {
		const coord = failedCoord();
		const results = new Map<string, CoordResult>([
			[
				FAILED_ID,
				{
					status: "failed",
					failingStep: "étape 5 — écarts par catégorie",
					duration: 4200,
				},
			],
		]);

		const report = buildReport({
			...baseOptions(results),
			reportUrl: "https://ci.example.com/report",
		});

		expect(report).toContain("## ❌ Échecs");
		expect(report).toContain(`### ❌ ${FAILED_ID}`);
		expect(report).toContain(`**Cas** : ${coord.rappel}`);
		expect(report).toContain("**A cassé à** : étape 5 — écarts par catégorie");
		expect(report).toContain(
			"**Preuve** : [trace Playwright](https://ci.example.com/report)",
		);
		expect(report).toContain(
			"**0 passés / 1 échoués / 184 non joués** sur 185",
		);
	});

	it("falls back to a placeholder step when the failing step is unknown", () => {
		const results = new Map<string, CoordResult>([
			[FAILED_ID, { status: "failed", failingStep: null, duration: 4200 }],
		]);

		const report = buildReport(baseOptions(results));

		expect(report).toContain("**A cassé à** : étape non identifiée");
	});

	it("omits the failures section when nothing failed", () => {
		const results = resultsFor(GRID.map((c) => c.id));

		const report = buildReport(baseOptions(results));

		expect(report).not.toContain("## ❌ Échecs");
	});
});

describe("buildReport — coverage grid", () => {
	it("renders the five tranche sheets", () => {
		const report = buildReport(baseOptions(new Map()));

		expect(report).toContain("### Feuille — Moins de 50 salariés");
		expect(report).toContain("### Feuille — 50 à 99 salariés");
		expect(report).toContain("### Feuille — 100 à 149 salariés");
		expect(report).toContain("### Feuille — 150 à 249 salariés");
		expect(report).toContain("### Feuille — 250 salariés et plus");
	});

	it("uses the empty verdict symbol for coordinates without a result", () => {
		const report = buildReport(baseOptions(new Map()));

		expect(report).toContain("⚪");
		expect(report).not.toContain("✅");
	});

	it("marks passed coordinates with a check and failed ones with a cross", () => {
		const results = new Map<string, CoordResult>([
			["2030-249-CAS01", { status: "passed", failingStep: null, duration: 1 }],
			["2030-249-CAS02", { status: "failed", failingStep: null, duration: 1 }],
		]);

		const report = buildReport(baseOptions(results));

		expect(report).toContain("✅");
		expect(report).toContain("❌");
	});

	it("renders the campaign years as grid rows", () => {
		const report = buildReport(baseOptions(new Map()));

		for (const year of [2027, 2028, 2029, 2030, 2031, 2032, 2033]) {
			expect(report).toContain(`| ${year} |`);
		}
	});

	it("formats a sub-minute duration in seconds", () => {
		const report = buildReport({
			...baseOptions(new Map()),
			durationMs: 45_000,
		});

		expect(report).toContain("| 45s |");
	});

	it("formats a multi-minute duration with a trailing seconds part", () => {
		const report = buildReport({
			...baseOptions(new Map()),
			durationMs: 125_000,
		});

		expect(report).toContain("| 2m 5s |");
	});

	it("formats a whole-minute duration without a seconds part", () => {
		const report = buildReport({
			...baseOptions(new Map()),
			durationMs: 120_000,
		});

		expect(report).toContain("| 2m |");
	});

	it("truncates the commit to seven characters", () => {
		const report = buildReport({
			...baseOptions(new Map()),
			commit: "abcdef1234567890",
		});

		expect(report).toContain("`abcdef1`");
	});
});

describe("deepestFailingStep", () => {
	it("returns the title of the innermost failing test.step", () => {
		const steps: StepResult[] = [
			{
				title: "outer wrapper",
				category: "test.step",
				error: { message: "boom" },
				steps: [
					{
						title: "étape 5 — écarts par catégorie",
						category: "test.step",
						error: { message: "expected 3 to be 4" },
					},
				],
			},
		];

		expect(deepestFailingStep(steps)).toBe("étape 5 — écarts par catégorie");
	});

	it("returns the outer step when it fails but its children carry no error", () => {
		const steps: StepResult[] = [
			{
				title: "étape 2 — effectifs",
				category: "test.step",
				error: { message: "boom" },
				steps: [{ title: "click", category: "pw:api" }],
			},
		];

		expect(deepestFailingStep(steps)).toBe("étape 2 — effectifs");
	});

	it("returns null when no step carries an error", () => {
		const steps: StepResult[] = [
			{
				title: "étape 1",
				category: "test.step",
				steps: [{ title: "navigate", category: "pw:api" }],
			},
		];

		expect(deepestFailingStep(steps)).toBeNull();
	});

	it("skips a failing step whose category is not test.step", () => {
		const steps: StepResult[] = [
			{ title: "expect", category: "expect", error: { message: "boom" } },
		];

		expect(deepestFailingStep(steps)).toBeNull();
	});

	it("returns null for an empty step tree", () => {
		expect(deepestFailingStep([])).toBeNull();
	});
});

describe("extractTestResults", () => {
	it("maps a passing coordinate keyed by its bracketed id in a suite title", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS01] parcours",
				tests: [
					{
						title: "should pass",
						ok: true,
						results: [{ status: "passed", duration: 1200 }],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS01")).toEqual({
			status: "passed",
			failingStep: null,
			duration: 1200,
		});
	});

	it("inherits the coordinate id from a parent suite for nested tests", () => {
		const report = reportWith([
			{
				title: "outer [2030-249-CAS02]",
				suites: [
					{
						title: "inner leaf",
						tests: [
							{
								title: "case",
								ok: true,
								results: [{ status: "passed", duration: 500 }],
							},
						],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS02")?.status).toBe("passed");
	});

	// Playwright's JSON reporter never hangs tests directly off a suite: it nests
	// them one level deeper, under specs[]. Reading only suite.tests[] made the
	// whole grid report "185 non joués" on a fully green run, because the
	// missing-coordinate fallback fired for every one of them.
	it("reads tests nested under specs[], the shape Playwright actually emits", () => {
		const report = reportWith([
			{
				title: "grille.grille.ts",
				suites: [
					{
						title: "[2030-250P-CAS12][CAS-12] avec CSE · écart ≥ 5 %",
						specs: [
							{
								title: "avec CSE · écart ≥ 5 %",
								tests: [
									{
										title: "avec CSE · écart ≥ 5 %",
										ok: true,
										results: [{ status: "passed", duration: 7800 }],
									},
								],
							},
						],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-250P-CAS12")).toEqual({
			status: "passed",
			failingStep: null,
			duration: 7800,
		});
	});

	it("records the deepest failing step for a failed coordinate", () => {
		const report = reportWith([
			{
				title: "grille [2033-149-CAS08]",
				tests: [
					{
						title: "fails",
						ok: false,
						results: [
							{
								status: "failed",
								duration: 3000,
								steps: [
									{
										title: "étape 5 — écarts par catégorie",
										category: "test.step",
										error: { message: "diff" },
									},
								],
							},
						],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2033-149-CAS08")).toEqual({
			status: "failed",
			failingStep: "étape 5 — écarts par catégorie",
			duration: 3000,
		});
	});

	it("normalises a non-standard failure status to failed", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS03]",
				tests: [
					{
						title: "times out",
						ok: false,
						results: [{ status: "timedOut", duration: 30_000 }],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS03")?.status).toBe("failed");
		expect(map.get("2030-249-CAS03")?.failingStep).toBeNull();
	});

	it("maps a skipped result to the skipped status", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS04]",
				tests: [
					{
						title: "skipped",
						ok: true,
						results: [{ status: "skipped", duration: 0 }],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS04")?.status).toBe("skipped");
	});

	it("keeps the first coordinate result and ignores duplicates", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS05] first",
				tests: [
					{
						title: "first",
						ok: true,
						results: [{ status: "passed", duration: 100 }],
					},
				],
			},
			{
				title: "grille [2030-249-CAS05] second",
				tests: [
					{
						title: "second",
						ok: false,
						results: [{ status: "failed", duration: 999 }],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS05")).toEqual({
			status: "passed",
			failingStep: null,
			duration: 100,
		});
	});

	it("uses the last attempt when a coordinate is retried", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS07]",
				tests: [
					{
						title: "retried",
						ok: true,
						results: [
							{ status: "failed", duration: 200 },
							{ status: "passed", duration: 250 },
						],
					},
				],
			},
		]);

		const map = extractTestResults(report);

		expect(map.get("2030-249-CAS07")?.status).toBe("passed");
		expect(map.get("2030-249-CAS07")?.duration).toBe(250);
	});

	it("ignores tests that carry no coordinate id", () => {
		const report = reportWith([
			{
				title: "smoke suite",
				tests: [
					{
						title: "unrelated",
						ok: true,
						results: [{ status: "passed", duration: 10 }],
					},
				],
			},
		]);

		expect(extractTestResults(report).size).toBe(0);
	});

	it("ignores a coordinate suite whose test has no result", () => {
		const report = reportWith([
			{
				title: "grille [2030-249-CAS06]",
				tests: [{ title: "no run", ok: true, results: [] }],
			},
		]);

		expect(extractTestResults(report).size).toBe(0);
	});
});

describe("loadResults", () => {
	it("returns null when the file does not exist", () => {
		expect(loadResults(join(tmpdir(), "does-not-exist-42.json"))).toBeNull();
	});

	it("returns null when the file content is not valid JSON", () => {
		const path = writeTempJson("{ not json");

		expect(loadResults(path)).toBeNull();
	});

	it("parses a valid report file", () => {
		const path = writeTempJson(JSON.stringify(reportWith([])));

		const report = loadResults(path);

		expect(report?.stats.startTime).toBe("2033-03-15T09:00:00.000Z");
	});
});

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
		});
	});

	it("falls back to defaults when no flags are provided", () => {
		expect(parseArgs([])).toEqual({
			scope: "tous les cas",
			commit: "N/A",
			reportUrl: "playwright-report/html/index.html",
		});
	});

	it("defaults a flag value to an empty string when it is the last token", () => {
		expect(parseArgs(["--scope"]).scope).toBe("");
	});

	it("ignores unknown flags", () => {
		expect(parseArgs(["--unknown", "value", "--commit", "deadbee"])).toEqual({
			scope: "tous les cas",
			commit: "deadbee",
			reportUrl: "playwright-report/html/index.html",
		});
	});
});

describe("main — CLI entrypoint", () => {
	const REPORT_DIR = join(process.cwd(), "playwright-report");
	const RESULTS_PATH = join(REPORT_DIR, "grille-results.json");
	const OUTPUT_PATH = join(REPORT_DIR, "grille-recette.md");

	// The script resolves its paths from process.cwd(), so these tests write into
	// the package's own playwright-report/. That directory exists on a developer
	// machine (an E2E run created it) but not on a fresh CI checkout, so each test
	// creates it rather than relying on whichever test happens to run first.
	beforeEach(() => {
		mkdirSync(REPORT_DIR, { recursive: true });
	});

	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		process.argv = process.argv.slice(0, 2);
		rmSync(RESULTS_PATH, { force: true });
		rmSync(OUTPUT_PATH, { force: true });
	});

	async function runMain(): Promise<void> {
		vi.resetModules();
		await import("#scripts/report-grille");
	}

	it("does not write the output file when the module is imported without direct invocation", async () => {
		rmSync(OUTPUT_PATH, { force: true });
		process.argv = ["node", "/fake/test-runner"];
		vi.resetModules();
		await import("#scripts/report-grille");
		expect(existsSync(OUTPUT_PATH)).toBe(false);
	});

	it("writes the report and the GitHub step summary from a real results file", async () => {
		const summaryPath = join(
			mkdtempSync(join(tmpdir(), "gh-summary-")),
			"summary.md",
		);
		writeFileSync(summaryPath, "", "utf-8");
		vi.stubEnv("GITHUB_STEP_SUMMARY", summaryPath);
		process.argv = [
			"node",
			"report-grille.ts",
			"--scope",
			"probe",
			"--commit",
			"abc1234",
			"--report-url",
			"http://x",
		];
		writeFileSync(
			RESULTS_PATH,
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

		await runMain();

		expect(readFileSync(OUTPUT_PATH, "utf-8")).toContain(
			"# Recette métier — Grille 185 coordonnées",
		);
		const summary = readFileSync(summaryPath, "utf-8");
		expect(summary).toContain("# Recette métier — Grille 185 coordonnées");
		expect(summary).toContain("| probe |");
	});

	it("reports every coordinate non joué when the results file is invalid", async () => {
		writeFileSync(RESULTS_PATH, "{ not json", "utf-8");

		await runMain();

		const output = readFileSync(OUTPUT_PATH, "utf-8");
		expect(output).toContain(
			"**0 passés / 0 échoués / 185 non joués** sur 185",
		);
		expect(output).toContain("Fichier de résultats illisible ou invalide");
	});

	it("reports every coordinate non joué when the results file is missing", async () => {
		rmSync(RESULTS_PATH, { force: true });

		await runMain();

		const output = readFileSync(OUTPUT_PATH, "utf-8");
		expect(output).toContain(
			"**0 passés / 0 échoués / 185 non joués** sur 185",
		);
		expect(output).toContain(
			"Fichier de résultats introuvable (playwright-report/grille-results.json)",
		);
	});
});
