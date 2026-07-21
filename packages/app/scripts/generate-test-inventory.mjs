// Generated file → docs/tests-inventory.md. Regenerate: `pnpm test:inventory` or the /test-inventory skill.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// First matching prefix wins; unmatched paths fall back to their module path so nothing is dropped.
const SECTIONS = [
	{ prefix: "src/modules/domain", label: "Règles métier (domaine)" },
	{
		prefix: "src/modules/declaration-remuneration",
		label: "Parcours déclaration rémunération",
	},
	{ prefix: "src/modules/my-space", label: "Mon espace" },
	{ prefix: "src/modules/export", label: "Export & API SUIT" },
	{ prefix: "src/modules/admin", label: "Administration" },
	{ prefix: "src/modules/layout", label: "Mise en page & navigation" },
	{ prefix: "src/modules/audit", label: "Journal d'audit" },
	{ prefix: "src/server", label: "Serveur (API, audit, règles)" },
	{ prefix: "src/app", label: "Routes & pages (App Router)" },
];

const E2E_LABEL = "Scénarios E2E";

export function parseVitest(output) {
	const tests = [];
	if (!output) return tests;
	for (const raw of output.split("\n")) {
		const line = raw.trimEnd();
		const sep = line.indexOf(" > ");
		if (sep === -1) continue;
		const file = line.slice(0, sep);
		// Keep only real test files — filters out interleaved DB NOTICE noise.
		if (!/\.test\.tsx?$/.test(file)) continue;
		tests.push({ file, title: line.slice(sep + 3).trim() });
	}
	return tests;
}

export function parsePlaywright(output) {
	const tests = [];
	if (!output) return tests;
	const seen = new Set();
	const pattern = /^\s*\[[^\]]+\]\s›\s(.+?):\d+:\d+\s›\s(.+)$/;
	for (const raw of output.split("\n")) {
		const match = raw.match(pattern);
		if (!match) continue;
		const file = match[1].trim();
		const title = match[2].trim();
		const key = `${file}␟${title}`;
		// Dedupe the same test listed under several projects (setup/chromium/logout).
		if (seen.has(key)) continue;
		seen.add(key);
		tests.push({ file, title });
	}
	return tests;
}

export function sectionLabel(file, isE2e) {
	if (isE2e) return E2E_LABEL;
	const match = SECTIONS.find((s) => file.startsWith(s.prefix));
	if (match) return match.label;
	return file.split("/").slice(0, 3).join("/") || file;
}

function groupBySection(tests, isE2e) {
	const bySection = new Map();
	for (const { file, title } of tests) {
		const label = sectionLabel(file, isE2e);
		if (!bySection.has(label)) bySection.set(label, new Map());
		const byFile = bySection.get(label);
		if (!byFile.has(file)) byFile.set(file, []);
		byFile.get(file).push(title);
	}
	return bySection;
}

function renderSections(bySection) {
	const lines = [];
	const labels = [...bySection.keys()].sort((a, b) => a.localeCompare(b, "fr"));
	for (const label of labels) {
		const byFile = bySection.get(label);
		const testCount = [...byFile.values()].reduce((n, t) => n + t.length, 0);
		lines.push(
			`### ${label}`,
			"",
			`_${byFile.size} fichier(s), ${testCount} test(s)._`,
			"",
		);
		const files = [...byFile.keys()].sort((a, b) => a.localeCompare(b, "en"));
		for (const file of files) {
			const titles = [...byFile.get(file)].sort((a, b) =>
				a.localeCompare(b, "fr"),
			);
			lines.push(`- **\`${file}\`** — ${titles.length} test(s)`);
			for (const title of titles) lines.push(`  - ${title}`);
		}
		lines.push("");
	}
	return lines;
}

function countFiles(tests) {
	return new Set(tests.map((t) => t.file)).size;
}

export function buildInventoryMarkdown({
	unit,
	integration,
	e2e,
	unitAvailable = true,
	integrationAvailable = true,
	e2eAvailable = true,
	generatedOn,
}) {
	const header = [
		"# Inventaire des tests",
		"",
		"> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`.",
		"",
		`_Généré le ${generatedOn}._`,
		"",
		"| Type | Fichiers | Tests |",
		"| --- | --- | --- |",
		`| Tests unitaires | ${countFiles(unit)} | ${unit.length} |`,
		`| Tests d'intégration | ${countFiles(integration)} | ${integration.length} |`,
		`| Scénarios E2E | ${countFiles(e2e)} | ${e2e.length} |`,
		"",
	];
	const unavailable = [
		[unitAvailable, "La liste des tests unitaires n'a pas pu être récupérée."],
		[
			integrationAvailable,
			"La liste des tests d'intégration n'a pas pu être récupérée (base de données indisponible ?). Relancer avec la stack de développement démarrée.",
		],
		[e2eAvailable, "La liste des scénarios E2E n'a pas pu être récupérée."],
	];
	for (const [available, message] of unavailable) {
		if (!available) header.push(`> ⚠️ ${message}`, "");
	}
	const body = [
		"## Tests unitaires & d'intégration",
		"",
		...renderSections(groupBySection([...unit, ...integration], false)),
		"## Tests end-to-end",
		"",
		...renderSections(groupBySection(e2e, true)),
	];
	return `${[...header, ...body].join("\n").trimEnd()}\n`;
}

function runList(command, appDir) {
	try {
		return execSync(command, {
			cwd: appDir,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			maxBuffer: 32 * 1024 * 1024,
		});
	} catch (error) {
		// vitest list can exit non-zero after printing the list — keep it if present.
		const stdout = typeof error.stdout === "string" ? error.stdout : "";
		return stdout.includes(" > ") ? stdout : null;
	}
}

function main() {
	const scriptDir = dirname(fileURLToPath(import.meta.url));
	const appDir = resolve(scriptDir, "..");
	const outputPath = join(
		resolve(appDir, "..", ".."),
		"docs",
		"tests-inventory.md",
	);

	const unitOutput = runList("./node_modules/.bin/vitest list", appDir);
	const integrationOutput = runList(
		"./node_modules/.bin/vitest list --config vitest.integration.config.ts",
		appDir,
	);
	const e2eOutput = runList(
		"./node_modules/.bin/playwright test --list",
		appDir,
	);

	const unit = parseVitest(unitOutput);
	const integration = parseVitest(integrationOutput);
	const e2e = parsePlaywright(e2eOutput);

	const content = buildInventoryMarkdown({
		unit,
		integration,
		e2e,
		unitAvailable: unitOutput !== null,
		integrationAvailable: integrationOutput !== null,
		e2eAvailable: e2eOutput !== null,
		generatedOn: new Date().toISOString().slice(0, 10),
	});

	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, content, "utf8");
	process.stdout.write(
		`Inventaire écrit : ${outputPath}\n  ${unit.length} tests unitaires · ${integration.length} intégration · ${e2e.length} E2E\n`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	main();
}
