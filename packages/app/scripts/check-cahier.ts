import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGrid } from "~/e2e/grille/coordinates";

const __dirname = dirname(fileURLToPath(import.meta.url));

// §3 coordinates (AAAA-EFFMAX-CASnn) are now checked via buildGrid() bijection.
// The two guards from the previous .mjs version are lifted on purpose: CASnn (no dash)
// matches COORDINATE_RE, and coordinates are extracted from all of §3, not first cells only.
const SCENARIO_ID = /\b(?:CAS|ANX)-\d{2}(?:-[A-Z0-9]+)*\b/g;
const COORDINATE_RE = /\b(20\d{2})-(49|99|149|249|250P)-CAS(\d{2})\b/g;

export function parseCahier(markdown: string): Set<string> {
	const scenarios = new Set<string>();
	for (const line of markdown.split("\n")) {
		const match =
			line.match(/^#{2,4}\s+((?:CAS|ANX)-\d{2}(?:-[A-Z0-9]+)*)(?:\s.*)?$/) ??
			line.match(/^\|\s*((?:CAS|ANX)-\d{2}(?:-[A-Z0-9]+)*)\s*\|/);
		if (!match) continue;
		const id = match[1];
		if (id === undefined) continue;
		if (scenarios.has(id)) {
			throw new Error(`Scénario dupliqué dans le cahier : ${id}`);
		}
		scenarios.add(id);
	}
	return scenarios;
}

export function collectSpecTags(e2eDir: string): Map<string, Set<string>> {
	const tags = new Map<string, Set<string>>();
	for (const file of readdirSync(e2eDir)) {
		if (!file.endsWith(".e2e.ts")) continue;
		const content = readFileSync(join(e2eDir, file), "utf-8");
		for (const match of content.matchAll(SCENARIO_ID)) {
			const id = match[0];
			if (!content.includes(`[${id}]`)) continue;
			if (!tags.has(id)) tags.set(id, new Set());
			tags.get(id)?.add(file);
		}
	}
	return tags;
}

export function findTagViolations(
	scenarios: Set<string>,
	tags: Map<string, Set<string>>,
): string[] {
	const violations: string[] = [];
	for (const id of scenarios) {
		if (!tags.has(id)) {
			violations.push(
				`${id} est déclaré dans le cahier mais aucune spec E2E ne porte le tag [${id}] — écrire le test qui le couvre`,
			);
		}
	}
	for (const [id, files] of tags) {
		if (!scenarios.has(id)) {
			violations.push(
				`Tag [${id}] présent dans ${[...files].join(", ")} mais sans ligne dans docs/cahier-de-tests.md — ajouter la ligne au cahier`,
			);
		}
	}
	return violations;
}

export function parseFiches(markdown: string): Set<string> {
	const fiches = new Set<string>();
	for (const line of markdown.split("\n")) {
		const match = line.match(/^#{2,4}\s+(CAS-\d{2}(?:-[A-Z0-9]+)*)(?:\s.*)?$/);
		if (!match) continue;
		const fiche = match[1];
		if (fiche === undefined) continue;
		fiches.add(fiche);
	}
	return fiches;
}

export function parseFicheScenarioKeys(scenariosPath: string): Set<string> {
	const content = readFileSync(scenariosPath, "utf-8");
	const keys = new Set<string>();
	for (const match of content.matchAll(
		/^\s+"(CAS-\d{2}(?:-[A-Z0-9]+)*)"\s*:/gm,
	)) {
		const key = match[1];
		if (key === undefined) continue;
		keys.add(key);
	}
	return keys;
}

export function findFicheRegistryViolations(
	fiches: Set<string>,
	ficheScenarioKeys: Set<string>,
): string[] {
	const violations: string[] = [];
	for (const id of fiches) {
		if (!ficheScenarioKeys.has(id)) {
			violations.push(
				`Fiche ${id} déclarée au §2 du cahier mais absente de FICHE_SCENARIOS dans src/e2e/grille/scenarios.ts — ajouter l'entrée correspondante`,
			);
		}
	}
	for (const id of ficheScenarioKeys) {
		if (!fiches.has(id)) {
			violations.push(
				`Entrée ${id} présente dans FICHE_SCENARIOS mais sans fiche au §2 du cahier — ajouter la fiche ou supprimer l'entrée`,
			);
		}
	}
	return violations;
}

export function extractSection3(markdown: string): string {
	const start = markdown.search(/^## 3\./m);
	if (start < 0)
		throw new Error("Section §3 non trouvée dans docs/cahier-de-tests.md");
	const rest = markdown.slice(start);
	const end = rest.search(/^## 4\./m);
	return end < 0 ? rest : rest.slice(0, end);
}

export function parseCoordinates(section3: string): Set<string> {
	const coords = new Set<string>();
	for (const match of section3.matchAll(COORDINATE_RE)) {
		coords.add(match[0]);
	}
	return coords;
}

export function findCoordinateViolations(
	cahierCoords: Set<string>,
	gridIds: Set<string>,
): string[] {
	const violations: string[] = [];
	for (const id of cahierCoords) {
		if (!gridIds.has(id)) {
			violations.push(
				`${id} est déclaré au §3 du cahier mais la grille dérivée ne le produit pas` +
					` — soit le §3 est en avance sur le domaine, soit une règle de cadence a changé`,
			);
		}
	}
	for (const id of gridIds) {
		if (!cahierCoords.has(id)) {
			violations.push(
				`${id} est produit par buildGrid() mais absent du §3 du cahier` +
					` — mettre le §3 à jour ou corriger la règle de cadence`,
			);
		}
	}
	return violations;
}

const appRoot = join(__dirname, "..");
const repoRoot = join(__dirname, "..", "..", "..");
const cahierPath = join(repoRoot, "docs/cahier-de-tests.md");
const e2eDir = join(appRoot, "src/e2e");
const scenariosPath = join(appRoot, "src/e2e/grille/scenarios.ts");

let markdown: string;
try {
	markdown = readFileSync(cahierPath, "utf-8");
} catch (err) {
	console.error(
		`Impossible de lire le cahier "${cahierPath}": ${(err as Error).message}`,
	);
	process.exit(1);
}

const scenarios = parseCahier(markdown);
if (scenarios.size === 0) {
	console.error(
		"Aucun scénario (CAS-xx / ANX-xx) trouvé dans docs/cahier-de-tests.md — format de tableau attendu : | CAS-01 | ... |",
	);
	process.exit(1);
}

const tagViolations = findTagViolations(scenarios, collectSpecTags(e2eDir));

const fiches = parseFiches(markdown);
const ficheScenarioKeys = parseFicheScenarioKeys(scenariosPath);
const ficheViolations = findFicheRegistryViolations(fiches, ficheScenarioKeys);

const section3 = extractSection3(markdown);
const cahierCoords = parseCoordinates(section3);
const gridIds = new Set(buildGrid().map((c) => c.id));
const coordViolations = findCoordinateViolations(cahierCoords, gridIds);

const allViolations = [
	...tagViolations,
	...ficheViolations,
	...coordViolations,
];

if (allViolations.length > 0) {
	console.error("Cahier de tests désynchronisé :");
	for (const violation of allViolations) {
		console.error(`  - ${violation}`);
	}
	process.exit(1);
}

console.log(
	`Cahier de tests OK — ${scenarios.size} scénarios, ${fiches.size} fiches, ${cahierCoords.size} coordonnées, chacun couvert.`,
);
