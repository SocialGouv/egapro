#!/usr/bin/env node
// Generates docs/assets/workflow-agents-ia.svg — the node graph of every agent
// involved in the /analyse and /implement skills.
//
// Usage: node scripts/docs/generate-workflow-graph.mjs
//
// The graph is declarative: edit NODES/EDGES below and re-run. Sources of truth
// are .claude/skills/{analyse,implement}/SKILL.md, .claude/agents/*/AGENT.md and
// scripts/orchestration/*.sh.

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = resolve(ROOT, "docs/assets/workflow-agents-ia.svg");

const W = 2560;
const H = 1660;

const SANS = "Marianne, 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

const C = {
  ink: "#161616",
  muted: "#666666",
  frame: "#DDDDDD",
  frameBg: "#FBFBFC",
  page: "#FFFFFF",
  edge: "#3A3F45",
  edgeSoft: "#9AA0A6",
};

const KIND = {
  skill: { fill: "#000091", stroke: "#000091", text: "#FFFFFF", sub: "#C9C9F5", mono: true },
  opus: { fill: "#F0EAFB", stroke: "#6A3FBF", text: "#3B2170", sub: "#6A5A8C" },
  sonnet: { fill: "#E6F1FC", stroke: "#2A6FD6", text: "#123C77", sub: "#4C6B95" },
  script: { fill: "#F4F5F7", stroke: "#8A9099", text: "#2D3238", sub: "#6E757D", mono: true },
  gate: { fill: "#FFF2E0", stroke: "#D97A00", text: "#7A4400", sub: "#8C6636", dash: "5 4" },
  gh: { fill: "#E7F5EC", stroke: "#2A9159", text: "#14522F", sub: "#3F7458" },
  decision: { fill: "#FFFFFF", stroke: "#3A3F45", text: "#161616", sub: "#666666", hex: true },
  end: { fill: "#EEF0F2", stroke: "#5A5F66", text: "#2D3238", sub: "#5A5F66" },
  ro: { fill: "#E6F1FC", stroke: "#2A6FD6", text: "#123C77", sub: "#4C6B95", dash: "4 3" },
};

const nodes = new Map();
const shapes = [];
const edges = [];
const labels = [];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function node(id, x, y, w, h, kind, lines) {
  const n = { id, x, y, w, h, kind, lines, cx: x + w / 2, cy: y + h / 2 };
  nodes.set(id, n);
  return n;
}
const N = (id) => {
  const n = nodes.get(id);
  if (!n) throw new Error(`unknown node ${id}`);
  return n;
};

// Lays out a left-to-right row: items = [id, width, kind, lines]
function row(x0, y, h, gap, items) {
  let x = x0;
  for (const [id, w, kind, lines] of items) {
    node(id, x, y, w, h, kind, lines);
    x += w + gap;
  }
  return x - gap;
}

function frame(x, y, w, h, title, sub) {
  shapes.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${C.frameBg}" stroke="${C.frame}" stroke-width="1.5"/>`,
  );
  if (title) {
    shapes.push(
      `<text x="${x + 22}" y="${y + 34}" font-family="${SANS}" font-size="21" font-weight="700" fill="${C.ink}">${esc(title)}</text>`,
    );
  }
  if (sub) {
    shapes.push(
      `<text x="${x + 22}" y="${y + 56}" font-family="${SANS}" font-size="13.5" fill="${C.muted}">${esc(sub)}</text>`,
    );
  }
}

function note(x, y, text, opts = {}) {
  labels.push(
    `<text x="${x}" y="${y}" font-family="${opts.mono ? MONO : SANS}" font-size="${opts.size || 13}" fill="${opts.fill || C.muted}" font-style="${opts.italic ? "italic" : "normal"}">${esc(text)}</text>`,
  );
}

