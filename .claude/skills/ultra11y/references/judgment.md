# Judgment phase (the criteria the AI agent adjudicates)

The engine decides the machine-checkable subset; the **AI agent** (Claude running this skill)
*adjudicates the rest itself*, gated: the **judgment** criteria (alt relevance, link purpose in
context, reading order) it rules on **statically, from the evidence the engine harvests**; the
**rendering** criteria (computed contrast, visible focus, zoom/reflow, content-on-hover) it routes
to the `scan` tier (never source); and it adversarially verifies the detected non-conformities.
This phase makes each verdict defensible and recorded, never invented, never silently "conforming".

## Adjudication loop (the residual/manual criteria) — `verify --manual`

1. **Harvest the worklist** from the audit's cwd (harvesting re-reads the audited source files):
   ```
   node scripts/ultra11y.mjs verify --report audits/wcag-YYYY-MM-DD.md --in audit.json --manual --out .
   ```
   writes an **ADJUDICATION worklist** — `ADJUDICATE.todo.json` + `ADJUDICATE.md`, one item per
   residual (`manual`) criterion, each **pre-loaded with the harvested evidence**: every image's
   `alt`, every link's text + context, the literal colour pairs, control labels, the heading
   outline, ARIA state, `tabindex`, lang-of-parts.
2. **Rule on each item**, filling its `verdict` in `ADJUDICATE.todo.json` (provenance
   `decidedBy: "agent"` is recorded):
   - `C` — conforming, with a `justification` from the evidence;
   - `NC` — non-conforming, with ≥1 **groundable** finding (`file`/`line`/`message`/`snippet`)
     **AND a `normativeRef`** citing the precise failed test of the *active standard* (a WCAG
     technique/SC, or an RGAA test number under `--standard rgaa`). The fold rejects a missing
     `normativeRef`, or one that does not resolve to a real test of the active standard
     (anti-fabrication) — a non-conformity must always name the normative rule it breaks;
   - `NA` — not applicable, with a `justification`;
   - `manual` — undecidable from what is captured, with a `reason`: `"needs-rendered-dom"`
     (decide via `scan`) or `"undecidable"`.
   - `recommendations[]` — a **good practice with no failing normative test** (e.g. "state a
     download link's format/weight", "one `<h1>` per page") is NOT an NC: record it as a
     non-normative recommendation (groundable exactly like an NC, but **no `normativeRef`
     required**). It renders under « Recommandations (non normatives) » and never flips the
     criterion to NC. A purely UX concern is neither an NC nor a recommendation — leave it out.
3. **Fold back FAIL-CLOSED**:
   ```
   node scripts/ultra11y.mjs verify --apply ADJUDICATE.todo.json --in audit.json --out .
   ```
   rejects a null verdict, a `C`/`NA` without a `justification`, an `NC` without a groundable
   finding **or without a resolving `normativeRef`**, a `manual` without a `reason`, or any
   uncovered residual criterion. Agent `NC`s become real `agent:<sc>` findings that re-render in
   the report's §2 and re-enter the verify worklist; `report`/`prd` re-render with the adjudicated
   statuses; §5 shrinks to only the still-`manual` items.

### The judgment-question bank

Each residual criterion in `ADJUDICATE.md` is pre-loaded, alongside the harvested evidence,
with a curated **question bank** (`src/data/manual-questions.json`, SC-keyed onto the WCAG
core, both languages) — the concrete questions an auditor asks to decide *that* criterion
(e.g. under 2.4.4 "does each link's text, in context, convey its destination?"; under 4.1.3
"is every status change announced in a live region?"). They frame the call; they are prompts,
not verdicts — you still answer from the evidence and record `C`/`NC`/`NA`/`manual` (+ a
recommendation where a good practice has no failing normative test).
4. **Rendering required**: a `manual` item marked `needs-rendered-dom` (computed contrast, visible
   focus, 200% zoom, 320px reflow, content-on-hover) is decided on the **render** (the `scan` tier,
   or inspection) — never from the source.
5. **Library code (DSFR…)**: a `<Button>`/`<Card>` does not show its HTML in source. Adjudicate on
   the **produced** HTML (see `render` / audit the build), otherwise the verdict is a false
   negative.

## Adversarial verification of the non-conformities — `verify --report`

Unchanged: `node scripts/ultra11y.mjs verify --report audits/wcag-YYYY-MM-DD.md` writes `VERIFY.md`
+ `VERIFY.todo.json`, one entry per detected non-conformity, each grounded in the **WCAG success
criterion's W3C Understanding reference** + techniques. Rule each, opening the file at the cited
line:
- `supported` — the non-conformity is real and correctly tied;
- `partial` — real but the criterion/wording is imprecise;
- `refuted` — false (the cited element is actually conforming);
- `unsupported` — the cited element is not enough to decide.

Then `node scripts/ultra11y.mjs verify --apply VERIFY.todo.json` is green again (fails on any
`refuted`/`unsupported`/missing verdict). `--semantic` folds the support-check into the same pass.

> For a country standard's own test grid, `criteria --standard rgaa <id>` shows the RGAA tests
> behind a WCAG SC. The pre-completion checklist stops you concluding too early. The rule that
> never bends: no residual criterion reaches `C` without a recorded, gated justification.
