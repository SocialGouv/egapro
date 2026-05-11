#!/usr/bin/env node
// Génère un flowchart Mermaid à partir d'un fichier de règles JSON
// (rules-engine versionné — cf. docs/Rules-engine.md et ticket #3144).
//
// Usage :
//   node scripts/docs/render-rules-fsm.mjs <path-to-rules.json>
//
// Le mermaid est écrit sur stdout. Pour générer un SVG depuis le résultat :
//   node scripts/docs/render-rules-fsm.mjs docs/rules-engine-v2027.1-draft.json \
//     | npx -y --package=@mermaid-js/mermaid-cli mmdc -i - -o docs/rules-engine-v2027.1-fsm.svg -w 3200

import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
	console.error("Usage: node scripts/docs/render-rules-fsm.mjs <rules.json>");
	process.exit(1);
}

const rules = JSON.parse(readFileSync(path, "utf8"));

function formatPredicate(p) {
	if (!p) return "";
	if ("all" in p) return p.all.map(formatPredicate).join(" ∧ ");
	if ("any" in p) return "(" + p.any.map(formatPredicate).join(" ∨ ") + ")";
	if ("not" in p) return "¬" + formatPredicate(p.not);
	if ("compute" in p) return p.compute;
	if (p.op === "isNull") return p.fact + " is null";
	if (p.op === "isNotNull") return p.fact + " is not null";
	if (p.op === "in") return p.fact + " ∈ [...]";
	const rhs = "threshold" in p ? `@${p.threshold}` : JSON.stringify(p.value);
	return p.fact + " " + p.op + " " + rhs;
}

function transitionLabel(t) {
	const parts = [t.action];
	if (t.matchPayload) {
		parts.push(
			"{" +
				Object.entries(t.matchPayload)
					.map(([k, v]) => `${k}=${v}`)
					.join(", ") +
				"}",
		);
	}
	if (t.guard) {
		parts.push("⚙ " + formatPredicate(t.guard));
	}
	return parts.join("<br/>");
}

const stateClass = (id) => {
	if (id === "demarche_completed") return "final";
	if (id.endsWith("_submitted") || id === "cse_opinion_submitted") return "submitted";
	if (id.endsWith("_chosen")) return "chosen";
	return "neutral";
};

const out = [];
out.push("flowchart TB");
out.push("");

// Group states by stage
const byStage = new Map();
for (const s of rules.states) {
	const k = s.stage ?? "init";
	if (!byStage.has(k)) byStage.set(k, []);
	byStage.get(k).push(s);
}

const stageNames = new Map((rules.stages ?? []).map((s) => [s.id, s.name]));

for (const [stageId, states] of byStage) {
	if (stageId === "init") {
		for (const s of states) out.push(`    ${s.id}(["${s.id}"]):::initial`);
	} else {
		const name = stageNames.get(stageId) ?? `Stage ${stageId}`;
		out.push(`    subgraph stage_${stageId} ["Stage ${stageId} — ${name}"]`);
		for (const s of states) {
			out.push(`        ${s.id}["${s.id}"]:::${stateClass(s.id)}`);
		}
		out.push("    end");
	}
	out.push("");
}

for (const t of rules.transitions) {
	const label = transitionLabel(t);
	for (const from of t.from) {
		out.push(`    ${from} -->|"${label}"| ${t.to}`);
	}
}

out.push("");

// ── Legend: thresholds + computations definitions ──
out.push(`    subgraph legend ["📖 Légende"]`);
out.push("        direction TB");

const thresholdLines = Object.entries(rules.thresholds ?? {}).map(
	([k, v]) => `${k} = ${typeof v === "string" ? `"${v}"` : v}`,
);
if (thresholdLines.length > 0) {
	out.push(`        thresholds_def["<b>Thresholds</b><br/>${thresholdLines.join("<br/>")}"]:::legendBox`);
}

const computationLines = Object.entries(rules.computations ?? {}).map(
	([name, predicate]) => `<b>${name}</b> = ${formatPredicate(predicate)}`,
);
if (computationLines.length > 0) {
	out.push(`        computations_def["<b>Computations</b><br/>${computationLines.join("<br/><br/>")}"]:::legendBox`);
}

out.push("    end");
out.push("");
out.push("    classDef initial fill:#fff2a8,stroke:#b59e00,color:#000,font-weight:bold");
out.push("    classDef neutral fill:#cfe3ff,stroke:#2d5fa8,color:#000");
out.push("    classDef chosen fill:#fff6c9,stroke:#a88a2d,color:#000");
out.push("    classDef submitted fill:#c5e8e0,stroke:#0a7a6a,color:#000,font-weight:bold");
out.push("    classDef final fill:#c9f0a1,stroke:#3b7a1d,color:#000,font-weight:bold");
out.push("    classDef legendBox fill:#f5f5f5,stroke:#666,color:#000,text-align:left");

console.log(out.join("\n"));