// ---- edges -------------------------------------------------------------
function edgePath(d, opts = {}) {
  const color = opts.color || C.edge;
  const marker = opts.noArrow ? "" : ` marker-end="url(#arrow${color === C.edge ? "" : "Soft"})"`;
  edges.push(
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${opts.width || 2}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ""}${marker}/>`,
  );
}

function edgeLabel(x, y, text, opts = {}) {
  const size = opts.size || 12;
  const w = String(text).length * size * 0.56 + 12;
  edges.push(
    `<rect x="${x - w / 2}" y="${y - size * 0.86}" width="${w}" height="${size * 1.5}" rx="4" fill="${C.page}" opacity="0.94"/>`,
    `<text x="${x}" y="${y + size * 0.34}" text-anchor="middle" font-family="${SANS}" font-size="${size}" fill="${opts.fill || "#444A50"}">${esc(text)}</text>`,
  );
}

// a -> b, horizontal (left to right)
function h(a, b, opts = {}) {
  const A = N(a);
  const B = N(b);
  const sx = A.x + A.w;
  const ex = B.x;
  if (Math.abs(A.cy - B.cy) < 1.5) {
    edgePath(`M ${sx} ${A.cy} H ${ex}`, opts);
    if (opts.label) edgeLabel((sx + ex) / 2, A.cy - 9, opts.label, opts);
  } else {
    const mx = opts.mx ?? (sx + ex) / 2;
    edgePath(`M ${sx} ${A.cy} H ${mx} V ${B.cy} H ${ex}`, opts);
    if (opts.label) edgeLabel(mx, (A.cy + B.cy) / 2, opts.label, opts);
  }
}

// a -> b, horizontal right to left
function hl(a, b, opts = {}) {
  const A = N(a);
  const B = N(b);
  const sx = A.x;
  const ex = B.x + B.w;
  edgePath(`M ${sx} ${A.cy} H ${ex}`, opts);
  if (opts.label) edgeLabel((sx + ex) / 2, A.cy - 9, opts.label, opts);
}

// a -> b, vertical (a above b)
function v(a, b, opts = {}) {
  const A = N(a);
  const B = N(b);
  const sy = A.y + A.h;
  const ey = B.y;
  if (Math.abs(A.cx - B.cx) < 1.5) {
    edgePath(`M ${A.cx} ${sy} V ${ey}`, opts);
    if (opts.label) edgeLabel(A.cx, (sy + ey) / 2, opts.label, opts);
  } else {
    const my = opts.my ?? (sy + ey) / 2;
    edgePath(`M ${A.cx} ${sy} V ${my} H ${B.cx} V ${ey}`, opts);
    if (opts.label) edgeLabel((A.cx + B.cx) / 2, my - 8, opts.label, opts);
  }
}

// a bottom -> down to `at` -> across -> up into b bottom
function loopBack(a, b, at, opts = {}) {
  const A = N(a);
  const B = N(b);
  edgePath(`M ${A.cx} ${A.y + A.h} V ${at} H ${B.cx} V ${B.y + B.h}`, opts);
  if (opts.label) edgeLabel((A.cx + B.cx) / 2, at - 9, opts.label, opts);
}

// a top -> up to `at` -> across -> down into b top
function loopOver(a, b, at, opts = {}) {
  const A = N(a);
  const B = N(b);
  const ey = opts.toBottom ? B.y + B.h : B.y;
  edgePath(`M ${A.cx} ${A.y} V ${at} H ${B.cx} V ${ey}`, opts);
  if (opts.label) edgeLabel(opts.lx ?? (A.cx + B.cx) / 2, at - 9, opts.label, opts);
}

// explicit polyline
function poly(points, opts = {}) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  edgePath(d, opts);
}

