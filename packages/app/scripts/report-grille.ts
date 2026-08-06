import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import {
	buildGrid,
	CAMPAIGN_YEARS,
	type Coordinate,
	TRANCHES,
} from "~/e2e/grille/coordinates";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");
const RESULTS_PATH = join(APP_ROOT, "playwright-report/grille-results.json");
const OUTPUT_PATH = join(APP_ROOT, "playwright-report/grille-recette.md");

export type StepResult = {
	title: string;
	category: string;
	error?: { message?: string };
	steps?: StepResult[];
};

type PlaywrightTestResult = {
	status: string;
	duration: number;
	steps?: StepResult[];
};

type PlaywrightTest = {
	title: string;
	ok: boolean;
	results: PlaywrightTestResult[];
};

/** A `describe` block. Playwright hangs its tests off `specs[].tests[]`; the
 * bare `tests[]` form only appears on some fixture shapes, so both are read. */
type PlaywrightSpec = {
	title: string;
	tests?: PlaywrightTest[];
};

type PlaywrightSuite = {
	title: string;
	suites?: PlaywrightSuite[];
	specs?: PlaywrightSpec[];
	tests?: PlaywrightTest[];
};

export type PlaywrightReport = {
	suites: PlaywrightSuite[];
	stats: {
		startTime: string;
		duration: number;
		expected: number;
		unexpected: number;
		skipped: number;
		flaky: number;
	};
};

export type CoordStatus = "passed" | "failed" | "skipped";

export type CoordResult = {
	status: CoordStatus;
	failingStep: string | null;
	duration: number;
};

const COORD_ID_RE = /\[(\d{4}-(?:49|99|149|249|250P)-CAS\d{2})\]/;

export function deepestFailingStep(steps: StepResult[]): string | null {
	for (const step of steps) {
		if (step.error !== undefined) {
			const deeper = step.steps ? deepestFailingStep(step.steps) : null;
			if (deeper !== null) return deeper;
			if (step.category === "test.step") return step.title;
		}
	}
	return null;
}

function flattenTests(
	suites: PlaywrightSuite[],
	parentCoordId?: string,
): Array<{ coordId: string; test: PlaywrightTest }> {
	const out: Array<{ coordId: string; test: PlaywrightTest }> = [];
	for (const suite of suites) {
		const match = suite.title.match(COORD_ID_RE);
		const coordId = match?.[1] ?? parentCoordId;
		if (suite.suites) {
			out.push(...flattenTests(suite.suites, coordId));
		}
		if (!coordId) continue;
		for (const test of suite.tests ?? []) {
			out.push({ coordId, test });
		}
		for (const spec of suite.specs ?? []) {
			for (const test of spec.tests ?? []) {
				out.push({ coordId, test });
			}
		}
	}
	return out;
}

export function extractTestResults(
	report: PlaywrightReport,
): Map<string, CoordResult> {
	const map = new Map<string, CoordResult>();
	for (const { coordId, test } of flattenTests(report.suites)) {
		if (map.has(coordId)) continue;
		const last = test.results[test.results.length - 1];
		if (!last) continue;
		const rawStatus = last.status;
		const status: CoordStatus =
			rawStatus === "passed"
				? "passed"
				: rawStatus === "skipped"
					? "skipped"
					: "failed";
		const failingStep =
			status === "failed"
				? (deepestFailingStep(last.steps ?? []) ?? null)
				: null;
		map.set(coordId, { status, failingStep, duration: last.duration });
	}
	return map;
}

export function loadResults(jsonPath: string): PlaywrightReport | null {
	if (!existsSync(jsonPath)) return null;
	try {
		const raw = readFileSync(jsonPath, "utf-8");
		return JSON.parse(raw) as PlaywrightReport;
	} catch {
		return null;
	}
}

