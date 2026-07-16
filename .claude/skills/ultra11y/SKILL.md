---
name: ultra11y
description: "Use to AUDIT existing HTML/CSS/JSX against WCAG 2.2 AA accessibility and produce a dated auditor-conformance report, OR to AUTHOR/REVIEW accessible markup (native-HTML-first, ARIA last). An install-free engine (`node scripts/ultra11y.mjs`, no keys) runs 60 static checks across WCAG criteria — alt/lang/title, unlabeled fields, empty links/buttons, tables, heading skips, invalid ARIA, positive tabindex — deciding what it can; the AI agent adjudicates the judgment criteria (alt relevance, link purpose) itself via `verify --manual`, gated, and the needs-rendering ones (contrast, focus, zoom) go to the scan tier — never silently conforming. WCAG 2.2 AA is the worldwide core; RGAA and other standards are pluggable packs (`--standard rgaa`, `--pack`). JSX/TSX parse to a real AST (`audit --graph`); `report`/`prd`/`--gh-issues` share one auditor block per criterion; check/verify reject hallucinated non-conformities. Triggers: 'audit WCAG/a11y', 'make accessible', 'fix a11y', 'audit RGAA'."
license: MIT
metadata:
  version: 2.14.0
---

# ultra11y — audit WCAG 2.2 AA and write accessible markup

On accessibility, an automated tool only sees part of the problem. `ultra11y` owns
that with a **division of labour**: the deterministic, install-free engine
(`node scripts/ultra11y.mjs <command>` — no `npm install`, no key; the JSX/TSX parser
is embedded in the bundle) does the *mechanical* work — detect the machine-checkable
non-conformities and tie each to the right **WCAG success criterion** — and **the AI agent**
(Claude running this skill) *adjudicates the judgment criteria itself* — alt relevance, link
purpose in context, reading order — statically, from the evidence the engine harvests
(`verify --manual`), each verdict gated by `verify`/`check`. Only the truly **rendered-DOM**
criteria (computed contrast, visible focus, zoom/reflow, content-on-hover) fall to the `scan`
tier (axe-core in a real browser); a human is at most optional oversight. Gates stop any
hallucinated non-conformity from surviving, and nothing is ever silently "conforming".

**WCAG 2.2 Level AA is the worldwide core.** Country standards — France's **RGAA**, the
US **Section 508**, the EU **EN 301 549** — are pluggable *standards packs* that map their
criteria onto WCAG. Add `--standard rgaa` to re-key reports/criteria; **plug an external
pack at runtime** with `--pack ./pack.json` (or a `.ultra11yrc.json`), no rebuild; or
contribute your country (see `references/standards.md`). Packs (and their concrete
**implementation guidance** — the RGAA SocialGouv/etalab good/bad patterns) can be
**AI-ingested** and gated by `pack check` so a fabricated mapping never passes — see
`references/packs.md` and `references/guidance.md`.