// ---- rendering ---------------------------------------------------------
function renderNode(n) {
  const k = KIND[n.kind];
  const out = [];
  if (k.hex) {
    const c = 16;
    const { x, y, w, h: hh } = n;
    out.push(
      `<path d="M ${x + c} ${y} H ${x + w - c} L ${x + w} ${y + hh / 2} L ${x + w - c} ${y + hh} H ${x + c} L ${x} ${y + hh / 2} Z" fill="${k.fill}" stroke="${k.stroke}" stroke-width="2"/>`,
    );
  } else {
    out.push(
      `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="9" fill="${k.fill}" stroke="${k.stroke}" stroke-width="2"${k.dash ? ` stroke-dasharray="${k.dash}"` : ""}/>`,
    );
  }
  const ls = n.lines.map((l) => (typeof l === "string" ? { t: l } : l));
  const sizes = ls.map((l) => l.s || (l === ls[0] ? 14.5 : 11.5));
  const total = sizes.reduce((s, x) => s + x * 1.32, 0);
  let cursor = n.cy - total / 2;
  ls.forEach((l, i) => {
    const s = sizes[i];
    cursor += s * 1.32;
    const fill = l.fill || (i === 0 ? k.text : k.sub);
    const weight = l.w || (i === 0 ? 700 : 400);
    const fam = l.mono ?? (i === 0 ? k.mono : false) ? MONO : SANS;
    out.push(
      `<text x="${n.cx}" y="${cursor - s * 0.32}" text-anchor="middle" font-family="${fam}" font-size="${s}" font-weight="${weight}" fill="${fill}">${esc(l.t)}</text>`,
    );
  });
  return out.join("\n");
}

// =======================================================================
//  HEADER
// =======================================================================
const TODAY = new Date().toISOString().slice(0, 10);

shapes.push(
  `<rect x="0" y="0" width="${W}" height="${H}" fill="${C.page}"/>`,
  `<text x="48" y="58" font-family="${SANS}" font-size="34" font-weight="700" fill="${C.ink}">EGAPRO — graphe des agents IA</text>`,
  `<text x="48" y="90" font-family="${SANS}" font-size="15" fill="${C.muted}">Workflows lancés par les skills /analyse (conception) et /implement (exécution) · sources : .claude/skills/, .claude/agents/, scripts/orchestration/ · généré le ${TODAY}</text>`,
);

// =======================================================================
//  PANEL A — /analyse
// =======================================================================
frame(32, 128, 1748, 430, "1 · /analyse <issue#> — CONCEPTION", "Le mode est déduit du type d'issue. Chaque agent obtient une validation utilisateur explicite avant de poster sur GitHub.");

node("an_entry", 60, 293, 160, 60, "skill", [{ t: "/analyse #N" }, { t: "skill", mono: false }]);
node("an_type", 248, 289, 180, 68, "decision", [{ t: "issueType ?" }, { t: "gh issue view" }]);

row(520, 200, 66, 28, [
  ["po", 250, "opus", [{ t: "product-owner" }, { t: "Opus · besoin métier + scénarios PO" , s: 11 }]],
  ["po_gate", 120, "gate", [{ t: "Gate user" }, { t: "validation" }]],
  ["arch_e", 250, "opus", [{ t: "architect" }, { t: "Opus · epic-create / epic-enrich", s: 11 }]],
  ["arch_e_gate", 120, "gate", [{ t: "Gate user" }, { t: "validation" }]],
  ["out_f", 350, "gh", [{ t: "Epic #N + N sub-issues" }, { t: "spec exécutable dans le body", s: 11 }]],
]);
row(520, 290, 66, 28, [
  ["arch_t", 250, "opus", [{ t: "architect" }, { t: "Opus · mode task", s: 11 }]],
  ["arch_t_gate", 120, "gate", [{ t: "Gate user" }, { t: "validation" }]],
  ["out_t", 350, "gh", [{ t: "commentaire ## Analyse architecte", s: 13 }, { t: "body du ticket laissé intact", s: 11 }]],
]);
row(520, 380, 66, 28, [
  ["bug", 250, "opus", [{ t: "bug-analyst" }, { t: "Opus · repro locale / review app / Figma", s: 10.2 }]],
  ["bug_gate", 120, "gate", [{ t: "Gate user" }, { t: "validation" }]],
  ["out_b", 350, "gh", [{ t: "commentaire ## Analyse du bug", s: 13 }, { t: "root cause + vérification one-shot", s: 11 }]],
]);

h("an_entry", "an_type");
h("an_type", "po", { mx: 474, label: "Feature" });
h("an_type", "arch_t", { mx: 474, label: "Task" });
h("an_type", "bug", { mx: 474, label: "Bug" });
h("po", "po_gate");
h("po_gate", "arch_e");
h("arch_e", "arch_e_gate");
h("arch_e_gate", "out_f");
h("arch_t", "arch_t_gate");
h("arch_t_gate", "out_t");
h("bug", "bug_gate");
h("bug_gate", "out_b");

