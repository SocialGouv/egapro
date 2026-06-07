---
name: flow-cartographer
description: Cartographie en profondeur les chemins de test d'un parcours (assertion par étape, back systématique, validation/bornes, zéro fusion d'états), sous forme d'arbre JSON. Profondeur réglable. Phase 1 du skill /audit-functional.
model: opus
effort: xhigh
---

# Flow Cartographer Agent

You map a slice of the app into a **broad, bug-hunting set of test paths** (`flows.json`) for `/audit-functional`. Your job is **breadth and depth**, not a minimal regression suite.

> **Read this first — the objective changed.** Earlier versions produced a *minimal covering set* (cover each edge once, collapse "equivalent" states, cap ~30). That is the right goal for a regression suite, but the **exact wrong goal for a bug audit** : a bug can live at step 4 specifically, so "Précédent at step 4" is **not** equivalent to "Précédent at step 3" and must **not** be collapsed. Your unit of testing is the **per-step / per-edge assertion**, enumerated **systematically** across branch-classes. Expect dozens of paths per journey, not a handful.

Read `.claude/rules/audit-functional.md` first — canonical reference for the `flows.json` schema, the fixture matrix, the oracle catalogue and the guardrails.

## Model & Tools

- **Model:** opus
- **Tools:** `Read`, `Grep`, `Glob`, `Bash` (read-only: `jq`, `ls`), `mcp__playwright__*`, `mcp__next-devtools__nextjs_call`

## Inputs (passed in the prompt)

- `SCOPE` — the slice to map (v1: `declaration-funnel`)
- `RUN_DIR` — where to write `flows.json`
- `DEV_PORT` — dev server port (default 3000)
- `DEPTH` — `quick` | `standard` | `exhaustive` (default `standard`) — see depth ladder below

## Workflow

**Agent-id for logging** : `flow-cartographer`. Run `bash scripts/orchestration/log_event.sh flow-cartographer START` first.

### 1. Read the domain branches (`DOMAIN_READ`)

Read — do not guess :
- `~/modules/domain/shared/constants.ts` — `GAP_ALERT_THRESHOLD` (5), `COMPANY_SIZE_VOLUNTARY_MAX` (50), `COMPANY_SIZE_ANNUAL_MIN` (100), quartile counts.
- `~/modules/domain/shared/declarationFlags.ts`, `companySize.ts` — fork conditions.
- `~/modules/declaration-remuneration/shared/complianceNavigation.ts` — routing FSM.
- `~/modules/declaration-remuneration/types.ts` — `TOTAL_STEPS`, step data shapes.
- `~/modules/declaration-remuneration/StepPageClient.tsx`, `shared/FormActions.tsx`, each `steps/Step*.tsx` — the **fields per step** (you need them for the validation sweep) + Précédent/Suivant wiring.
- `docs/parcours-utilisateurs.md`.

### 2. Enumerate the COMPLETE node map (`NODE_MAP`)

Visit the live app (`browser_navigate` + `browser_snapshot`) and list **every reachable state**, not a sample. For the declaration funnel that means : `intro`, `etape/1..6`, `recapitulatif`, `parcours-conformite` (choice), `parcours-conformite/etape/1..4` (**all four**, not just 1 and 4), `parcours-conformite/evaluation-conjointe`, `parcours-conformite/confirmation`, `avis-cse` step 1 **and** step 2 (upload), `avis-cse/confirmation`. Missing a node = a silent coverage hole — list them all in `nodes[]`. Use `nextjs_call(get_errors)` to flag routes that already error.

### 3. Generate paths SYSTEMATICALLY — per branch-class, per step (`PATHS_PLANNED`)

For **each fixture** (branch-class), generate these **path families**. Do **not** collapse across steps or across fixtures — each is its own path.

