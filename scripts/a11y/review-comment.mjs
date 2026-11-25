#!/usr/bin/env node
// Builds the sticky PR comment of the review-a11y workflow (a11y-review.yaml), one section per
// pass of the review-a11y skill: the static engine on the diff, then the rendered pages the diff
// reaches (scan --since --baseline). Pure formatting: the blocking decision is the engine's exit
// code, never this script.
//
//   review-comment.mjs static   --audit <audit.json> [--text <audit.txt>] --base <ref>
//   review-comment.mjs rendered --scan <scan.json> [--affected <affected.json>] --base-url <url> --pr-url <url>
//   review-comment.mjs skipped  --reason <text>
//   review-comment.mjs merge    --section static|rendered --section-file <md> [--body-file <md>]
//
// Each command prints Markdown on stdout. `merge` replaces the section between its markers in the
// current comment body (or starts a new body), so the two jobs update one comment independently.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export const MARKER = "<!-- review-a11y -->";
const SECTIONS = ["static", "rendered"];
const SEVERITY_ORDER = ["bloquant", "majeur", "mineur"];
const SEVERITY_LABEL = {
	bloquant: "🔴 Bloquant",
	majeur: "🟠 Majeur",
	mineur: "🟡 Mineur",
};
const MAX_PER_CRITERION = 10;

function md(text) {
	return String(text ?? "")
		.replace(/\s+/g, " ")
		.replace(/\|/g, "\\|")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.trim();
}

function code(text) {
	const s = String(text ?? "").replace(/`/g, "'");
	return `\`${s.length > 120 ? `${s.slice(0, 117)}…` : s}\``;
}

function compareCriteria(a, b) {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	return pa[0] - pb[0] || (pa[1] ?? 0) - (pb[1] ?? 0);
}

function severityRank(s) {
	const i = SEVERITY_ORDER.indexOf(s);
	return i === -1 ? SEVERITY_ORDER.length : i;
}

/** The RGAA criteria table of the pinned engine: titles, WCAG mapping, rule mapping. */
export function loadStandard() {
	const require = createRequire(
		join(process.cwd(), "packages/app/package.json"),
	);
	let pkg;
	try {
		pkg = require.resolve("ultra11y/package.json");
	} catch {
		pkg = createRequire(import.meta.url).resolve("ultra11y/package.json");
	}
	return JSON.parse(
		readFileSync(join(dirname(pkg), "src/data/standards/rgaa.json"), "utf8"),
	);
}

export function indexStandard(standard) {
	const titles = new Map();
	const byRule = new Map();
	const byWcag = new Map();
	for (const c of standard.criteria ?? []) {
		titles.set(c.id, c.titlePlain?.fr ?? c.titlePlain?.en ?? "");
		for (const r of c.automation?.rules ?? []) {
			if (!byRule.has(r.id)) byRule.set(r.id, []);
			byRule.get(r.id).push(c.id);
		}
		for (const w of c.wcag ?? []) {
			if (!byWcag.has(w)) byWcag.set(w, []);
			byWcag.get(w).push(c.id);
		}
	}
	return { titles, byRule, byWcag };
}

/**
 * The French messages of the engine's text output (`  🔴 [11.1] file:line  message`), keyed by
 * `criteria|file|line`. `audit --json` keeps the canonical English message; the text output of
 * `audit --in <json> --lang fr` is the localized one.
 */
export function parseTextMessages(text) {
	const out = new Map();
	for (const line of String(text ?? "").split("\n")) {
		const m = line.match(/^\s+\S+\s+\[([^\]]+)\]\s+(.+?):(\d+)\s{2}(.+)$/);
		if (m) out.set(`${m[1]}|${m[2]}|${m[3]}`, m[4].trim());
	}
	return out;
}

function criterionHeading(id, index, wcag) {
	const title = index.titles.get(id);
	const mapping = wcag?.length ? ` (WCAG ${wcag.join(", ")})` : "";
	return `**RGAA ${id}**${mapping}${title ? ` — ${md(title)}` : ""}`;
}

function groupByCriterion(items) {
	const groups = new Map();
	for (const item of items) {
		if (!groups.has(item.criterion)) groups.set(item.criterion, []);
		groups.get(item.criterion).push(item);
	}
	return [...groups.entries()].sort(([a], [b]) => compareCriteria(a, b));
}

