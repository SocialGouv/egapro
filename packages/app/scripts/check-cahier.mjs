import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCENARIO_ID = /\b(?:CAS|ANX)-\d{2}(?:-[A-Z0-9]+)*\b/g;

/**
 * Parse the cahier de tests markdown: every table row whose first cell is a
 * scenario ID (| CAS-01 | ... |) declares a scenario that MUST be covered by
 * at least one tagged E2E spec. Prose mentions (e.g. reserved IDs in the
 * coverage-gaps section) are intentionally ignored — only table rows bind.
 */
export function parseCahier(markdown) {
	const scenarios = new Set();
	for (const line of markdown.split("\n")) {
		const match = line.match(/^\|\s*((?:CAS|ANX)-\d{2}(?:-[A-Z0-9]+)*)\s*\|/);
		if (!match) continue;
		const id = match[1];
		if (scenarios.has(id)) {
			throw new Error(`Scénario dupliqué dans le cahier: ${id}`);
		}
		scenarios.add(id);
	}
	return scenarios;
}

/** Collect every [CAS-xx]/[ANX-xx] tag found in *.e2e.ts specs, with its file. */
export function collectSpecTags(e2eDir) {
	const tags = new Map();
	for (const file of readdirSync(e2eDir)) {
		if (!file.endsWith(".e2e.ts")) continue;
		const content = readFileSync(join(e2eDir, file), "utf-8");
		for (const match of content.matchAll(SCENARIO_ID)) {
			const id = match[0];
			if (!content.includes(`[${id}]`)) continue;
			if (!tags.has(id)) tags.set(id, new Set());
			tags.get(id).add(file);
		}
	}
	return tags;
}

/**
 * Cross-check: the cahier's scenario rows and the spec tags must be in
 * bijection — a row without a tagged test, or a tag without a row, is a drift.
 */
export function findViolations(scenarios, tags) {
	const violations = [];
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

const cahierPath = join(__dirname, "../../../docs/cahier-de-tests.md");
const e2eDir = join(__dirname, "../src/e2e");

let markdown;
try {
	markdown = readFileSync(cahierPath, "utf-8");
} catch (err) {
	console.error(`Impossible de lire le cahier "${cahierPath}": ${err.message}`);
	process.exit(1);
}

const scenarios = parseCahier(markdown);
if (scenarios.size === 0) {
	console.error(
		"Aucun scénario (CAS-xx / ANX-xx) trouvé dans docs/cahier-de-tests.md — format de tableau attendu: | CAS-01 | ... |",
	);
	process.exit(1);
}

const violations = findViolations(scenarios, collectSpecTags(e2eDir));
if (violations.length > 0) {
	console.error("Cahier de tests désynchronisé des specs E2E :");
	for (const violation of violations) {
		console.error(`  - ${violation}`);
	}
	process.exit(1);
}

console.log(
	`Cahier de tests OK — ${scenarios.size} scénarios, chacun couvert par au moins une spec E2E taguée.`,
);
