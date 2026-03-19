---
name: verify-feature
description: Full codebase rules audit — runs at END of every feature, loops until zero issues
---

# /verify-feature

Comprehensive audit of ALL project rules. **Loops automatically** — fix every issue found, re-audit, repeat until zero issues.

## When this runs

- **Automatically at the END of every feature** (before reporting done — see `automation.md § Feature lifecycle`)
- **Manually** via `/verify-feature` when you want a full check

## Instructions

### Phase 1 — Structural audit (read-only, do it yourself)

Detect changed files:
```bash
git diff --name-only HEAD   # uncommitted changes
```

If no uncommitted changes, use `git diff origin/master...HEAD --name-only` scoped to `packages/app/src/`.

Run ALL checks below on the changed files. If a check is not relevant to the changed files, mark it `SKIP` and move on.

---

#### 1.1 Forms — react-hook-form everywhere (`code-quality.md § Form conventions`)

For every `.tsx` file with `<form` or `useMutation`:
- `useState` for form field data without `useZodForm` → **VIOLATION**
- Manual `e.preventDefault()` in `handleSubmit` without `form.handleSubmit` → **VIOLATION** (exception: parameterless confirmation mutations)
- Dual state: `useState` duplicating data already in `useZodForm` → **VIOLATION**
- `useState` for UI-only state (saved, errors, modals) → OK

#### 1.2 Schemas — Zod in the right places (`code-quality.md § Form conventions`, `trpc-api.md`)

```bash
# Must return ZERO — no Zod in routers
grep -rn "from ['\"]zod['\"]" src/server/api/routers/ --include="*.ts"

# Must return ZERO — no Zod in components
grep -rn "from ['\"]zod['\"]" src/modules/ --include="*.tsx"

# Must return ZERO — no inline z.object in API routes
grep -rn "z\.object(" src/app/api/ --include="*.ts"
```

#### 1.3 Schema quality (`code-quality.md § DRY`)

- No two schemas defining the same shape across files
- No dead exports (types/schemas exported but never imported)
- Every `modules/*/schemas.ts` re-exported from its `modules/*/index.ts` barrel

#### 1.4 File size (`code-quality.md § File size`)

```bash
# Flag files over 400 lines (split required) — BLOCK files over 800
wc -l $(git diff --name-only HEAD -- '*.ts' '*.tsx') 2>/dev/null | sort -rn | head -20
```

#### 1.5 Imports (`code-quality.md § Imports`)

```bash
# Must return ZERO — no deep relative imports
grep -rn "from ['\"]\.\.\/\.\.\/" src/modules/ --include="*.ts" --include="*.tsx"
```

#### 1.6 No custom components in src/app/ (`code-quality.md § No custom components`)

```bash
# Must return ZERO — only route files allowed
find src/app -name "*.tsx" ! -name "page.tsx" ! -name "layout.tsx" ! -name "loading.tsx" ! -name "error.tsx" ! -name "not-found.tsx" ! -name "global-error.tsx" ! -name "template.tsx" ! -name "default.tsx" ! -name "opengraph-image.tsx" ! -path "*/__tests__/*" | head -20
```

#### 1.7 TypeScript (`code-quality.md § TypeScript`)

```bash
# Must return ZERO — no explicit any (excluding tests)
grep -rn ": any\b\|as any\b" src/modules/ src/server/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v "\.test\."
```

#### 1.8 Environment variables (`code-quality.md § Environment variables`)

```bash
# Must return ZERO — no direct process.env (excluding allowed files)
grep -rn "process\.env" src/ --include="*.ts" --include="*.tsx" | grep -v "env.js" | grep -v "instrumentation.ts" | grep -v "next.config" | grep -v "trpc/react.tsx"
```

#### 1.9 Database (`database-drizzle.md`)

For changed files in `src/server/`:
- Multi-write without `db.transaction()` → **VIOLATION**
- `new Date()` at module scope → **VIOLATION**

#### 1.10 React components (`react-components.md`)

For changed `.tsx` files:
- Inline `<svg>` → **VIOLATION** (blocked by hook)
- Raw `<img>` → **VIOLATION** (blocked by hook)
- `.map()` callback over 5 lines of JSX → **VIOLATION**

#### 1.11 Styling (`styling-dsfr.md`)

For changed `.scss` and `.tsx` files:
- Raw `@media` with width/screen → **VIOLATION**
- Hardcoded hex/rgb colors → **VIOLATION**
- `style={` inline → **VIOLATION** (blocked by hook)

#### 1.12 Testing (`testing.md`)

For changed files:
- New component/function without corresponding test → **WARNING**
- Test mocks duplicating `src/test/setup.ts` mocks → **VIOLATION**
- New page without E2E test → **WARNING**

#### 1.13 tRPC & Security (`trpc-api.md`, `automation.md § Gate 3`)

For changed files in `src/server/`:
- tRPC input without schema from `~/modules/{domain}/schemas` → **VIOLATION**
- Router file importing `z` from `zod` → **VIOLATION**
- Mutation without ownership check → **WARNING**
- Multi-write without `db.transaction()` → **VIOLATION**
- Raw SQL → **VIOLATION**

#### 1.14 Accessibility (`automation.md § Gate 2`)

For changed `.tsx` files:
- `<input>` without associated `<label>` → **VIOLATION**
- `target="_blank"` without `<NewTabNotice />` → **VIOLATION**
- Decorative icon without `aria-hidden="true"` → **WARNING**
- Heading hierarchy skipping levels → **VIOLATION**
- Form groups without `<fieldset>` + `<legend>` → **WARNING**

---

### Phase 2 — Quality gates (matches `automation.md § Automatic quality gates`)

Launch **3 parallel agents** for validation:

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

Then launch **2 parallel agents** for audits (scoped to changed files):

4. **Agent: RGAA** — delegate to `rgaa-auditor` agent (`.claude/agents/rgaa-auditor/AGENT.md`) on all changed `.tsx` files. If no `.tsx` files changed → `SKIP`.
5. **Agent: Security** — delegate to `security-auditor` agent (`.claude/agents/security-auditor/AGENT.md`) on all changed `.ts/.tsx` files in `server/`, `routers/`, or tRPC. If none → `SKIP`.

---

### Phase 3 — Fix loop

If **any VIOLATION** was found in Phase 1 or Phase 2:

1. Fix all violations
2. Go back to **Phase 1 step 1** — re-run the full audit
3. Repeat until **zero violations** across both phases

**Never report completion with known violations.**

---

### Phase 4 — Final report

Only after zero violations remain:

```
## Feature Verification: PASS ✅

### Rules checked
| Rule | Files | Status |
|---|---|---|
| Forms (react-hook-form) | X files | PASS |
| Schemas (no inline Zod) | X routers | PASS |
| File size (< 400 lines) | X files | PASS |
| Imports (no deep relative) | X files | PASS |
| TypeScript (no any) | X files | PASS |
| Env vars (no process.env) | X files | PASS |
| ... | ... | ... |

### Quality gates
| Gate | Status |
|---|---|
| Typecheck | clean |
| Tests | X/X passed |
| Lint + Format | clean |
| RGAA | PASS / SKIP |
| Security | PASS / SKIP |
```