function renderGroups(items, index, renderItem) {
	const lines = [];
	for (const severity of [...SEVERITY_ORDER, "autre"]) {
		const inSeverity = items.filter((i) =>
			severity === "autre"
				? !SEVERITY_ORDER.includes(i.severity)
				: i.severity === severity,
		);
		if (inSeverity.length === 0) continue;
		lines.push("", `#### ${SEVERITY_LABEL[severity] ?? "Autre"}`);
		for (const [criterion, group] of groupByCriterion(inSeverity)) {
			lines.push(
				`- ${criterionHeading(criterion, index, group[0].wcag)} — ${group.length} constat(s)`,
			);
			for (const item of group.slice(0, MAX_PER_CRITERION)) {
				lines.push(`  - ${renderItem(item)}`);
			}
			if (group.length > MAX_PER_CRITERION) {
				lines.push(`  - … et ${group.length - MAX_PER_CRITERION} autre(s)`);
			}
		}
	}
	return lines;
}

export function renderStatic({ audit, text, base, index }) {
	const messages = parseTextMessages(text);
	const findings = (audit.findings ?? []).map((f) => {
		const ids = f.criteriaIds?.length ? f.criteriaIds : [f.criteriaId];
		const key = `${ids.join(", ")}|${f.file}|${f.line}`;
		return {
			criterion: ids[0],
			others: ids.slice(1),
			wcag: f.wcag ? [f.wcag] : [],
			severity: f.severity,
			file: f.file,
			line: f.line,
			message: messages.get(key) ?? f.message,
			snippet: f.snippet,
		};
	});
	findings.sort(
		(a, b) =>
			severityRank(a.severity) - severityRank(b.severity) ||
			compareCriteria(a.criterion, b.criterion),
	);
	const blocking = findings.filter((f) => f.severity === "bloquant").length;
	const files = audit.scope?.files ?? 0;
	const lines = [
		`### 1. Code modifié — moteur statique (\`audit --since ${base}\`)`,
		"",
		`ultra11y ${audit.version ?? "?"} · ${files} fichier(s) modifié(s) audité(s) · ${findings.length} non-conformité(s), dont **${blocking} bloquante(s)**.`,
	];
	if (findings.length === 0) {
		lines.push(
			"",
			"Aucune non-conformité détectée par le moteur statique dans le code modifié.",
		);
	} else {
		lines.push(
			...renderGroups(findings, index, (f) => {
				const also = f.others.length
					? ` (aussi RGAA ${f.others.join(", ")})`
					: "";
				return `${code(`${f.file}:${f.line}`)} — ${md(f.message)}${also}`;
			}),
		);
	}
	lines.push(
		"",
		blocking > 0
			? "**Verdict : bloquant.** Corriger les non-conformités bloquantes avant le merge."
			: "**Verdict : pas de non-conformité bloquante dans le code modifié.**",
	);
	return lines.join("\n");
}

export function rgaaForRendered(finding, index) {
	for (const id of [
		`axe:${finding.axeRule}`,
		`dyn-${finding.axeRule}`,
		finding.axeRule,
		finding.engine,
	]) {
		if (id && index.byRule.has(id)) return index.byRule.get(id);
	}
	return index.byWcag.get(finding.criteriaId) ?? [];
}

function pathOf(url) {
	try {
		return new URL(url).pathname;
	} catch {
		return String(url ?? "");
	}
}

export function renderRendered({ scan, affected, baseUrl, prUrl, index }) {
	const gate = scan.gate ?? { new: scan.findings ?? [], notMeasured: [] };
	const fresh = (gate.new ?? []).map((f) => {
		const rgaa = rgaaForRendered(f, index);
		return {
			criterion: rgaa[0] ?? `WCAG ${f.criteriaId}`,
			others: rgaa.slice(1),
			wcag: f.criteriaId ? [f.criteriaId] : [],
			severity: f.severity,
			page: pathOf(f.page),
			selector: f.selector,
			message: f.message,
		};
	});
	fresh.sort(
		(a, b) =>
			severityRank(a.severity) - severityRank(b.severity) ||
			String(a.criterion).localeCompare(String(b.criterion)),
	);
	const notMeasured = gate.notMeasured ?? [];
	const pages = (scan.scanned ?? []).map(pathOf);
	const lines = [
		"### 2. Pages rendues que la PR atteint — Playwright + axe (`scan --since --baseline`)",
		"",
		`Préversion de la PR : ${prUrl} · base : ${baseUrl}`,
		"",
		`${pages.length} page(s) rendue(s)${pages.length ? ` : ${pages.map(code).join(", ")}` : ""}. Seules les non-conformités **nouvelles** par rapport à la base bloquent.`,
	];
	if (fresh.length === 0 && notMeasured.length === 0) {
		lines.push("", "Aucune non-conformité nouvelle sur les pages rendues.");
	}
	if (fresh.length > 0) {
		lines.push(
			...renderGroups(fresh, index, (f) => {
				const also = f.others.length
					? ` (aussi RGAA ${f.others.join(", ")})`
					: "";
				return `${code(f.page)} ${code(f.selector)} — ${md(f.message)}${also}`;
			}),
		);
	}
	if (notMeasured.length > 0) {
		lines.push("", "#### ⛔ Pages atteintes mais non rendues (bloquant)");
		for (const n of notMeasured) {
			const page = typeof n === "string" ? n : (n.page ?? n.url ?? n.path);
			const reason = typeof n === "string" ? "" : (n.reason ?? n.message ?? "");
			lines.push(`- ${code(pathOf(page))}${reason ? ` — ${md(reason)}` : ""}`);
		}
	}
	const unresolved = affected?.unresolved ?? [];
	const unmapped = affected?.unmapped ?? [];
	if (unresolved.length || unmapped.length) {
		lines.push(
			"",
			"**Non rendus (ni propres ni fautifs, simplement pas vus) :**",
		);
		for (const u of unresolved) {
			lines.push(
				`- route sans URL connue : ${code(typeof u === "string" ? u : (u.path ?? u.entry))}`,
			);
		}
		for (const u of unmapped) {
			lines.push(
				`- n'atteint aucune page : ${code(typeof u === "string" ? u : (u.file ?? u.path))}`,
			);
		}
	}
	const known = (gate.known ?? 0) + (gate.knownNotMeasured ?? 0);
	if (known > 0) {
		lines.push(
			"",
			`Préexistant, hors périmètre : ${known} constat(s) déjà présent(s) sur la base.`,
		);
	}
	lines.push(
		"",
		fresh.length + notMeasured.length > 0
			? "**Verdict : bloquant.** Une non-conformité nouvelle ou une page non rendue."
			: "**Verdict : rien de nouveau sur les pages rendues.**",
	);
	return lines.join("\n");
}

