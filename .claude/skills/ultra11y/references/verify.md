# `check` and `verify` gates

Two assurance levels before shipping a report, plus the agent-adjudication worklist.

## `check` — structural integrity

```
node scripts/ultra11y.mjs check --report audits/wcag-YYYY-MM-DD.md
```
Fails (non-zero) if: one of the 5 sections is missing, a cited criterion id does not exist in
the active standard, an `NA` criterion has no justification, or the pass rate is absent. This
is the baseline anti-hallucination guard. `--quiet` emits only the exit code; `--json` the
structured list of problems. For a country pack report, add `--standard <pack>` so the right
id grammar/registry is validated.

### Semantic gate — `check --report … --semantic`

```
node scripts/ultra11y.mjs check --report audits/wcag-YYYY-MM-DD.md --semantic [--verdicts VERIFY.todo.json]
```
Fails **closed** if there is no adjudicated verdicts artifact (never green-but-inactive),
re-runs the **uncapped** coverage check, and re-grounds every passing verdict against the cited
source. `--verdicts` points at the artifact (default `VERIFY.todo.json` next to the report).

### Applicability gate — `check --report … --standard rgaa --in audit.json`

```
node scripts/ultra11y.mjs check --report audits/rgaa-YYYY-MM-DD.md --standard rgaa --in audit.json
```
Re-derives the pack view from the audit and fails on any **over- or under-projected** NC — the
RGAA applicability gate, so a pack report can neither drop nor invent a criterion vs the WCAG core.

## `verify` — adversarial verification of non-conformities

```
node scripts/ultra11y.mjs verify --report audits/wcag-YYYY-MM-DD.md --semantic
```
Generates a **worklist** `VERIFY.md` + `VERIFY.todo.json`: one entry per non-conformity
(criterion ↔ `file:line` ↔ cited claim), capped by `--max-verify` (default 40). For each
entry, open the cited code and assign a verdict in `VERIFY.todo.json`:

- `supported` — the non-conformity is real;
- `partial` — real but the criterion/wording is imprecise;
- `refuted` — false (the cited element is actually conforming);
- `unsupported` — the cited element is not enough to decide.

In `--semantic` mode, explicitly confirm the cited snippet **supports** the non-conformity.
The worklist-generation step also accepts `--json` (emits `{mdPath, todoPath, count, items}`
so an agent can fill verdicts in-memory). **Prioritise `preliminary` findings** (SFC/library
source, see `references/false-positives.md`): refute the ones the rendered DOM disproves.
Then apply the gate:
```
node scripts/ultra11y.mjs verify --apply VERIFY.todo.json
```
The gate fails (non-zero) if any entry is `refuted`, `unsupported`, or unadjudicated. Goal: no
fabricated non-conformity survives into the final report.

## `verify --manual` — adjudicate the residual (judgment / needs-rendering) criteria

The **AI agent** decides the `manual` criteria itself, gated. Run from the audit's cwd
(harvesting re-reads the audited source files):
```
node scripts/ultra11y.mjs verify --report audits/wcag-YYYY-MM-DD.md --in audit.json --manual --out .
```
This emits an **ADJUDICATION worklist** — `ADJUDICATE.todo.json` + `ADJUDICATE.md`, one item per
residual criterion, pre-loaded with the engine's harvested evidence (every image's `alt`, every
link's text + context, the literal colour pairs, control labels, the heading outline, ARIA state,
`tabindex`, lang-of-parts). Fill each item's `verdict` (provenance `decidedBy: "agent"` recorded):

- `C` / `NA` — with a `justification` from the evidence;
- `NC` — with ≥1 **groundable** finding (`file`/`line`/`message`/`snippet`);
- `manual` — with a `reason`: `"needs-rendered-dom"` (decide via `scan`) or `"undecidable"`.

Fold the verdicts back FAIL-CLOSED:
```
node scripts/ultra11y.mjs verify --apply ADJUDICATE.todo.json --in audit.json --out .
```
It rejects a null verdict, a `C`/`NA` without a `justification`, an `NC` without a groundable
finding, a `manual` without a `reason`, or any uncovered residual criterion. Agent `NC`s become
real `agent:<sc>` findings that re-render in the report's §2 and re-enter the verify worklist;
`report`/`prd` re-render with the adjudicated statuses; §5 shrinks to only still-`manual` items.

## Residual risk

After adjudication, only the criteria the agent marked `manual` (`needs-rendered-dom` /
`undecidable`) stay in the report's "to assess manually" section — never mark them conforming
without a recorded, gated justification (agent adjudication via `verify --manual`, or `scan`
evidence for the rendering criteria).