note(60, 486, "Chaque ticket feuille reçoit Size + Estimate (set_ticket_size.sh) — ces points alimentent /velocity et /plan-sprint.");
note(60, 510, "Aucune transition de board ici : To Do → In progress est la responsabilité de /implement.");

// =======================================================================
//  LEGEND
// =======================================================================
frame(1808, 128, 720, 430, "Légende");

const LEGEND = [
  ["lg_opus", "opus", "Agent Opus", "raisonnement lourd — conception, tests, rework"],
  ["lg_sonnet", "sonnet", "Agent Sonnet", "exécution cadrée, gates qualité"],
  ["lg_script", "script", "script.sh", "orchestration bash — scripts/orchestration/"],
  ["lg_gate", "gate", "Gate user", "validation utilisateur explicite requise"],
  ["lg_gh", "gh", "artefact GitHub", "issue, commentaire, PR, branche"],
  ["lg_dec", "decision", "décision", "branchement sur un verdict"],
  ["lg_step", "end", "étape / gate externe", "pas un agent — étape interne, CI, SonarCloud, fin de flux"],
];
LEGEND.forEach(([id, kind, label, desc], i) => {
  const y = 178 + i * 42;
  node(id, 1830, y, 190, 34, kind, [{ t: label, s: 12.5 }]);
  labels.push(
    `<text x="2038" y="${y + 22}" font-family="${SANS}" font-size="13.5" fill="#3A3F45">${esc(desc)}</text>`,
  );
});
note(1830, 496, "— — —   boucle de reprise / handback vers l'agent précédent");
note(1830, 520, "cadre pointillé bleu = agent read-only : il rapporte des findings, ne corrige rien");
note(1830, 544, "Un sous-agent ne peut pas en spawner un autre → code-dev tourne comme process CLI.");

// =======================================================================
//  PANEL B — /implement, mode epic
// =======================================================================
frame(32, 584, 2496, 560, "2 · /implement <issue#> — mode EPIC (issue type Feature)", "epic_loop.sh en background : N sous-tickets en parallèle, PRs squash-mergées dans la branche d'intégration epic/<N>.");

row(60, 696, 60, 24, [
  ["ep_entry", 170, "skill", [{ t: "/implement #N" }, { t: "mode epic", mono: false }]],
  ["ep_branch", 220, "script", [{ t: "ensure_epic_branch.sh", s: 12 }, { t: "epic/<N> depuis alpha", s: 11 }]],
  ["ep_loop", 240, "script", [{ t: "nohup epic_loop.sh &", s: 12 }, { t: "loop driver background", s: 11 }]],
]);

shapes.push(
  `<rect x="790" y="650" width="1430" height="178" rx="12" fill="#FFFFFF" stroke="#B9BEC4" stroke-width="1.5" stroke-dasharray="7 5"/>`,
  `<text x="808" y="674" font-family="${SANS}" font-size="14" font-weight="700" fill="#5A6068">TICK — répété jusqu'à convergence (EPIC_LOOP_MAX_TICKS = 30)</text>`,
);
row(808, 692, 64, 16, [
  ["t_clean", 230, "script", [{ t: "cleanup_terminal_worktrees.sh", s: 11.2 }, { t: "libère les slots", s: 11 }]],
  ["t_rebase", 200, "script", [{ t: "rebase_epic_branch.sh", s: 12 }, { t: "epic/<N> ← alpha", s: 11 }]],
  ["t_plan", 205, "script", [{ t: "dispatch_plan.sh", s: 12.5 }, { t: "DAG ## Depends on", s: 11 }]],
  ["t_dev", 220, "sonnet", [{ t: "code-dev × N" }, { t: "CLI isolé · worktree + port", s: 10.6 }]],
  ["t_proc", 215, "script", [{ t: "process_tick_result.sh", s: 11.6 }, { t: "JSON → mutations board", s: 10.6 }]],
  ["t_merge", 230, "script", [{ t: "merge_validated_ticket.sh", s: 11.2 }, { t: "squash-merge → epic/<N>", s: 10.8 }]],
]);

