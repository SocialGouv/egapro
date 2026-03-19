---
name: verify-feature
description: Post-feature completeness audit — loops until zero issues remain (forms, schemas, code quality, tests)
---

# /verify-feature

Run after completing a feature to catch everything before the user has to ask. **Loops automatically** — fix every issue found, re-audit, repeat until zero issues.

## Philosophy

This skill exists because a single audit pass often misses things. The loop guarantees convergence: audit → fix → re-audit → fix → ... → zero issues.

## Instructions

### Phase 1 — Structural audit (read-only)

Run these checks **yourself** (not via sub-agent — agents miss things):

#### 1.1 Forms: react-hook-form everywhere

For every `.tsx` file modified in this feature (use `git diff origin/master...HEAD --name-only`):

- If it contains `<form` + `useState` → check it uses `useZodForm`. Flag if it doesn't.
- If it contains `useMutation` + `useState` without `useZodForm` → flag it (hidden form pattern).
- If it uses manual `e.preventDefault()` inside a `handleSubmit` without `form.handleSubmit` → flag it.
- If it uses `useState` for data that's also in `useZodForm` (dual state) → flag it.

#### 1.2 Schemas: Zod in the right places

```bash
# Must return ZERO results — no Zod in routers
grep -r "from ['\"]zod['\"]" src/server/api/routers/ --include="*.ts"

# Must return ZERO results — no Zod in components
grep -r "from ['\"]zod['\"]" src/modules/ --include="*.tsx"

# Must return ZERO results — no inline z.object in API routes
grep -r "z\.object(" src/app/api/ --include="*.ts"
```

If any returns results → flag the file and which schema should be extracted.

#### 1.3 Schema duplication

Read each `modules/*/schemas.ts` file. Check:
- No two schemas define the same shape
- No schema wraps another without adding value
- No dead exports (types/schemas exported but never imported anywhere)

#### 1.4 Barrel completeness

For each `modules/*/schemas.ts`, verify the corresponding `modules/*/index.ts` re-exports all schemas.

#### 1.5 Router alignment

For each router in `src/server/api/routers/*.ts`:
- Verify zero `import { z }` from zod
- Verify every `.input()` references a schema from `~/modules/*/schemas`

### Phase 2 — Validation (parallel)

Launch **3 parallel agents**:

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

### Phase 3 — Fix loop

If **any issue** was found in Phase 1 or Phase 2:

1. Fix all issues
2. Go back to Phase 1 — re-run the **full audit** (not just the failing check)
3. Repeat until **zero issues** across both phases

**Never report completion with known issues.** The loop must converge to zero.

### Phase 4 — Final report

Only after zero issues remain:

```
## Feature Verification: PASS ✅

### Forms
- X form components checked — all use useZodForm
- useState only for UI state (saved, errors, modals)

### Schemas
- X schema files, Y total schemas
- Zero inline Zod in routers/API routes
- Zero duplication
- All barrels complete

### Quality
- Typecheck: clean
- Tests: X/X passed
- Lint: clean
- Format: clean
```

## When to use

- After completing any feature that touches forms, schemas, or tRPC routers
- When the user says "verify" or "check everything"
- When unsure if the implementation is complete