function formatDuration(ms: number): string {
	if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
	const mins = Math.floor(ms / 60_000);
	const secs = Math.round((ms % 60_000) / 1000);
	return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDate(iso: string): string {
	return iso.slice(0, 10);
}

function escapeMdCell(value: string): string {
	return value.replace(/\|/g, "\\|");
}

function sanitizeReportUrl(url: string): string {
	const lower = url.toLowerCase();
	if (
		lower.startsWith("javascript:") ||
		lower.startsWith("data:") ||
		lower.startsWith("vbscript:")
	) {
		return "#";
	}
	return url;
}

function ficheSortKey(fiche: string): [number, number] {
	const is6ind = fiche.endsWith("-6IND") ? 0 : 1;
	const num = parseInt(fiche.replace(/^CAS-/, "").replace(/-6IND$/, ""), 10);
	return [num, is6ind];
}

function sortFiches(fiches: string[]): string[] {
	return [...fiches].sort((a, b) => {
		const [numA, sixA] = ficheSortKey(a);
		const [numB, sixB] = ficheSortKey(b);
		return numA !== numB ? numA - numB : sixA - sixB;
	});
}

const VERDICT_SYMBOL: Record<CoordStatus | "none", string> = {
	passed: "✅",
	failed: "❌",
	skipped: "⚪",
	none: "⚪",
};

function verdictFor(result: CoordResult | undefined): string {
	if (!result) return VERDICT_SYMBOL.none;
	return VERDICT_SYMBOL[result.status];
}

export type ReportOptions = {
	results: Map<string, CoordResult>;
	grid: Coordinate[];
	scope: string;
	commit: string;
	reportUrl: string;
	startTime: string;
	durationMs: number;
	noJsonReason?: string;
};

export function buildReport(opts: ReportOptions): string {
	const {
		results,
		grid,
		scope,
		commit,
		reportUrl,
		startTime,
		durationMs,
		noJsonReason,
	} = opts;

	const passed = grid.filter(
		(c) => results.get(c.id)?.status === "passed",
	).length;
	const failed = grid.filter(
		(c) => results.get(c.id)?.status === "failed",
	).length;
	const notPlayed = grid.length - passed - failed;

	const lines: string[] = [];

	lines.push("# Recette métier — Grille 185 coordonnées");
	lines.push("");
	if (noJsonReason) {
		lines.push(
			`> ⚠️ ${noJsonReason} — les 185 coordonnées sont marquées non jouées.`,
		);
		lines.push("");
	}
	lines.push("| Date | Commit | Périmètre | Durée | Résultat |");
	lines.push("|---|---|---|---|---|");
	lines.push(
		`| ${formatDate(startTime)} | \`${escapeMdCell(commit.slice(0, 7))}\` | ${escapeMdCell(scope)} | ${formatDuration(durationMs)} | **${passed} passés / ${failed} échoués / ${notPlayed} non joués** sur ${grid.length} |`,
	);
	lines.push("");

	const failures = grid.filter((c) => results.get(c.id)?.status === "failed");
	if (failures.length > 0) {
		lines.push("## ❌ Échecs");
		lines.push("");
		for (const coord of failures) {
			const result = results.get(coord.id);
			const step = result?.failingStep ?? "étape non identifiée";
			lines.push(`### ❌ ${coord.id}`);
			lines.push("");
			lines.push(`**Cas** : ${coord.rappel}`);
			lines.push(`**A cassé à** : ${step}`);
			lines.push(
				`**Preuve** : [trace Playwright](${sanitizeReportUrl(reportUrl)})`,
			);
			lines.push("");
		}
	}

	lines.push("## Grille de couverture");
	lines.push("");

	for (const tranche of TRANCHES) {
		const trancheCoords = grid.filter((c) => c.effmax === tranche.effmax);
		const allFiches = sortFiches([
			...new Set(trancheCoords.map((c) => c.fiche)),
		]);

		lines.push(`### Feuille — ${tranche.label}`);
		lines.push("");
		lines.push(`| Année | ${allFiches.join(" | ")} |`);
		lines.push(`|---|${allFiches.map(() => "---").join("|")}|`);

		for (const year of CAMPAIGN_YEARS) {
			const yearCoords = trancheCoords.filter((c) => c.year === year);
			const ficheToCoord = new Map(yearCoords.map((c) => [c.fiche, c]));
			const cells = allFiches.map((fiche) => {
				const coord = ficheToCoord.get(fiche);
				if (!coord) return "-";
				return verdictFor(results.get(coord.id));
			});
			lines.push(`| ${year} | ${cells.join(" | ")} |`);
		}
		lines.push("");
	}

	return lines.join("\n");
}

export type CliArgs = {
	scope: string;
	commit: string;
	reportUrl: string;
};

export function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {
		scope: "tous les cas",
		commit: "N/A",
		reportUrl: "playwright-report/html/index.html",
	};
	for (let i = 0; i < argv.length; i++) {
		const flag = argv[i];
		const next = argv[i + 1] ?? "";
		if (flag === "--scope") {
			args.scope = next;
			i++;
		} else if (flag === "--commit") {
			args.commit = next;
			i++;
		} else if (flag === "--report-url") {
			args.reportUrl = next;
			i++;
		}
	}
	return args;
}

function main(): void {
	const { scope, commit, reportUrl } = parseArgs(process.argv.slice(2));
	const grid = buildGrid();
	const report = loadResults(RESULTS_PATH);

	let results: Map<string, CoordResult>;
	let startTime: string;
	let durationMs: number;
	let noJsonReason: string | undefined;

	if (!report) {
		results = new Map();
		startTime = new Date().toISOString();
		durationMs = 0;
		noJsonReason = existsSync(RESULTS_PATH)
			? "Fichier de résultats illisible ou invalide"
			: "Fichier de résultats introuvable (playwright-report/grille-results.json)";
	} else {
		results = extractTestResults(report);
		startTime = report.stats.startTime;
		durationMs = report.stats.duration;
	}

	const content = buildReport({
		results,
		grid,
		scope,
		commit,
		reportUrl,
		startTime,
		durationMs,
		noJsonReason,
	});

	mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
	writeFileSync(OUTPUT_PATH, content, "utf-8");
	console.log(`Rapport écrit : ${OUTPUT_PATH}`);

	const summaryPath = env.GITHUB_STEP_SUMMARY;
	if (summaryPath) {
		appendFileSync(summaryPath, content, "utf-8");
		console.log(`Résumé GitHub Actions écrit : ${summaryPath}`);
	}
}

if (process.argv[1]?.endsWith("report-grille.ts")) {
	main();
}