h("ep_entry", "ep_branch");
h("ep_branch", "ep_loop");
h("ep_loop", "t_clean");
h("t_clean", "t_rebase");
h("t_rebase", "t_plan");
h("t_plan", "t_dev");
h("t_dev", "t_proc");
h("t_proc", "t_merge");
loopBack("t_merge", "t_clean", 786, { dash: "6 4", label: "tick suivant", color: C.edgeSoft });
note(808, 818, "≤ EPIC_MAX_PARALLEL (5) tickets en vol · un process claude CLI par ticket, budget USD isolé", { size: 11 });

[
  ["g_check", 60, 260, "decision", [{ t: "tous les sous-tickets", s: 13.5 }, { t: "squash-mergés dans epic/<N> ?", s: 11 }]],
  ["g_rune2e", 390, 200, "script", [{ t: "run_e2e_dev.sh", s: 13 }, { t: "worktree + stack dédiés", s: 10.8 }]],
  ["g_e2e", 612, 210, "opus", [{ t: "e2e-dev" }, { t: "Opus · suite Playwright complète", s: 10.4 }]],
  ["g_verdict", 844, 150, "decision", [{ t: "verdict ?" }]],
  ["g_doc_sh", 1090, 190, "script", [{ t: "run_doc_writer.sh", s: 12 }]],
  ["g_doc", 1302, 175, "sonnet", [{ t: "doc-writer" }, { t: "Sonnet · docs/*.md", s: 11 }]],
  ["g_finalpr_sh", 1499, 210, "script", [{ t: "open_epic_final_pr.sh", s: 11.6 }]],
  ["g_pr", 1731, 215, "gh", [{ t: "PR epic/<N> → alpha", s: 13.5 }, { t: "Closes #N par sous-ticket", s: 10.6 }]],
  ["g_accept", 1968, 185, "gate", [{ t: "Gate d'acceptation", s: 13 }, { t: "l'utilisateur teste", s: 10.8 }]],
  ["g_end", 2263, 190, "end", [{ t: "Fin" }, { t: "l'humain review + merge", s: 10.8 }]],
].forEach(([id, x, w, kind, lines]) => node(id, x, 890, w, 64, kind, lines));

node("r_sh", 790, 1000, 235, 64, "script", [{ t: "run_architect_rework.sh", s: 11.6 }]);
node("r_agent", 505, 1000, 240, 64, "opus", [{ t: "architect-rework" }, { t: "Opus · e2e-regression | user-feedback", s: 10 }]);
node("r_out", 215, 1000, 250, 64, "gh", [{ t: "tickets Task de fix", s: 13.5 }, { t: "créés en To Do", s: 11 }]);

poly(
  [
    [923, 828],
    [923, 848],
    [195, 848],
    [195, 890],
  ],
  { color: C.edgeSoft, dash: "6 4" },
);
edgeLabel(550, 842, "quand plus aucune branche ticket/* n'existe sur origin", { fill: "#5A6068" });

h("g_check", "g_rune2e", { label: "oui" });
h("g_rune2e", "g_e2e");
h("g_e2e", "g_verdict");
h("g_verdict", "g_doc_sh", { label: "validated" });
h("g_doc_sh", "g_doc");
h("g_doc", "g_finalpr_sh");
h("g_finalpr_sh", "g_pr");
h("g_pr", "g_accept");
h("g_accept", "g_end", { label: "tout est bon" });

v("g_verdict", "r_sh", { label: "regression (gate bloquante)" });
hl("r_sh", "r_agent");
hl("r_agent", "r_out");
loopOver("r_out", "t_plan", 868, { toBottom: true, dash: "6 4", color: C.edgeSoft, label: "repris au tick suivant · max 3 rounds puis dispatch=escalate", lx: 1150 });

poly(
  [
    [2054, 954],
    [2054, 1102],
    [625, 1102],
    [625, 1064],
  ],
  { dash: "6 4", color: C.edgeSoft },
);
edgeLabel(1500, 1096, "« demander des changements » → mode user-feedback", { fill: "#5A6068" });