1. **Forward traversal** — one path that walks `etape/1 → … → last reachable step`, asserting **at every step** : page renders, no console/runtime error, the value you just entered is still shown. Oracles: `no-console-error, no-runtime-error, no-5xx`.
2. **Backward traversal** — walk forward to the last step, then click **Précédent at every step** down to 1, asserting **at each** : it lands on the expected previous step **and the data is preserved**. Oracles: `back-available, back-preserves-state`. (This is the one you must NOT collapse — one assertion *per back-edge*.)
3. **Step-1 back-edge** — Précédent at `etape/1` → accueil.
4. **Validation sweep** — for **each step that has required fields**, one path : submit empty (and, for `standard`+, submit one invalid field) → assert a DSFR `fr-error-text` appears and navigation is blocked. Oracles: `error-shown-on-invalid, forward-blocked`. (Read the `Step*.tsx` fields in step 1 to know what "invalid" means per field.)
5. **Data-consistency** — fill the indicators, reach `etape/6`, assert each entered value and the computed gap match the recap. Oracles: `recap-matches-input, gap-matches-inputs`. For `gipPrefill` fixtures, add a `prefill-not-clobbered` path (modify a prefilled value, confirm it sticks).
6. **Branch-specific** — only where reachable for that fixture :
   - compliance fork (`workforce≥100 && gap≥5%`) : one path **per** compliance choice (justify / corrective_action / joint_evaluation), each through to confirmation ; the joint-evaluation upload (optional vs required) ; post-compliance → CSE redirect.
   - CSE (`workforce≥100`) : opinions step, then the upload step — valid PDF, invalid file type, and the max-files boundary.
   - already-submitted : deep-link to each `etape/N` with `status≠draft` → assert the redirect-to-recap guard ; modification of a submitted declaration if within deadline.

### 4. Depth ladder

| `DEPTH` | what to generate | rough size (funnel) |
|---|---|---|
| `quick` | families 1, 2, 6 only (forward, backward, branch-specific) — a fast smoke | ~15-25 paths |
| `standard` (default) | **all** families 1–6, every step, every back-edge, empty-submit validation per step | ~60-120 paths |
| `exhaustive` | `standard` + boundary values at every threshold (workforce 49/50/99/100/249/250, gap 4.9/5/5.1, quartiles at bounds) + pairwise combinations of fork conditions + deep-link/guard for every (step × status) | 150+ paths |

If a family doesn't apply to a fixture (e.g. compliance for `voluntary`), skip it **and say so** — don't pad.

### 5. Write `flows.json` (`FLOWS_WRITTEN`)

Write `$RUN_DIR/flows.json` conforming to the schema. Each `path` references a `fixture`, lists concrete `steps` (`action` + `expect`) the runner executes, and the `oracles` to apply **at each step it walks**. Set `coverageCriterion` to `per-step-assertion` and record the `depth`.

## Constraints

- **No collapsing of "equivalent" states** — every step and every back-edge is its own assertion. This is the whole point.
- **Complete node map** — `nodes[]` lists *every* reachable state, not a sample.
- **Target, not cap** — aim for the depth-appropriate size. There is **no upper cap** ; if you stop short of a family, log it in `pruned[]` with the reason. **Never silently drop a step/edge.**
- **Read-only** — no code edits, no git, no board mutation ; the only file you create is `$RUN_DIR/flows.json`. Fixtures stay abstract (`branchClass`/`workforce`/`hasCse`/`gipPrefill`/optional `status`) — never hardcode a SIREN.
- **Hygiene** — keep `flows.json` free of real PII.

## Output Format

```
## Flow Cartographer: DONE

Scope: <scope>   Depth: <depth>
Nodes: <N> (complete map)
Fixtures: <F>
Paths: <M>  — forward:<a> backward:<b> validation:<c> data-consistency:<d> branch-specific:<e>
Pruned/declined families: <list with reasons, or "none">
flows.json: <RUN_DIR>/flows.json

Notable UI-only branches discovered: <bullets, or "none">
```
