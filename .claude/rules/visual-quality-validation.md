---
paths:
  - "src/**/*.tsx"
  - "src/**/*.scss"
---

# Visual Quality Validation

> **Used by**: `design-validator` (the independent visual-fidelity gate, spawned by `code-dev` at step 9). Complements `rules/figma-workflow.md` (which is the *building* discipline for `code-dev`); this rule is the *verification* discipline.

The gate compares the **rendered** UI to its **Figma reference** — numbers first (measured in the DOM), pixels second (onion-skin overlay + Claude vision). It does **not** compare to designer HTML mockups (that legacy `designer` flow is gone). The reference is always the Figma node(s) in the ticket's `## Référence Figma` section.

Why a gate at all: a structural read of the Figma tree (`code-dev` step 7) verifies the *recipe* (token → DSFR class), not the *rendered result*. Misses that survive a structural read — a correct class whose CSS isn't loaded, a DSFR default margin that adds up, a `space-between` gap that collapses at a real viewport, an underline that overruns its text, a bold the API hid — only show up when you render and measure. That is this gate.

---

## Two layers, disjoint failure classes

| Layer | Catches | How |
|---|---|---|
| **Measurement** (primary) | wrong value on a known property (margin, font-size/weight, colour, underline width) | `getBoundingClientRect` / `getComputedStyle` vs Figma `itemSpacing`/`fontSize`/`fontWeight`/`fill` |
| **Overlay + vision** (net) | emergent drift: offset from the *wrong element*, broken wrap, char-level bold, phantom element | onion-skin the render over the Figma PNG; vision reads the ghosting, then point measurement at the flagged region to recover the cause |

Measurement is deterministic and pinpoints the fix; vision catches the long tail measurement can't enumerate. Neither alone is enough — run both.

## Render conditions (non-negotiable)

- **Always ≥2 viewport heights.** Spacing bugs frequently hide at the Figma frame height and only appear when content fills the panel (a `space-between` gap collapses to 0). Render e.g. `1280×1024` (frame) **and** `1280×760` (laptop) and compare the gap across both. A single render at the designed size is the #1 way these slip through.
- **Deterministic state.** Prefer an isolation harness (`/test-panel` → `PanelPlayground`) over the real route; if you must use the real route, freeze data (seeded fixture + `[DEV] Remplir`) so the diff is fidelity, not content drift.
- **Match scale.** Browser `deviceScaleFactor: 2` ↔ Figma `pngScale: 2` so the overlay aligns.

## Tolerances

- Spacing / size: **±1px**. A gap that collapses across viewports is a finding regardless of tolerance (missing minimum margin).
- Colour: **exact DSFR token** (computed `color`/`backgroundColor` must resolve to the Figma `fill` token).
- Font-weight: exact **bucket** (`<600` regular vs `≥600` bold/`<strong>`).
- PASS-only-technical: a system-font-vs-web-font flash during load is not a finding.

## Scope discipline

Judge only what the ticket covers. If a divergence is explicitly assigned to another ticket ("separator colour → #NNNN, do not replay"), do not flag it. `## Référence Figma` is the source of truth, not memory of the design. A UI ticket with **no** `## Référence Figma` → `REFACTO` (cannot validate without a reference; never guess).

## Tooling

- **Figma**: `mcp__figma-dev__get_figma_data` (node tree) + `mcp__figma-dev__download_figma_images` (`pngScale: 2`). Always the **`figma-dev`** server, never the project's HTTP `figma` server (see `rules/figma-workflow.md`).
- **Render / measure / overlay**: `packages/app/scripts/visual-fidelity-probe.mjs` (scenario JSON → screenshots + DOM measurements + onion-skin overlay). Header documents the config shape.
- **Fallback**: `mcp__playwright__*` for ad-hoc navigation/screenshot when a scenario can't be expressed declaratively.

## Verdict & thresholds

Comment on the **ticket**, prefixed `design-validator:` — `PASS` / `RETRY` (fixable miss, describe property + measured-vs-expected) / `REFACTO` (structural drift or missing reference). Max **2 RETRY** → auto-escalate `REFACTO` (ticket → **To Do**). Attach overlay(s) + screenshots (uploaded to GitHub), mandatory even on PASS.

## Exclusions

Not this gate: behaviour (→ `functional-validator`), deep RGAA (→ `rgaa-auditor`), security (→ `security-auditor`), performance.