note(60, 1128, "Suivi : /loop /report <N> (auto-report adaptatif) · état des ticks : .claude/state/epic_run/ · exit 2 = dispatch=escalate, intervention humaine requise.");

// =======================================================================
//  PANEL C — /implement, mode task / bug
// =======================================================================
frame(32, 1172, 1080, 460, "3 · /implement <issue#> — mode TASK / BUG", "Pas de loop : code-dev en CLI foreground bloquant, puis e2e-dev sur le même worktree.");

[
  ["c_entry", 60, 150, "skill", [{ t: "/implement #N", s: 13 }]],
  ["c_check", 230, 175, "decision", [{ t: "analyse présente ?", s: 13 }]],
  ["c_wt", 465, 185, "script", [{ t: "setup-worktree.sh", s: 12 }, { t: "worktree + stack docker", s: 10.6 }]],
  ["c_link", 668, 200, "script", [{ t: "create_linked_branch.sh", s: 11.4 }]],
  ["c_status", 886, 200, "script", [{ t: "set_ticket_status.sh", s: 12 }, { t: "→ In progress", s: 11 }]],
].forEach(([id, x, w, kind, lines]) => node(id, x, 1250, w, 58, kind, lines));
[
  ["c_dev", 60, 225, "sonnet", [{ t: "code-dev" }, { t: "CLI foreground · Opus si complexe", s: 10 }]],
  ["c_v1", 305, 130, "decision", [{ t: "verdict ?", s: 13 }]],
  ["c_e2e", 513, 190, "opus", [{ t: "e2e-dev" }, { t: "Opus · port 3000 imposé", s: 10.6 }]],
  ["c_v2", 721, 130, "decision", [{ t: "verdict ?", s: 13 }]],
  ["c_pr", 929, 170, "gh", [{ t: "PR ready" }, { t: "ticket reste In progress", s: 10.6 }]],
].forEach(([id, x, w, kind, lines]) => node(id, x, 1332, w, 58, kind, lines));
node("c_opus", 60, 1440, 225, 58, "opus", [{ t: "relance code-dev" }, { t: "--model opus", s: 11, mono: true }]);
node("c_todo", 305, 1440, 215, 58, "gh", [{ t: "ticket → To Do", s: 13.5 }, { t: "re-spec via /analyse", s: 10.8 }]);
node("c_rework", 540, 1440, 270, 58, "opus", [{ t: "architect-rework" }, { t: "Opus · crée les tickets de fix", s: 10.4 }]);

h("c_entry", "c_check");
h("c_check", "c_wt", { label: "oui" });
h("c_wt", "c_link");
h("c_link", "c_status");
v("c_status", "c_dev", { my: 1320 });
h("c_dev", "c_v1");
h("c_v1", "c_e2e", { label: "validated" });
h("c_e2e", "c_v2");
h("c_v2", "c_pr", { label: "validated" });
v("c_v1", "c_opus", { my: 1412, label: "needs_opus_escalation" });
v("c_v1", "c_todo", { my: 1412, label: "refacto" });
v("c_v2", "c_rework", { my: 1412, label: "regression" });
poly(
  [
    [60, 1469],
    [46, 1469],
    [46, 1361],
    [60, 1361],
  ],
  { dash: "6 4", color: C.edgeSoft },
);

note(60, 1540, "Le ticket reste In progress : les transitions In review / Done sont user-only.");
note(60, 1564, "code-dev n'écrit aucun test — TU + intégration → tu-dev, E2E → e2e-dev.");
note(60, 1588, "Analyse absente (## Analyse architecte / ## Analyse du bug) → /implement propose /analyse <N> et sort.");

// =======================================================================
//  PANEL D — zoom code-dev
// =======================================================================
frame(1140, 1172, 1388, 460, "4 · Zoom code-dev — le seul agent qui spawne des sous-agents", "Il tourne comme process CLI main agent : un sous-agent ne peut pas en spawner un autre.");

