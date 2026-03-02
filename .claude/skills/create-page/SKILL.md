---
name: create-page
description: Create pages from Figma designs using parallelized 4-phase workflow with agents
---

# /create-page

Create one or more pages from Figma designs or specifications using maximum parallelization.

## Arguments

$ARGUMENTS — Figma URLs, page descriptions, or feature specifications

## Instructions

### Phase 1 — Analysis (parallel agents)

For each page/screen provided, launch a **parallel Explore agent**:

1. **Figma analysis**: use `get_design_context` MCP tool to get code + screenshot
2. **DSFR components**: use `get_component_doc` / `search_components` MCP tools to verify correct HTML structure for each DSFR component identified
3. **Data requirements**: identify tRPC procedures, DB schema changes, types needed
4. **Existing code**: search the codebase for similar patterns to reuse

After all agents complete, **synthesize**:
- List shared components across pages (extract if used 2+ times)
- List common types
- List DB schema changes needed
- List tRPC procedures needed (new or existing)
- **Classify each page/screen** using the activation rules below

Present synthesis to user and wait for confirmation before Phase 2.

### Activation rules (conditional phases)

After Phase 1 analysis, classify each page/screen and determine which actions apply.
**Never launch an agent or phase for an action marked "skip".**

| Action | Activate when | Skip when |
|---|---|---|
| DB / Migration | Data must be persisted or read from PostgreSQL | Static content, no server data |
| Zod schemas | Forms, API inputs, route parameters exist | Read-only display, static pages |
| tRPC / API | Frontend needs server data or mutations | Static page, client-only logic |
| UI components | Visual HTML is rendered | Pure backend (no `.tsx` produced) |
| Unit tests | **Always** — only unconditional action | Never skip |
| RGAA audit | HTML is produced (`.tsx` files created/modified) | Pure backend, DB migration only |
| Security audit | Forms, API routes, auth, user data, file upload exist | Static page with no user input and no server code |
| E2E tests | A user journey is created, modified, or its underlying API/data changes | Isolated component with no route, internal refacto with no behavior change, config-only change |

**Examples of conditional skipping:**
- Static info page (CGU, mentions légales) → skip DB, tRPC, Zod, security audit
- Backend-only tRPC route → skip UI components, RGAA audit. **Keep E2E** if the route serves an existing user journey
- Isolated UI component (no data) → skip DB, tRPC, security audit, E2E tests
- Form page with API → all actions activated

### Phase 2 — Shared foundations (sequential, conditional)

**Skip this entire phase** if all pages are static with no shared code.
Otherwise, code only the applicable parts in order:

1. **DB schema** changes in `src/server/db/schema.ts` *(if DB activated)*:
   - camelCase properties (auto-mapped to snake_case)
   - Run `pnpm db:generate` → `pnpm db:migrate`

2. **Zod schemas** in `src/server/api/routers/{domain}/schemas.ts` *(if Zod activated)*:
   - Shared input/output schemas for tRPC procedures
   - Reusable for client-side form validation

3. **tRPC procedures** in `src/server/api/routers/{domain}/router.ts` *(if tRPC activated)*:
   - `protectedProcedure` for authenticated endpoints
   - Ownership checks on all mutations
   - `db.transaction()` for multi-write operations

4. **Shared types** in `src/modules/{domain}/types.ts` *(if multiple pages share types)*

5. **Shared components** in `src/modules/{domain}/shared/` *(if components used 2+ times)*:
   - Each component < 200 lines, `"use client"` only where needed

6. Run `pnpm typecheck` to validate foundations compile.

### Phase 3 — Pages (parallel agents)

For each page, launch a **parallel agent** (with `isolation: "worktree"` if multiple pages):

Each agent creates:

```
src/modules/{domain}/
  index.ts              ← Barrel: exports all public components
  {PageName}.tsx        ← Main page component (Server Component by default)
  {SubComponent}.tsx    ← Extract at ~50 lines JSX
  shared/               ← Components shared within this module
  __tests__/
    {PageName}.test.tsx ← 100% coverage on logic
```

```
src/app/{route}/
  page.tsx              ← Thin wrapper: imports from module + HydrateClient
```

Each agent MUST follow:
- **Server Components** by default, `"use client"` only for hooks/events/browser APIs
- **DSFR classes** for all styling (no inline styles, no raw colors)
- **DSFR MCP** to verify HTML structure before writing
- **Accessibility**: labels, alt, aria attributes, semantic HTML, NewTabNotice
- **English code**, French user-facing text
- **Unit tests**: test observable behavior, mock boundaries only
- **File size**: < 200 lines per file

### Phase 4 — Quality (parallel agents, conditional)

Launch only the applicable agents based on activation rules from Phase 1:

**Agent: Validation** *(always)*:
```bash
pnpm typecheck && pnpm test && pnpm lint:check && pnpm format:check
```

**Agent: RGAA audit** *(only if HTML produced)* — delegate to `rgaa-auditor`:
Audit all new/modified `.tsx` files against the 13 RGAA themes.

**Agent: Security audit** *(only if forms, API, auth, user data, or upload)* — delegate to `security-auditor`:
Audit all new/modified server files and tRPC routers against OWASP Top 10.

**Agent: E2E tests** *(only if navigable user journey created/modified)*:
Write Playwright tests in `src/e2e/` covering the new user flows.

### Phase 5 — Final report

```
## Pages Created

| Page | Route | Module | Components |
|---|---|---|---|
| Declarations | /declaration-remuneration | declaration-remuneration | DeclarationList, DeclarationCard, ... |

## Shared Code
- DB schema: {changes}
- tRPC procedures: {list}
- Shared components: {list}

## Quality
- RGAA: [PASS/NEEDS WORK] — X errors fixed, Y warnings
- Security: [SECURE/VULNERABLE] — X issues fixed
- Validation: [PASS/FAIL] — typecheck + tests + lint

## Test Coverage
- {N} test files, {M} tests total
- Coverage: logic files at 100%

## Remaining TODOs
- [ ] Manual items if any
```
