#!/usr/bin/env node
// Coverage proof for the AI-config migration: where did every line of the old corpus go?
//
// Old corpus (read from git <ref>): .claude/rules, .claude/agents, .claude/pipeline,
// .claude/skills, CLAUDE.md, packages/app/CLAUDE.md. New corpus (working tree): AGENTS.md,
// packages/app/AGENTS.md, .agents/skills/**, docs/**.
//
// Each old line of ≥ 6 words is classified:
//   verbatim   — found as-is (normalised) in the new corpus
//   reworded   — a new line holds ≥ 60 % of its distinctive words
//   absent     — neither; listed in the report for a human to judge (dropped on purpose,
//                translated EN → FR, or lost)
//
//   node scripts/ai/migration-coverage.mjs [<ref>=origin/alpha] [--out <file.md>]

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : null;
const ref = args.find((a, i) => !a.startsWith("--") && i !== outIdx + 1) ?? "origin/alpha";
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 });

const OLD_PREFIXES = [".claude/rules/", ".claude/agents/", ".claude/pipeline/", ".claude/skills/"];
const oldFiles = git("ls-tree", "-r", "--name-only", ref)
	.split("\n")
	.filter((f) => f.endsWith(".md") && (OLD_PREFIXES.some((p) => f.startsWith(p)) || f === "CLAUDE.md" || f === "packages/app/CLAUDE.md"));

const walk = (d) =>
	readdirSync(d).flatMap((f) => {
		const p = join(d, f);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
	});
const newFiles = [join(root, "AGENTS.md"), join(root, "packages/app/AGENTS.md"), ...walk(join(root, ".agents/skills")), ...walk(join(root, "docs"))];

const STOP = new Set("le la les un une des de du et ou à au aux en dans sur pour par avec sans ne pas que qui est sont the a an of to in on for and or is are be it this that with as by from not no".split(" "));
const normalise = (s) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[`*_>#|[\]()~"'’«»:;,.!?]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
const words = (n) => n.split(" ").filter((w) => w.length > 2 && !STOP.has(w));

const newLines = newFiles.flatMap((f) => readFileSync(f, "utf8").split("\n")).map(normalise).filter(Boolean);
const newBlob = newLines.join("\n");
const newSets = newLines.map((l) => new Set(words(l)));

const perFile = [];
const absent = [];
for (const f of oldFiles) {
	const lines = git("show", `${ref}:${f}`).split("\n");
	let fm = false;
	const counts = { verbatim: 0, reworded: 0, absent: 0 };
	lines.forEach((raw, i) => {
		if (i === 0 && raw.trim() === "---") fm = true;
		else if (fm && raw.trim() === "---") {
			fm = false;
			return;
		}
		if (fm || /^\s*(```|\|[-: |]+\|\s*$)/.test(raw)) return;
		const n = normalise(raw);
		const w = words(n);
		if (w.length < 6) return;
		if (newBlob.includes(n)) return counts.verbatim++;
		let best = 0;
		for (const s of newSets) {
			let hit = 0;
			for (const x of w) if (s.has(x)) hit++;
			if (hit / w.length > best) best = hit / w.length;
			if (best >= 0.6) break;
		}
		if (best >= 0.6) return counts.reworded++;
		counts.absent++;
		absent.push({ file: f, line: i + 1, text: raw.trim().slice(0, 220) });
	});
	const total = counts.verbatim + counts.reworded + counts.absent;
	perFile.push({ file: f, ...counts, total, kept: total ? Math.round(((counts.verbatim + counts.reworded) / total) * 100) : 100 });
}

const sum = perFile.reduce((a, r) => ({ verbatim: a.verbatim + r.verbatim, reworded: a.reworded + r.reworded, absent: a.absent + r.absent, total: a.total + r.total }), { verbatim: 0, reworded: 0, absent: 0, total: 0 });
const pct = (x) => `${Math.round((x / sum.total) * 100)} %`;
const report = [
	`# Couverture de la migration (ancien corpus : \`${ref}\`)`,
	"",
	`${sum.total} lignes porteuses de sens (≥ 6 mots) dans ${oldFiles.length} fichiers : **${pct(sum.verbatim)} verbatim**, **${pct(sum.reworded)} reformulées**, **${pct(sum.absent)} absentes** (à juger ci-dessous).`,
	"",
	"| Ancien fichier | Lignes | Verbatim | Reformulées | Absentes | Conservé |",
	"|---|---:|---:|---:|---:|---:|",
	...perFile.sort((a, b) => a.kept - b.kept).map((r) => `| \`${r.file}\` | ${r.total} | ${r.verbatim} | ${r.reworded} | ${r.absent} | ${r.kept} % |`),
	"",
	"## Lignes absentes",
	"",
	...absent.map((a) => `- \`${a.file}:${a.line}\` — ${a.text.replace(/\|/g, "\\|")}`),
	"",
].join("\n");

if (out) writeFileSync(out, report);
console.log(report.split("\n").slice(0, 3 + 4 + perFile.length).join("\n"));
