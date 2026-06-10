---
description: Automated guardrails, quality gates, and agent delegation — always loaded
---

# Automated Guardrails

> **Used by**: tous les agents et toute session. Décrit les hooks (`block-bad-patterns.sh`, `auto-lint.sh`, `check-pr-reviews.sh`), les 4 auditors obligatoires, et la liste des skills.

Everything below is **automatic**. No commands needed — the rules trigger themselves.

---

## Hooks (`.claude/settings.json`)

Three hooks enforce rules automatically:

### UserPromptSubmit — `check-pr-reviews.sh`

Runs once per session when the user sends their first message. If the current branch has an open PR with unresolved review comments or changes requested, warns and suggests `/review`. Skips on `alpha` branches.

### PreToolUse — `block-bad-patterns.sh` (matcher: `Edit|Write`)

Blocks edits containing forbidden patterns:

| Pattern | Files | What to do instead |
|---|---|---|
| `biome-ignore`, `eslint-disable`, `@ts-ignore`, `@ts-expect-error` | `.ts/.tsx/.js/.jsx` | Fix the underlying issue |
| `style={` | `.tsx/.jsx` | Use DSFR classes or a scoped SCSS module |
| `<svg>` | `.tsx/.jsx` | Use `DsfrPictogram` for DSFR artwork, `public/assets/*.svg` + `<Image>`, or DSFR icon classes (`fr-icon-*`) |
| `<img>` | `.tsx/.jsx` (excl. test files) | Use `import Image from "next/image"` |
| `process.env` | `.ts/.tsx` (excl. `env.js`, `instrumentation.ts`, `next.config`, `trpc/react.tsx`) | `import { env } from "~/env.js"` |
| `../../` (or deeper) | `.ts/.tsx` | Use `~/` path alias |
| `@media` (width/screen) | `.scss` | Use DSFR mixins: `@include respond-from(md)` / `respond-to(sm)` |
| `dangerouslySetInnerHTML` | `.tsx/.jsx` | XSS risk — use safe rendering or DOMPurify |
| `: any`, `as any` | `.ts/.tsx` (excl. test files) | Use `unknown` with type narrowing |
| `getFullYear()` | `.ts/.tsx` (excl. `domain/`, tests) | Use `getCurrentYear()` / `getCseYear()` from `~/modules/domain` |
| `slice(0, 9)` | `.ts/.tsx` (excl. `domain/`, tests) | Use `extractSiren()` from `~/modules/domain` |
| `from "zod"` | `routers/*.ts`, `.tsx` (excl. tests) | Import schemas from `~/modules/{domain}/schemas.ts` |
| `#hex`, `rgb()`, `rgba()` | `.scss` | Use DSFR CSS custom properties |
| Non-route `.tsx` in `src/app/` | `src/app/**/*.tsx` | Move to `src/modules/` and import from barrel |

To add a new rule: append a `check_pattern` call in `block-bad-patterns.sh`.
If a hook blocks your edit, do NOT attempt to bypass it. Rethink the approach.

### PostToolUse — `auto-lint.sh` (matcher: `Edit|Write|Bash`)

Runs `pnpm biome check --write` automatically:

- **After Edit/Write**: lints the single edited file
- **After Bash**: lints all git-modified files after `pnpm test|build|typecheck|lint|format|check`

---

## Automatic quality gates (mandatory)

These gates trigger **automatically** without user input. Do NOT wait to be asked.
**All gates are mandatory on every task** (junior-proof policy).

### Quality gates — agent delegation

Within the `/implement` pipeline, the unit/integration tests are written by the `tu-dev` agent (always Opus, invoked by `code-dev` at step 5.5) right after implementation — `code-dev` no longer writes, runs, or reads any unit/integration test itself. `tu-dev` triages failures and hands control back to `code-dev` on a genuine regression (comment `tu-dev:` on the ticket). Then the quality gates are delegated by the `code-dev` agent (step 6) — it invokes the 4 auditors in parallel, before opening the draft PR. `tu-dev` runs **only** inside the pipeline.

The **E2E** tests are owned by a separate agent, `e2e-dev` (always Opus), which runs at the **end of the pipeline** — `code-dev` no longer writes any E2E test either. For a **Feature**, `e2e-dev` runs once every sub-ticket is squash-merged into `epic/<N>` (via `run_e2e_dev.sh`, a **blocking gate** before doc-writer + the final PR). For a **Task/Bug**, it runs after `code-dev` returns `validated` (invoked by `/implement` on the same worktree). It replays the current E2E suite (regression triage), then decides whether to **nest** the new behavior into an existing global scenario or create a new `*.e2e.ts`, and judges **criticality** for bugs. E2E is **not** run in CI, so `e2e-dev`'s local run is the authoritative E2E gate.

