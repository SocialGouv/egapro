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
| `<svg>` | `.tsx/.jsx` | Use `DsfrPictogram` for DSFR artwork, `public/assets/*.svg` + `<Image>`, or DSFR icon classes (`fr-icon-*`) |
| `<img>` | `.tsx/.jsx` (excl. test files) | Use `import Image from "next/image"` |
| `process.env` | `.ts/.tsx` (excl. `env.js`, `instrumentation.ts`, `next.config`, `trpc/react.tsx`) | `import { env } from "~/env.js"` |
| `../../` (or deeper) | `.ts/.tsx` | Use `~/` path alias |
| `@media` (width/screen) | `.scss` | Use DSFR mixins: `@include respond-from(md)` / `respond-to(sm)` |
| `dangerouslySetInnerHTML` | `.tsx/.jsx` | XSS risk — use safe rendering or DOMPurify |
| `: any`, `as any` | `.ts/.tsx` (excl. test files) | Use `unknown` with type narrowing |

To add a new rule: append a `check_pattern` call in `block-bad-patterns.sh`.
If a hook blocks your edit, do NOT attempt to bypass it. Rethink the approach.

### PostToolUse — `auto-lint.sh` (matcher: `Edit|Write|Bash`)

Runs `pnpm biome check --write` automatically:
- **After Edit/Write**: lints the single edited file
- **After Bash**: lints all git-modified files after `pnpm test|build|typecheck|lint|format|check`

---

## Activation rules

All 3 core gates (Validation, RGAA, Security) are **always launched** — they cannot be skipped.
Each audit agent scopes itself based on the files actually modified.

| Gate | Always launched | Scope |
|---|---|---|
| Validation (typecheck + tests + lint) | **Yes** | All files |
| RGAA | **Yes** | If `.tsx` files modified → full 13-theme audit. Otherwise → instant `PASS — no UI files` |
| Security | **Yes** | If `.ts/.tsx` in `server/`, `routers/`, or tRPC modified → full OWASP audit. Otherwise → instant `SECURE — no server files` |
| E2E tests | Only when relevant | A user journey is created, modified, or its underlying API/data changes |

> **Junior-proof policy:** Agents are always in the pipeline — a junior cannot "forget" to run them. The agent itself decides if there is work to do based on the modified files. Zero overhead when not relevant, zero chance of skipping when relevant.

---

## Automatic quality gates (mandatory)

These gates trigger **automatically** without user input. Do NOT wait to be asked.
**All gates are mandatory on every task** (junior-proof policy).

### Gate 1 — Validation (always)

Before reporting ANY task as done, launch **3 parallel agents**:

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

If any fails → fix → re-run. Only report completion when all 3 pass.

### Gate 2 — RGAA (always)

Verify **inline while writing** AND audit all created/modified files after implementation:
- `<input>` → associated `<label>` via `htmlFor`/`id`
- Images → `import Image from "next/image"` (raw `<img>` blocked by hook), descriptive `alt` (or `alt=""` if decorative)
- Decorative icons → `aria-hidden="true"`
- `target="_blank"` → `<NewTabNotice />` present
- Modals → `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- No redundant `role` on semantic elements
- Heading hierarchy → no skipped levels (h1 → h3 without h2)
- Form groups → `<fieldset>` + `<legend>`

After implementation, delegate to `rgaa-auditor` agent on all created/modified files.
Full checklist (13 RGAA themes) in `.claude/agents/rgaa-auditor/AGENT.md`.

### Gate 3 — Security (always)

Verify **inline while writing** AND audit all created/modified files after implementation:
- Queries → Drizzle ORM only (no raw SQL)
- tRPC inputs → Zod schemas (in `schemas.ts`, not inline)
- Protected routes → `protectedProcedure`
- Mutations → ownership check (`userId` from session)
- Multi-write → `db.transaction()`
- Env vars → `~/env.js` (never `process.env`)
- No secrets in client code

After implementation, delegate to `security-auditor` agent on all created/modified files.
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
| `/process-issue` | Process a GitHub issue end-to-end with mandatory RGAA + security gates |

These produce detailed reports and are more thorough than the automatic inline gates.