export function renderSkipped(reason) {
	return [
		"### 2. Pages rendues que la PR atteint",
		"",
		`Non lancé : ${md(reason)}`,
		"",
		"Les critères de rendu (contraste RGAA 3.2, focus visible RGAA 10.7, zoom et reflow RGAA 10.4 / 10.11, contenu au survol RGAA 10.13) restent des risques résiduels pour les composants modifiés.",
	].join("\n");
}

function sectionBounds(section) {
	return [
		`<!-- review-a11y:${section} -->`,
		`<!-- /review-a11y:${section} -->`,
	];
}

export function mergeSection(body, section, content) {
	if (!SECTIONS.includes(section))
		throw new Error(`unknown section ${section}`);
	const blocks = {};
	for (const s of SECTIONS) {
		const [open, close] = sectionBounds(s);
		const start = body ? body.indexOf(open) : -1;
		const end = body ? body.indexOf(close) : -1;
		blocks[s] =
			start !== -1 && end > start
				? body.slice(start + open.length, end).trim()
				: s === "rendered"
					? "### 2. Pages rendues que la PR atteint\n\nEn attente du déploiement de la préversion (workflow « Review Auto »)."
					: "### 1. Code modifié — moteur statique\n\nEn attente.";
	}
	blocks[section] = content.trim();
	return [
		MARKER,
		"## ♿ Revue d'accessibilité — RGAA 4.1.2 (review-a11y)",
		"",
		"Le skill `review-a11y` d'ultra11y, sans modèle : ce qui bloque est décidé par le moteur, jamais par un agent. Les constats sont rangés par critère RGAA, la correspondance WCAG entre parenthèses.",
		"",
		...SECTIONS.flatMap((s) => {
			const [open, close] = sectionBounds(s);
			return [open, blocks[s], close, ""];
		}),
		"<sub>Détail et méthode : `docs/accessibilite-ultra11y.md`, « La revue a11y de chaque PR ».</sub>",
		"",
	].join("\n");
}

function args(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1];
	}
	return out;
}

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function readOptional(path) {
	try {
		return path ? readFileSync(path, "utf8") : "";
	} catch {
		return "";
	}
}

function main() {
	const [command, ...rest] = process.argv.slice(2);
	const opts = args(rest);
	let out;
	if (command === "static") {
		out = renderStatic({
			audit: readJson(opts.audit),
			text: readOptional(opts.text),
			base: opts.base ?? "origin/alpha",
			index: indexStandard(loadStandard()),
		});
	} else if (command === "rendered") {
		const affectedText = readOptional(opts.affected);
		out = renderRendered({
			scan: readJson(opts.scan),
			affected: affectedText ? JSON.parse(affectedText) : null,
			baseUrl: opts["base-url"],
			prUrl: opts["pr-url"],
			index: indexStandard(loadStandard()),
		});
	} else if (command === "skipped") {
		out = renderSkipped(opts.reason ?? "aucune préversion déployée.");
	} else if (command === "merge") {
		out = mergeSection(
			readOptional(opts["body-file"]),
			opts.section,
			readFileSync(opts["section-file"], "utf8"),
		);
	} else {
		console.error(
			"usage: review-comment.mjs static|rendered|skipped|merge [options]",
		);
		process.exit(2);
	}
	process.stdout.write(`${out}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