> **Core rules:**
> 1. **Never invent a non-conformity**: every `NC` cites a real, resolvable element (`check` verifies it).
> 2. **Native HTML first, ARIA last**; never duplicate implicit semantics.
> 3. **Residual is explicit, never silently conforming**: the AI agent *adjudicates* every
>    *judgment* criterion itself (`verify --manual`, gated), and the *rendering* criteria go to
>    `scan`; any criterion still unproven stays "to assess manually" — no status without a
>    recorded, justified verdict.
> 4. **The FINAL rendered semantic HTML must be correct.** The engine sees only source; a
>    component library (DSFR/MUI…) or `.vue`/`.svelte`/`.astro` SFC hides the real markup, so
>    a green source audit is not proof. Verify the produced semantic HTML — install the
>    zero-touch **capture** harvester (`render --setup`) so every component your tests render
>    is serialized to `.ultra11y/captures` and audited, with `audit --require-captures` gating
>    the blind spots. See `references/automation.md` / `rendered.md`.
> 5. **Language**: ALWAYS pass `--lang` matching the language of your conversation with
>    the user; ask the user when ambiguous. Without the flag the CLI auto-detects (repo
>    `<html lang>` → the active standard's default locale → English) — a scripted/CI
>    fallback, not a substitute for passing `--lang` yourself.
> 6. **Technical tokens stay in English, even in French prose.** In any French deliverable
>    you write (report commentary, PRD, GitHub issues, judgment verdicts), attribute/
>    element/role names and their values are code, not prose — never translate them:
>    `aria-live` stays `aria-live` (never « région live »), same for `tabindex`, `alt`,
>    `role="alert"`, landmark role names. The engine's own fr catalog follows this; match
>    it. Normative standard vocabulary (RGAA wording such as « lien d'évitement ») keeps
>    its official French.

## Choose by situation

- **"Audit / compliance report"** → `node scripts/ultra11y.mjs audit … --json`, then
  `report` (synthesis table + one **auditor conformance block** per NC criterion — same
  block `prd`/`--gh-issues` use), then `check`; read **`references/audit.md`**.
- **"Code rendered by a library (DSFR, MUI…) or a `.vue`/`.svelte`/`.astro` SFC / avoid
  false negatives"** → audit the **produced HTML**, not the source template. Easiest:
  install the zero-touch **capture** harvester (`render --setup`) so your tests serialize
  every rendered component to `.ultra11y/captures` (auto-ingested, findings attributed to the
  source component; `render --coverage` and `audit --require-captures` track blind spots). Or
  `render` (build→audit recipe or SSR snapshot `--scaffold`) then `audit` on the output, and
  `scan` for computed rendering. SFC-source findings are flagged `preliminary` (a
  `scope.sourceTemplate` caveat); read **`references/rendered.md`**.
- **"A finding looks wrong / false positive on a component"** → the engine auto-suppresses
  most component false positives (slot/prop-injected names, component children, dynamic
  bindings, conditional headings) and marks SFC/library-source findings `preliminary`;
  confirm or refute the rest with `verify --apply`; read **`references/false-positives.md`**.
- **"Large repo / audit smartly"** → focus: `--changed` (git diff), template
  prioritization, dedup, `--max-files`; read **`references/scale.md`**.
- **"Cross-file analysis (tree + dependencies), JSX/TSX as a real AST"** →
  `audit --graph` resolves imports and applies cross-file rules (an icon-only component
  used without a name, an anchor target in another file…), no browser; read
  **`references/cross-file.md`**.
- **"Generate the fix markdown / PRDs (→ GitHub issues)"** → `prd` (the SAME auditor
  conformance block `report`'s NC section renders — theme/criterion/test/WCAG+level/
  finding/expected/verification in the active standard's vocabulary — as a backlog);
  `--split criterion`, `--format doc` for a product-requirements doc, `--format remediation`
  for the legacy dev backlog, `--gh-issues` for one issue per criterion (that block as the
  body) or `--gh-single` for a single consolidated issue via the `gh` CLI); read
  **`references/prd.md`**.
- **"Plug or author a standards pack (RGAA & beyond), AI-ingest external rules"** →
  `--pack`/`.ultra11yrc.json` to load at runtime, `pack check` to gate it (the
  anti-hallucination guardrail), `pack scaffold` to start one; concrete before/after
  implementation guidance attaches to findings/PRD; read **`references/packs.md`** and
  **`references/guidance.md`**.
- **"Adjudicate the judgment criteria (judgment phase)"** → `verify --manual --in audit.json`
  emits an ADJUDICATION worklist (`ADJUDICATE.todo.json` + `ADJUDICATE.md`), one item per
  residual criterion, pre-loaded with the engine's harvested evidence (every alt, link text +
  context, literal colour pairs, control labels, heading outline, ARIA state, tabindex,
  lang-of-parts); the AI agent fills each `verdict` — `C`/`NA` (with a `justification`), `NC`
  (with a groundable finding), or `manual` (with a `reason`) — then `verify --apply … --in
  audit.json` folds them back FAIL-CLOSED; read **`references/judgment.md`**.
- **"Many items to adjudicate/verify (fan the judgment out to subagents)"** →
  `orchestrate --run <dir>` emits, from the run's CURRENT worklists, one launchable
  multi-agent workflow per ready phase + the `agents/<role>.md` dispatch contracts +
  a sequential `RUNBOOK.md` — the default execution path on a subagent-capable harness;
  see **Orchestration — route by harness** below.
- **"Focus, keyboard & interaction logic (the interaction-logic part)"** → the engine marks
  focus order/visible/trap and on-focus/on-input criteria as residual risks; the AI agent reads
  the full component source and adjudicates the keyboard/focus behaviour (visible-focus and the
  other rendered criteria go to `scan`); read **`references/focus-and-logic.md`**.
- **"Put the fixes in place"** → `fix` (dry-run by default, `--write` applies the safe
  codemods, proposes the rest without inventing anything); read **`references/fix.md`**.
- **"Fix by priority, no regressions (correction phase)"** → `fix` (`--write`,
  `--iterate`) + the `prd` backlog, blocking→major→minor; read **`references/correction.md`**.
- **"Automatic repo gate (hook / CI)"** → `init --hook` writes a git pre-commit gate over
  the **strict staged snapshot** (audits the exact index blobs, auto-applies safe fixes and
  re-stages them, blocks only on judgment issues); `init --baseline`/`--ci` is the opt-in
  "block only NEW non-conformities" variant. For library/SFC code, commit rendered
  **captures** (`render --setup`) and stage them so the real semantic HTML is what's
  checked (`audit --require-captures`); read **`references/automation.md`**.
- **"Make this code accessible / review it"** → audit the snippet
  (`audit - < component.html`) native-first; read **`references/authoring.md`** and
  **`references/forbidden-patterns.md`**.
- **"What does criterion X mean"** → `criteria` (e.g. `criteria 1.4.3`, or
  `criteria --standard rgaa 8.3`); see **`references/criteria.md`**.
- **"Country standard (RGAA, Section 508, EN 301 549)"** → `--standard <pack>` on
  `report`/`prd`/`criteria`/`check`/`verify`; see **`references/standards.md`** and
  **`references/methodology.md`**. **For an RGAA audit, PROPOSE the scan by default**: a real
  RGAA audit runs over a normative page **sample** (échantillon) — declare it in
  `.ultra11yrc.json` under `sample.pages` (+ `transverse`), lint its coverage with
  `sample check` (which required page kinds it lacks, per the pack's `sampleMethodology`), then
  `scan --sample` that sample (Playwright + axe + probes; per-page `storageState` for
  authenticated pages) and `--merge` the result into the audit. Without a merged scan,
  `--standard rgaa` reports are marked **partial** (a CLI warning + a report banner: the
  needs-rendering criteria were not tested) — say so instead of implying full coverage.
- **"High-assurance audit"** → `verify --report … --semantic`; see **`references/verify.md`**.
- **"Check contrast / rendering (dynamic tier)"** → `scan <url> --merge …` (axe-core in a
  headless browser). `--runtime local` (default when Playwright resolves from `--cwd`, **no
  Docker**) also probes focus visibility (2.4.7), 200% zoom (1.4.4), text spacing (1.4.12) and
  content-on-hover (1.4.13) (target size 2.5.8 via axe), and takes `--storage-state` for
  authenticated pages. It additionally runs **stateful** probes (bounded, non-navigating: fill
  inputs then re-measure overflow, and a live-region probe for status messages 4.1.3) — disable
  them with `--no-interact`; on an authenticated (`--storage-state`) scan the live-region probe
  does not click buttons unless you pass `--interact-clicks` (a destructive-named button is never
  clicked either way); see **`references/dynamic.md`**.

## Orchestration — route by harness

The judgment phases fan out: `ADJUDICATE.todo.json` (one item per residual criterion) and
`VERIFY.todo.json` (one entry per NC claim) are independent per-item worklists. The engine
manages the fan-out — `orchestrate` emits the orchestration from the CURRENT worklists,
with absolute paths and the real item ids baked in:

```
node scripts/ultra11y.mjs orchestrate --run <dir> [--phase adjudicate|verify-report] [--eco] [--list]
```

| Your harness | How to run each judgment phase |
|---|---|
| Has the Workflow tool | `orchestrate --run <RUN> --phase <p>`, then `Workflow({ scriptPath: "<RUN>/orchestration/<p>.workflow.mjs" })`. Subagents RETURN verdict fragments; fold them into the worklist yourself, then `verify --apply` as usual. |
| Subagents but no Workflow tool | Same `orchestrate`; dispatch one subagent per batch following `<RUN>/orchestration/agents/<role>.md` (the workflow script shows batches + prompts). One writer: you fold results in. |
| Eco mode, or no subagents | `orchestrate --run <RUN> --eco` → follow `<RUN>/orchestration/RUNBOOK.md` sequentially, playing each role yourself. Correctness-identical; only wall-clock differs. |

Fan-out is an optimization, never a requirement — the gates (`check`, `verify --apply`)
are harness-independent and every phase has a sequential fallback with identical
artifacts. Subagents never write: the emitted contracts end with the one-writer rule,
and `--apply` (the fail-closed fold) always stays with you, the orchestrator. Re-run
`orchestrate` whenever a worklist changes (emission is deterministic and idempotent);
`--phase <p>` before its worklist exists fails and names the command that produces it.

## Command cheat sheet

```
node scripts/ultra11y.mjs audit "src/**/*.html" --json > audit.json
node scripts/ultra11y.mjs audit - < component.html          # HTML via stdin
node scripts/ultra11y.mjs audit "src/**/*.tsx" --jsx        # JSX/TSX as a real AST (streams to stdout; add --out audits to persist)
node scripts/ultra11y.mjs audit "src/**/*.tsx" --graph      # + imports & cross-file rules
node scripts/ultra11y.mjs audit --changed --json            # only the git diff (large repo)
node scripts/ultra11y.mjs audit --staged --fail-on blocking # gate EXACTLY the staged snapshot (pre-commit)
node scripts/ultra11y.mjs audit "src/**" --no-default-excludes   # also audit test/spec/story markup
node scripts/ultra11y.mjs report --in audit.json --out audits          # → audits/wcag-YYYY-MM-DD.md (auditor block per NC criterion)
node scripts/ultra11y.mjs report --in audit.json --standard rgaa       # derived RGAA report (France pack)
node scripts/ultra11y.mjs prd    --in audit.json --gh-issues           # SAME auditor block as a backlog (+ one GitHub issue per criterion)
node scripts/ultra11y.mjs prd    --in audit.json --gh-single          # SAME auditor block (+ ONE consolidated GitHub issue)
node scripts/ultra11y.mjs prd    --in audit.json --format doc          # product-requirements doc (epics/stories/AC)
node scripts/ultra11y.mjs audit "src/**/*.tsx" --graph --pack ./packs/section508.json   # load an external pack at runtime
node scripts/ultra11y.mjs pack check ./packs/section508.json --guidance ./packs/section508.guidance.json   # gate an (AI-)authored pack
node scripts/ultra11y.mjs criteria 1.4.3                    # one WCAG success criterion
node scripts/ultra11y.mjs criteria --list                   # all SCs grouped by guideline
node scripts/ultra11y.mjs criteria --standard rgaa --theme 8   # a pack theme
node scripts/ultra11y.mjs check  --report audits/wcag-YYYY-MM-DD.md
node scripts/ultra11y.mjs verify --report audits/wcag-YYYY-MM-DD.md --semantic
node scripts/ultra11y.mjs orchestrate --run audits              # emit multi-agent workflows + contracts + RUNBOOK from the current worklists
node scripts/ultra11y.mjs orchestrate --run audits --eco        # sequential low-token path (RUNBOOK + contracts only)
node scripts/ultra11y.mjs render                            # build→audit recipe (or --scaffold SSR)
node scripts/ultra11y.mjs render --setup                    # install the zero-touch capture harvester (tests → .ultra11y/captures)
node scripts/ultra11y.mjs render --coverage                 # which components have a rendered capture vs blind spots
node scripts/ultra11y.mjs audit --require-captures          # gate: every opaque/control component must have a rendered capture
node scripts/ultra11y.mjs audit "dist/**/*.html"            # audit the RENDERED HTML (reliable for DSFR/MUI…)
node scripts/ultra11y.mjs fix "src/**/*.html" --write --iterate    # fix and re-apply to a fixpoint
node scripts/ultra11y.mjs fix --staged --write --safe       # auto-apply SAFE fixes to staged files + re-stage
node scripts/ultra11y.mjs init --hook                       # pre-commit gate: strict staged snapshot + safe auto-fix
node scripts/ultra11y.mjs init --hook --baseline            # opt-in: regression gate (hook + baseline)
node scripts/ultra11y.mjs audit "src/**/*.tsx" --jsx --out audits   # persist audits/audit-latest.json (for scan --merge / report --in)
node scripts/ultra11y.mjs scan https://example.com --merge audits/audit-latest.json  # dynamic tier (auto runtime)
node scripts/ultra11y.mjs scan http://localhost:3000 --runtime local --cwd packages/app --storage-state .auth/user.json  # no-Docker axe + probes, authed
node scripts/ultra11y.mjs scan http://localhost:3000 --runtime local --cwd packages/app --no-interact   # skip the stateful probes
node scripts/ultra11y.mjs sample check --standard rgaa      # lint the .ultra11yrc.json page sample vs the standard's required kinds
node scripts/ultra11y.mjs scan --sample --runtime local --cwd packages/app --merge audits/audit-latest.json  # scan the normative page sample (authed pages via --interact-clicks)
node scripts/ultra11y.mjs prd --in audit.json --no-technical   # auditor block WITHOUT the technical ticket sections
```
Machine output everywhere with `--json`. `--lang` follows the conversation (pass it
explicitly); unset it auto-resolves repo `<html lang>` → standard's default locale → English.

## The loop: audit → render → judge → fix → re-audit

To converge on conformance (not a single pass), chain the steps, letting the agent
drive the judgment and content stages:

1. **Audit** the source (`audit … --graph`) for a first map; on library-rendered code,
   **audit the render** (`render` → build/SSR → `audit`) for reliable verdicts (otherwise
   the scope-risk note reminds you).
2. **Adjudicate & refute** with `verify`, two worklists. (a) `verify --manual --in audit.json`
   emits `ADJUDICATE.todo.json` — one item per residual *judgment* criterion, pre-loaded with the
   engine's harvested evidence — which the AI agent rules on (`C`/`NC`/`NA`, or `manual` with a
   `reason` when it truly `needs-rendered-dom`), each verdict carrying a `justification` or a
   groundable finding; `verify --apply … --in audit.json` folds them back FAIL-CLOSED (agent NCs
   become real `agent:<sc>` findings that re-render in §2). (b) `verify --report … [--semantic]`
   builds `VERIFY.todo.json` to **refute any `preliminary`/SFC/library-source finding** the
   rendered DOM disproves (verdicts `supported`/`partial`/`refuted`/`unsupported`);
   `verify --apply` drops the refuted/unsupported ones (the anti-hallucination gate). This
   includes **focus & interaction logic** (read the full component source: keyboard
   operability, focus order/visibility, traps, on-focus/on-input changes; see
   `references/focus-and-logic.md`) and the per-rule traps in `references/false-positives.md`.
   Both worklists fan out (`orchestrate --run <dir> --phase adjudicate|verify-report` —
   see **Orchestration — route by harness**); the `--apply` fold always stays with you.
3. **Fix** by priority: `fix --write --iterate` for the mechanical part (anti-regression
   gate), then hand-apply the judgment/content fixes (alt, labels, structure) guided by
   `references/correction.md`.
4. **Re-audit** (on the render where relevant) and repeat.
5. **Deliver the auditor block.** `report` (compliance doc: synthesis + one auditor
   conformance block — theme/criterion/test/WCAG+level/finding/expected/verification —
   per NC criterion) and `prd` (the same blocks as an actionable backlog, `--gh-issues`
   filing one GitHub issue per criterion with that identical block) are two views of the
   ONE building block, in the language of this conversation (pass `--lang` explicitly —
   Core rule 5).

**Stop** when `check` and `verify --apply` are green again and only explicitly-named
residual risks remain. (To automate the outer cadence, the harness `/loop` command can
re-run this cycle.)

## Combining engine, judgment and residual risk

The `audit` output classes each success criterion: `C`/`NC`/`NA` for the static subset;
`manual` for the rendering/judgment criteria (listed in `residualRisks`). Each SC carries an
`automatability` class — **`static`** (the engine can decide), **`needs-rendering`** (decide
via `scan`/the rendered DOM, never source), or **`judgment`** (the AI agent adjudicates from the
source + context the engine harvests) — which tells you *why* a criterion is `manual` and how to
close it. The engine's `NC`s are **confirmed candidates** (cited `file:line`); a finding marked
`preliminary: true` (SFC/library source) is provisional — confirm against the render or refute
it. The agent adjudicates the `judgment` criteria via `verify --manual` (each verdict recorded
with a `justification` or a groundable finding, folded back FAIL-CLOSED by `verify --apply --in`)
and routes the rendering criteria to `scan` — a criterion is never silently marked "conforming".
The report is complete only when every applicable criterion is a justified `C`/`NC`/`NA` and
every residual risk is named.

**Advisory (non-normative) recommendations are a distinct class.** A good-practice signal with
NO failing normative test — an `advisory` pack rule (e.g. RGAA's download-link recommendation),
a best-practice-only axe violation, or an agent `recommendations[]` verdict — is rendered as
« Recommandation (non normative) » under a dedicated section, **never** as a non-conformity: it
can never flip a criterion to `NC` nor enter `conformancePct`, but stays attached to its
criterion so grounding/`check` still resolve it. An `NC` needs a `normativeRef` citing the
failed test; a recommendation does not. Do not promote a recommendation to an NC (see
`references/false-positives.md` and `references/judgment.md`).

## Do not

- Invent a non-conformity the engine did not find and you cannot see (contrast on
  **inline literal colours** is decided statically; **computed** contrast — external CSS,
  variables — goes through `scan` (Docker tier) or is verified at render before being declared).
- Add ARIA that duplicates native semantics.
- Mark a rendering/judgment criterion "conforming" without a recorded, gated justification
  (agent adjudication via `verify --manual`, or `scan` evidence).
- Hand-edit `references/criteria.md` (generated from the WCAG dataset via `criteria --generate`).

## Scope

Static engine: offline, deterministic, install-free; inputs are HTML + JSX/TSX (real AST,
cross-file analysis via `--graph`) + stdin. The **rendering** criteria (computed contrast,
reflow) are covered by the optional `scan` tier (axe-core, Docker **or** `--runtime local`).
The local runtime additionally **probes** focus visibility (2.4.7), 200% text zoom (1.4.4),
text spacing (1.4.12) and content-on-hover (1.4.13) — observed in the rendered page, raised
as NC only when the failure is seen (a clean probe leaves the SC `manual`, never silently
conforming); reading order and alt relevance are the AI agent's judgment, adjudicated from the
harvested evidence and gated (`verify --manual`).
Data: WCAG 2.2 ©
W3C (W3C Document License); the RGAA pack is RGAA 4.1.2 © DINUM, Licence Ouverte / Etalab
2.0 (see `NOTICE`).
