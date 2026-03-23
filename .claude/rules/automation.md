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

### After every task — agent delegation

Before reporting ANY task as done, launch **4 parallel agents**:

1. **Validator** — delegate to `.claude/agents/validator/AGENT.md` (typecheck + test + lint + format)
2. **Structural auditor** — delegate to `.claude/agents/structural-auditor/AGENT.md` on all modified files
3. **RGAA auditor** — delegate to `.claude/agents/rgaa-auditor/AGENT.md` on all modified `.tsx` files. If no `.tsx` files → instant `PASS — no UI files`.
4. **Security auditor** — delegate to `.claude/agents/security-auditor/AGENT.md` on all modified `.ts/.tsx` in `server/`, `routers/`, or tRPC. If none → instant `SECURE — no server files`.

If any fails → fix → re-run. Only report completion when all 4 pass.

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

### PR review (when on a PR branch)

When the current git branch has an open PR, **before starting work**:

1. `gh pr view --json comments,reviews,reviewDecision`
2. Identify unresolved comments
3. Mention them to the user before proceeding

### E2E tests (when relevant)

Write or update Playwright E2E tests when a user journey is created, modified, or its underlying API/data changes.

---

## Specialized agents

Agents in `.claude/agents/` are delegated to automatically by skills and quality gates:

| Agent | Role | Model |
|---|---|---|
| `validator` | Typecheck + test + lint + format (parallel) | sonnet |
| `structural-auditor` | 16-rule structural audit (code quality, forms, schemas, DRY, imports…) | sonnet |
| `rgaa-auditor` | Full 13-theme RGAA accessibility audit | sonnet |
| `security-auditor` | OWASP Top 10 + RGS security review | sonnet |

These agents are **read-only** — they report findings but never modify files. Fixes are applied by the main agent after review.

---

## Skills (manual)

Skills in `.claude/skills/` can be triggered explicitly with `/command`:

| Skill | When to use |
|---|---|
| `/validate` | Force a full quality pass — all 4 agents + auto-fix + loop until zero. Accepts optional focus: `rgaa`, `security`, `structure` |
| `/review-pr` | Deep PR review with structural-auditor + GH comments |
| `/process-issue` | Process a GitHub issue end-to-end with mandatory quality gates |
| `/split-pr` | Split the current branch into multiple focused PRs |
