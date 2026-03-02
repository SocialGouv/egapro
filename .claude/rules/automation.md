---
description: Automated guardrails, quality gates, and agent delegation — always loaded
---

# Automated Guardrails

Everything below is **automatic**. No commands needed — the rules trigger themselves.

---

## Hooks (`.claude/settings.json`)

Two hooks enforce rules at edit time:

### PreToolUse — `block-bad-patterns.sh` (matcher: `Edit|Write`)

Blocks edits containing forbidden patterns:

| Pattern | Files | What to do instead |
|---|---|---|
| `biome-ignore`, `eslint-disable`, `@ts-ignore`, `@ts-expect-error` | `.ts/.tsx/.js/.jsx` | Fix the underlying issue |
| `style={` | `.tsx/.jsx` | Use DSFR classes or a scoped SCSS module |
| `<svg>` | `.tsx/.jsx` | Use `DsfrPictogram` for DSFR artwork, `public/assets/*.svg` + `<img>`, or DSFR icon classes (`fr-icon-*`) |
| `process.env` | `.ts/.tsx` (excl. `env.js`, `instrumentation.ts`, `next.config`, `trpc/react.tsx`) | `import { env } from "~/env.js"` |
| `../../` (or deeper) | `.ts/.tsx` | Use `~/` path alias |
| `@media` (width/screen) | `.scss` | Use DSFR mixins: `@include respond-from(md)` / `respond-to(sm)` |

To add a new rule: append a `check_pattern` call in `block-bad-patterns.sh`.
If a hook blocks your edit, do NOT attempt to bypass it. Rethink the approach.

### PostToolUse — `auto-lint.sh` (matcher: `Edit|Write|Bash`)

Runs `pnpm biome check --write` automatically:
- **After Edit/Write**: lints the single edited file
- **After Bash**: lints all git-modified files after `pnpm test|build|typecheck|lint|format|check`

---

## Activation rules (conditional gates)

Not all gates apply to all tasks. After understanding the scope of a change, determine which gates are relevant. **Never run a gate that does not apply.**

| Gate | Activate when | Skip when |
|---|---|---|
| Validation (typecheck + tests + lint) | **Always** | Never skip |
| RGAA | `.tsx` files in `modules/` or `app/` are created/modified | Pure backend change (only `.ts` in `server/`, DB migration, config) |
| Security | Forms, API routes, auth, user data, file upload, or server code modified | Static page with no user input and no server code |
| E2E tests | A user journey is created, modified, or its underlying API/data changes | Isolated component with no route, internal refacto with no behavior change, config-only change |

---

## Automatic quality gates (mandatory)

These gates trigger **automatically** without user input. Do NOT wait to be asked.
Apply only the gates that match the activation rules above.

### Gate 1 — Validation (always, after every task)

Before reporting ANY task as done, launch **3 parallel agents**:

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

If any fails → fix → re-run. Only report completion when all 3 pass.

### Gate 2 — RGAA (only if `.tsx` produced in `modules/` or `app/`)

When you create or modify UI components, verify **inline while writing**:
- `<input>` → associated `<label>` via `htmlFor`/`id`
- `<img>` → descriptive `alt` (or `alt=""` if decorative)
- Decorative icons → `aria-hidden="true"`
- `target="_blank"` → `<NewTabNotice />` present
- Modals → `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- No redundant `role` on semantic elements
- Heading hierarchy → no skipped levels (h1 → h3 without h2)
- Form groups → `<fieldset>` + `<legend>`

Full checklist (13 RGAA themes) in `.claude/agents/rgaa-auditor/AGENT.md`.

### Gate 3 — Security (only if forms, API, auth, user data, or upload)

When you create or modify server code, verify **inline while writing**:
- Queries → Drizzle ORM only (no raw SQL)
- tRPC inputs → Zod schemas (in `schemas.ts`, not inline)
- Protected routes → `protectedProcedure`
- Mutations → ownership check (`userId` from session)
- Multi-write → `db.transaction()`
- Env vars → `~/env.js` (never `process.env`)
- No secrets in client code

Full checklist (OWASP Top 10) in `.claude/agents/security-auditor/AGENT.md`.

### Gate 4 — PR review (when on a PR branch)

When the current git branch has an open PR, **before starting work**:
1. `gh pr view --json comments,reviews,reviewDecision`
2. Identify unresolved comments
3. Mention them to the user before proceeding

---

## Specialized agents

Agents in `.claude/agents/` are delegated to automatically by skills and quality gates:

| Agent | Role | Model |
|---|---|---|
| `code-reviewer` | 15-point code quality checklist | sonnet |
| `rgaa-auditor` | Full 13-theme RGAA accessibility audit | sonnet |
| `security-auditor` | OWASP Top 10 + RGS security review | sonnet |

These agents are **read-only** — they report findings but never modify files. Fixes are applied by the main agent after review.

---

## Skills (manual override)

Skills in `.claude/skills/` can be triggered explicitly with `/command`:

| Skill | When to use manually |
|---|---|
| `/validate` | Force a full validation pass |
| `/review-pr` | Deep PR review with code-reviewer agent + GH comments |
| `/audit-rgaa` | Deep 13-theme RGAA audit with detailed report |
| `/audit-secu` | Deep OWASP + RGS audit with detailed report |
| `/create-page` | Create pages from Figma (4-phase parallelized workflow) |

These produce detailed reports and are more thorough than the automatic inline gates.
