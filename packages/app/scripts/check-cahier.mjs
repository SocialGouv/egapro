import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCENARIO_ID = /\b(?:CAS|ANX)-\d{2}\b/g;
const COVERED = "✅";
const PARTIAL = "🟡";
const UNCOVERED = "❌";

/**
 * Parse the cahier de tests markdown: every table row whose first cell is a
 * scenario ID (| CAS-01 | ... |) declares a scenario, and the row's status
 * marker (✅ / 🟡 / ❌) says whether at least one E2E spec must be tagged with it.
 */
export function parseCahier(markdown) {
	const scenarios = new Map();
	for (const line of markdown.split("\n")) {
		const match = line.match(/^\|\s*((?:CAS|ANX)-\d{2})\s*\|/);
		if (!match) continue;
		const id = match[1];
		const status = line.includes(COVERED)
			? "covered"
			: line.includes(PARTIAL)
				? "partial"
				: line.includes(UNCOVERED)
					? "uncovered"
					: null;
		if (status === null) {
			throw new Error(
				`Ligne du cahier sans statut (✅/🟡/❌) pour ${id}: ${line.trim()}`,
			);
		}
		if (scenarios.has(id)) {
			throw new Error(`Scénario dupliqué dans le cahier: ${id}`);
		}
		scenarios.set(id, status);
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

/** Cross-check cahier scenarios against spec tags; returns human-readable violations. */
export function findViolations(scenarios, tags) {
	const violations = [];
	for (const [id, status] of scenarios) {
		if (status !== "uncovered" && !tags.has(id)) {
			violations.push(
				`${id} est marqué couvert (✅/🟡) dans le cahier mais aucune spec E2E ne porte le tag [${id}]`,
			);
		}
		if (status === "uncovered" && tags.has(id)) {
			violations.push(
				`${id} est marqué ❌ non couvert dans le cahier mais est tagué dans: ${[...tags.get(id)].join(", ")} — mettre à jour le statut dans docs/cahier-de-tests.md`,
			);
		}
	}
	for (const [id, files] of tags) {
		if (!scenarios.has(id)) {
			violations.push(
				`Tag [${id}] présent dans ${[...files].join(", ")} mais absent du cahier docs/cahier-de-tests.md`,
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
	`Cahier de tests OK — ${scenarios.size} scénarios, corrélation cahier ↔ specs E2E vérifiée.`,
);