A genuine regression is **blocking** : `e2e-dev` hands back via an `e2e-dev:` comment and the orchestrator routes to the `architect-rework` agent (Opus), which diagnoses the regression and either creates fix Task ticket(s) the loop reprocesses, or — on a functional doubt — asks the user and escalates (`dispatch=escalate`). The epic's final PR is not opened while the gate is red (cap `EPIC_E2E_MAX_ROUNDS` rounds before human escalation). See `.claude/agents/e2e-dev/AGENT.md` and `.claude/agents/architect-rework/AGENT.md`.

Because `code-dev` spawns these agents itself (`tu-dev` + the 4 gates + `functional-validator`), it must run as a **main agent** — its own `claude --agent code-dev` process — since a subagent cannot spawn subagents. The pipeline therefore always launches code-dev as a CLI process: epic mode via `epic_loop.sh`, task/bug mode via a synchronous `claude --agent code-dev` foreground call in `/implement` (never via the Task tool).

**Outside the pipeline** (direct edits, manual fixes, hotfixes), the same rule applies : before reporting ANY task as done, launch the **4 parallel agents** :

1. **Validator** — delegate to `.claude/agents/validator/AGENT.md` (typecheck + test + lint + format)
2. **Structural auditor** — delegate to `.claude/agents/structural-auditor/AGENT.md` on all modified files
3. **RGAA auditor** — delegate to `.claude/agents/rgaa-auditor/AGENT.md` on all modified `.tsx` files. If no `.tsx` files → instant `PASS — no UI files`.
4. **Security auditor** — delegate to `.claude/agents/security-auditor/AGENT.md` on all modified `.ts/.tsx` in `server/`, `routers/`, or tRPC. If none → instant `SECURE — no server files`.

If any fails → fix → re-run. Only report completion when all 4 pass.

### Before every push — format & lint check

Before pushing code (`git push`), **always** run `pnpm check:write` (or `pnpm lint:check && pnpm format:check` to verify). The auto-lint hook catches most issues after individual edits, but does not guarantee the final state is clean. A final check before push prevents CI failures.

**Bonus: Next.js runtime check** — if the dev server is running, also call `nextjs_call(get_errors)` via the `next-devtools` MCP to catch runtime/compilation errors not visible in `pnpm typecheck`.

> **Junior-proof policy:** Agents are always in the pipeline — a junior cannot "forget" to run them. The agent itself decides if there is work to do based on the modified files. Zero overhead when not relevant, zero chance of skipping when relevant.

### While writing — inline rules

Apply these rules **as you write code**, before any agent runs:

**RGAA (accessibility):**