row(1162, 1252, 58, 18, [
  ["d5", 160, "end", [{ t: "5 · implémenter", s: 13.5 }, { t: "aucun test écrit", s: 10.8 }]],
  ["d55", 180, "opus", [{ t: "5.5 · tu-dev", s: 13.5 }, { t: "Opus · vitest TU + intégration", s: 10 }]],
  ["d6", 175, "end", [{ t: "6 · quality gates", s: 13.5 }, { t: "4 agents en parallèle", s: 10.6 }]],
  ["d7", 150, "end", [{ t: "7 · Figma", s: 13.5 }, { t: "construction fidèle", s: 10.6 }]],
  ["d8", 175, "end", [{ t: "8 · PR draft", s: 13 }, { t: "force_pr_issue_link.sh", s: 10 }]],
  ["d9", 175, "end", [{ t: "9 · validations", s: 13.5 }, { t: "4 axes en parallèle", s: 10.6 }]],
  ["d10", 170, "gh", [{ t: "10 · pr ready", s: 13.5 }, { t: "status: validated", s: 10.6 }]],
]);

const GATES = [
  ["dg1", "validator", "typecheck · test · lint · format"],
  ["dg2", "structural-auditor", "17 règles projet"],
  ["dg3", "rgaa-auditor", "si .tsx modifié"],
  ["dg4", "security-auditor", "si fichiers serveur"],
];
GATES.forEach(([id, label, sub], i) => {
  node(id, 1470, 1350 + i * 42, 250, 34, "ro", [{ t: `${label}  ·  ${sub}`, s: 10.8 }]);
});
const AXES = [
  ["da1", "ro", "functional-validator · scénarios PO"],
  ["da2", "ro", "design-validator · fidélité Figma (UI)"],
  ["da3", "end", "9b · CI GitHub Actions"],
  ["da4", "end", "9c/9d · SonarCloud + bots de review"],
];
AXES.forEach(([id, kind, label], i) => {
  node(id, 2020, 1350 + i * 42, 270, 34, kind, [{ t: label, s: 10.4 }]);
});

for (const id of ["d5", "d55", "d6", "d7", "d8", "d9"]) {
  const next = { d5: "d55", d55: "d6", d6: "d7", d7: "d8", d8: "d9", d9: "d10" }[id];
  h(id, next);
}
loopBack("d55", "d5", 1338, { dash: "6 4", color: C.edgeSoft, label: "TU REGRESSION" });

poly(
  [
    [N("d6").cx, 1310],
    [N("d6").cx, 1330],
    [1440, 1330],
    [1440, 1493],
  ],
  { color: C.edgeSoft, noArrow: true },
);
GATES.forEach(([id]) => {
  const n = N(id);
  edgePath(`M 1440 ${n.cy} H ${n.x}`, { color: C.edgeSoft });
});
poly(
  [
    [N("d9").cx, 1310],
    [N("d9").cx, 1330],
    [1990, 1330],
    [1990, 1493],
  ],
  { color: C.edgeSoft, noArrow: true },
);
AXES.forEach(([id]) => {
  const n = N(id);
  edgePath(`M 1990 ${n.cy} H ${n.x}`, { color: C.edgeSoft });
});

note(1162, 1560, "3 RETRY sur un axe → needs_opus_escalation (Sonnet) / refacto (Opus). Les 4 auditors + les 2 validators sont read-only : ils rapportent, code-dev corrige.");
note(1162, 1584, "9b / 9c / 9d ne sont pas des agents mais des gates externes : CI GitHub Actions, SonarCloud, bots de review.");

// =======================================================================
//  OUTPUT
// =======================================================================
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphe des agents IA des skills /analyse et /implement du projet EGAPRO">
<title>EGAPRO — graphe des agents IA des skills /analyse et /implement</title>
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.edge}"/>
  </marker>
  <marker id="arrowSoft" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.edgeSoft}"/>
  </marker>
</defs>
${shapes.join("\n")}
${edges.join("\n")}
${[...nodes.values()].map(renderNode).join("\n")}
${labels.join("\n")}
</svg>
`;

writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${svg.length} bytes, ${nodes.size} nodes)`);