- `<input>` → associated `<label>` via `htmlFor`/`id`
- Images → `import Image from "next/image"` (raw `<img>` blocked by hook), descriptive `alt` (or `alt=""` if decorative)
- Decorative icons → `aria-hidden="true"`
- `target="_blank"` → `<NewTabNotice />` present
- Modals → `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- No redundant `role` on semantic elements
- Heading hierarchy → no skipped levels (h1 → h3 without h2)
- Form groups → `<fieldset>` + `<legend>`

**Domain layer:**

- No `new Date().getFullYear()` → use `getCurrentYear()` or `getCseYear()` from `~/modules/domain`
- No `siret.slice(0, 9)` → use `extractSiren(siret)` from `~/modules/domain`
- No hardcoded thresholds (5%, 50, 100) → use named constants from `~/modules/domain`
- No local `getCurrentYear`/`getCseYear`/`getSiren` function definitions → import from `~/modules/domain`
- New business rules → add to `~/modules/domain` as pure functions with tests

**Security:**

- Queries → Drizzle ORM only (no raw SQL)
- tRPC inputs → Zod schemas from `~/modules/{domain}/schemas.ts` (never inline, never in routers)
- Protected routes → `protectedProcedure`
- Mutations → ownership check (`userId` from session)
- Multi-write → `db.transaction()`
- Env vars → `~/env.js` (never `process.env`)
- No secrets in client code

**Audit logging** (full details → `.claude/rules/audit-logging.md`):

- New tRPC mutation → add to `PROCEDURE_TO_ACTION` in `trpcMiddleware.ts` (category `mutation`)
- New tRPC query exposing PII / GIP data / PDF / company-scoped data → add to `PROCEDURE_TO_ACTION` (category `read_sensitive`)
- New Next.js Route Handler (`src/app/api/**/route.ts`) → wrap with `withAuditedRoute(...)` and use `cachedAuth(request)` for session
- New auth event / cron → direct `logAction` call; `logger.error` must stay synchronous (`void (async () => {...})()`)
- Every new action requires **3 wire-up points**: `AUDIT_ACTIONS.*` constant, `AUDIT_ACTION_CATEGORIES` mapping, and the surface-specific wire (tRPC map / wrapper / direct call)
- `metadata` jsonb must not contain secrets (auto-stripped keys: `password`, `token`, `refresh_token`, `secret`, `client_secret`, `authorization`, `apikey`, `api_key`, `accesskey`, `access_key`, `private_key`)
- DB-layer changes in `packages/app/scripts/audit-cleanup.mjs` (or any file that touches `audit.action_log` via non-trivial SQL) → add an integration test (`*.integration.test.ts`, runs via `pnpm test:integration`) — unit tests mock the DB driver and miss driver bugs

### E2E tests — owned by `e2e-dev`

Playwright E2E tests are written/maintained **exclusively** by the `e2e-dev` agent (Opus), at the **end of the pipeline** — never by `code-dev` and never inline by the main agent. `e2e-dev` decides whether a journey warrants a new `*.e2e.ts` or should be **nested** into an existing global scenario, and judges criticality for bugs. Full E2E rules: `rules/e2e.md` ; agent workflow: `.claude/agents/e2e-dev/AGENT.md`.

---

## Specialized agents

Agents in `.claude/agents/` are delegated to automatically by skills and quality gates:

| Agent | Role | Model |
|---|---|---|
| `validator` | Typecheck + test + lint + format (parallel) | sonnet |
| `structural-auditor` | 17-rule structural audit (code quality, forms, schemas, DRY, imports, no-comments…) | sonnet |
| `rgaa-auditor` | Full 13-theme RGAA accessibility audit | sonnet |
| `security-auditor` | OWASP Top 10 + RGS security review | sonnet |

These agents are **read-only** — they report findings but never modify files. Fixes are applied by the main agent after review.

The `tu-dev` agent (Opus) precedes these 4 gates in the `/implement` pipeline (step 5.5 of `code-dev`). Unlike them, it is a **writer**: it creates/fixes the vitest tests (unit + integration). It runs only inside the pipeline and hands control back to `code-dev` on a genuine regression. See `.claude/agents/tu-dev/AGENT.md`.

The `e2e-dev` agent (Opus) is the other **writer**: it owns all Playwright E2E tests and runs at the **end of the pipeline** (epic-end for a Feature via `run_e2e_dev.sh`, or after `code-dev`'s `validated` verdict for a Task/Bug). It replays the E2E suite, triages regressions (handback via `e2e-dev:` comment), and nests/creates the scenario. See `.claude/agents/e2e-dev/AGENT.md`.

---

## Skills (manual)

Les skills couvrent le cycle de vie (conception → exécution → review) et le pilotage de sprint (sizing → vélocité → planification) :

| Command | When to use |
|---|---|
| `/analyse [<issue#>] [<description>]` | Phase conception. Détecte le mode (epic / task / bug) selon le type d'issue ou le prompt et invoque les agents appropriés (PO + architect, architect-task, ou bug-analyst). Size chaque feuille en fin d'analyse (`Size` + `Estimate`). |
| `/implement <issue#>` | Phase exécution. Détecte le mode selon le type d'issue : Feature → loop driver background (`epic_loop.sh`) ; Task / Bug → `code-dev` synchrone foreground. Vérifie qu'une analyse a été faite avant de dispatcher. |
| `/report [<N> ...]` | Dashboard live des agents en cours + état des sous-tickets d'un epic. Pure bash, zéro LLM. |
| `/review [<issue#>\|<PR#>]` | Adresse les commentaires de revue (humain + bots). 3 modes auto-détectés : Feature → toutes les sub-task PRs + PR finale, fixes sur `epic/<N>` ; Task / Bug → la seule PR du ticket. Délègue à `review-fixer` en worktree. |
| `/velocity [<sprint>]` | Vélocité des sprints terminés + capacité conseillée pour le prochain. Σ points des feuilles livrées (Done ∪ In review), moyenne glissante 3 sprints. Pure bash, read-only. |
| `/plan-sprint [<sprint>]` | Planifie le prochain sprint (capacité, report des non-livrés, fill backlog par priorité). Plan → validation explicite → assignation Sprint des tickets. Ne crée pas l'itération (limite API GitHub → clic UI). |
