# CLAUDE.md — Conventions & Architecture · `packages/app`

> Reference for all AI agents or developers working on this package.
> Read in full before touching the code.

---

## Mandatory rule after each task

All quality checks are **automatic** — no manual commands needed:

- **Lint/format**: auto-applied by the `auto-lint` hook after each edit and Bash command
- **Forbidden patterns**: blocked by the `block-bad-patterns` hook before edits (13 patterns including domain layer violations)
- **Post-task gates**: 4 parallel agents run automatically after every task: `validator` (typecheck + test + lint), `structural-auditor` (17 rules), `rgaa-auditor` (RGAA 4.1.2 / WCAG 2.2 AA via **ultra11y**, on .tsx), `security-auditor` (OWASP on server files)

See `.claude/rules/automation.md` for full details.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16 |
| UI | React | ^19 |
| Typing | TypeScript | ^5 — strict mode |
| Design system | @gouvfr/dsfr | ^1.14 (native, without react-dsfr) |
| Styling | DSFR classes + SCSS Modules | sass (DSFR mixins auto-injected) |
| API | tRPC | ^11 |
| ORM | Drizzle ORM | ^0.45 |
| Auth | NextAuth | 4.x |
| Validation | Zod | ^4 |
| Lint / Format | Biome | ^2 |
| Unit tests | Vitest | ^4 |
| E2E tests | Playwright | ^1.58 |
| Package manager | pnpm (workspace) | ^10 |

---

## Module structure

```
src/
  app/                     <- Next.js routes (App Router) — thin wrappers only
    layout.tsx             <- Root layout: <html>, DSFR CSS/JS, SkipLinks, Header, Footer
    page.tsx               <- Imports HomePage + wrap HydrateClient
    global-error.tsx       <- Global error boundary (Sentry)
    api/                   <- Route handlers (tRPC, NextAuth)
    login/
      page.tsx             <- ProConnect login page (redirects if already logged in)

  modules/                 <- Business logic and components by domain
    domain/                <- Pure business rules (isomorphic, zero React deps)
      index.ts             <- Barrel: single import point for all domain logic
      types.ts             <- Domain types (GapLevel, DeclarationStatus, etc.)
      shared/
        constants.ts       <- Regulatory constants (thresholds, campaign year)
        gap.ts             <- Gap calculation and formatting (pure functions)
        siren.ts           <- SIREN extraction, formatting, validation
        campaign.ts        <- Campaign year, CSE year (temporal rules)
        declarationStatus.ts <- Declaration status state machine
        companySize.ts     <- Company size classification & CSE requirement
      __tests__/           <- 100% coverage on all domain functions
    analytics/             <- Matomo tracking
      index.ts             <- Barrel: exports MatomoAnalytics
      MatomoAnalytics.tsx  <- Client component for Matomo tracking (NEXT_PUBLIC_MATOMO_*)
    layout/                <- Global layout components
      index.ts             <- Barrel: exports Header, Footer, SkipLinks
      shared/
        NavLink.tsx        <- Active link with dynamic aria-current ("use client")
        NewTabNotice.tsx   <- Screen reader only text for target="_blank" links
        SkipLinks.tsx      <- Skip links (RGAA 12.7)
        __tests__/
          NavLink.test.tsx
          NewTabNotice.test.tsx
          SkipLinks.test.tsx
      Header/
        index.tsx          <- Orchestrator
        HeaderBrand.tsx    <- Marianne logo + service name + tagline
        HeaderQuickAccess.tsx <- "Sign in" button (desktop)
        Navigation.tsx     <- <nav> with dropdown menus (DSFR JS)
        MobileMenu.tsx     <- Mobile navigation modal dialog
      Footer/
        index.tsx          <- Orchestrator
        FooterBody.tsx     <- Logo + description + government links
        FooterBottom.tsx   <- Legal notices + display settings + license
        ThemeModal.tsx     <- Dark mode dialog modal (light/dark/system theme)
    home/
      index.ts             <- Barrel: exports HomePage
      HomePage.tsx         <- Visual content of the home page
      __tests__/
        HomePage.test.tsx

  server/                  <- Server-only code
    auth/                  <- NextAuth configuration
    api/                   <- tRPC router
    db/                    <- Drizzle schema + PostgreSQL connection

  trpc/                    <- tRPC client (react, server, query-client)
  env.js                   <- Typed environment variables (@t3-oss/env-nextjs)
  instrumentation.ts       <- Sentry setup (server + edge)
  test/                    <- Vitest setup (setup.ts)
  e2e/                     <- Playwright tests
```

### Absolute rule: no custom components in `src/app/`

`src/app/` contains **only** Next.js route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `template.tsx`, `default.tsx`.

**Every custom component** (client or server) must live in `src/modules/{domain}/`. Pages are thin wrappers that import from module barrels.

This is **enforced by the `block-bad-patterns` hook** — creating a `.tsx` file in `src/app/` that is not a route file will be rejected.

### Fundamental rule: domain organization

```
# CORRECT — cohesion by functionality
src/modules/layout/Header/HeaderBrand.tsx

# FORBIDDEN — organization by file type
src/components/HeaderBrand.tsx
src/hooks/useNavigation.ts

# FORBIDDEN — custom component in src/app/
src/app/my-route/MyComponent.tsx
```

Each module exposes an `index.ts` barrel. Consumers always import from the barrel, never from internal sub-files.

```ts
// CORRECT
import { Header, Footer } from "~/modules/layout";

// FORBIDDEN
import { Header } from "~/modules/layout/Header/index";
```

---

## React Components: Server vs Client

Default: **Server Component**. Add `"use client"` only for hooks, browser events, or Web APIs. Isolate the interactive part at the lowest possible level — never push `"use client"` up to parents.

### Component granularity

One component = one responsibility. Extract sub-components at ~50 lines of JSX. Name them after what they display, not their position in the tree.

> Detailed rules (no logic in JSX, no inline SVG, `next/image` mandatory, `.map()` limit) → `.claude/rules/react-components.md`

---

## MCP Servers (`.mcp.json`)

Three MCP servers are configured and **must be used** in the relevant contexts:

| MCP Server | When to use | Key tools |
|---|---|---|
| **next-devtools** | Debugging, error diagnostics, route inspection, docs lookup | `nextjs_index`, `nextjs_call`, `nextjs_docs`, `browser_eval` |
| **dsfr** | Before writing any DSFR HTML | `get_component_doc`, `search_components`, `get_color_tokens` |
| **figma** | When implementing from a Figma design | `get_design_context`, `get_screenshot` |

### MCP Next.js DevTools (mandatory when dev server is running)

The `next-devtools` MCP provides runtime diagnostics directly from the Next.js dev server. **Use it proactively:**

- **Before implementing changes**: call `nextjs_index` to discover the running dev server, then `nextjs_call` to inspect routes, component tree, and current errors
- **After making changes**: call `nextjs_call` with `get_errors` to check for compilation/runtime errors instead of relying only on terminal output
- **For Next.js documentation**: call `nextjs_docs` with the correct path (read the `nextjs-docs://llms-index` resource first to find paths). **Never guess Next.js APIs from memory** — always verify via `nextjs_docs`
- **For browser testing**: use `browser_eval` to start a browser, navigate to pages, take screenshots, and read console messages

```
# Typical workflow
1. nextjs_index              → discover servers + available tools
2. nextjs_call(get_errors)   → check current state
3. [make code changes]
4. nextjs_call(get_errors)   → verify no regressions
```

### MCP DSFR (mandatory)

Before writing any DSFR HTML, use `get_component_doc` or `search_components` to verify the correct structure. Never guess DSFR classes from memory.

### Styling strategy (strict priority order)

Inline `style={}` is **blocked by hook** — the edit will be rejected.

Cascade: 1) DSFR classes → 2) DSFR utilities + CSS custom properties → 3) Scoped SCSS module (last resort).

> Full rules (no raw colors, no hardcoded breakpoints, one SCSS module per component) → `.claude/rules/styling-dsfr.md`

### SCSS Modules & DSFR SASS

`next.config.js` auto-injects DSFR mixins via `sassOptions.additionalData`. No manual import needed.

| Mixin | Media query | Usage |
|---|---|---|
| `@include respond-from(md)` | `min-width: 48em` | Mobile-first (preferred) |
| `@include respond-to(sm)` | `max-width: 47.98em` | Desktop-first (fallback) |

**Breakpoint tokens:** `xs` (0), `sm` (36em), `md` (48em), `lg` (62em), `xl` (78em)

### DSFR runtime

- **Assets**: copied to `public/dsfr/` by `scripts/copy-dsfr.mjs` (git-ignored, regenerated on `dev`/`build`). Never import DSFR CSS via webpack.
- **JS**: loaded via `<Script type="module" strategy="beforeInteractive">`. Handles modals, dropdowns, theme toggle, keyboard navigation. Never duplicate this logic in React — use `data-fr-*` attributes.
- **Dark mode**: `data-fr-scheme="system"` on `<html>`, cookie `fr-theme` read by inline script to avoid flash, `ThemeModal` for user toggle.
- **Icons**: `fr-icon-{name}-{fill|line}` classes. Always `aria-hidden="true"` on decorative icons.
- **Figma assets**: always export as **SVG** (never PNG/JPG for illustrations/icons). Store in `public/assets/{module}/`. Only accept raster (WebP) for real photographs.

---

## Accessibility (RGAA 4.1.2 / WCAG 2.2 AA)

> **Canonical rule → [`.claude/rules/rgaa.md`](../../.claude/rules/rgaa.md)** — the project's a11y system is **ultra11y** (vendored at `.claude/skills/ultra11y/`, committed so every dev has it). Verify with `pnpm --filter app test:a11y` (static gate, run automatically in CI on every push/PR) + Lighthouse 100% (rendered tier) + the `rgaa-auditor` agent.

### Mandatory checklist (extract — full rules in the canonical rule)

- **Skip links**: `SkipLinks` as first child of `<body>` (RGAA 12.7); every skip-link anchor (`#content`, `#footer`) needs a valid target
- **Landmarks**: semantic `<header>`, `<nav>`, `<main id="content" tabindex="-1">`, `<footer>` — one `<main>` per page. Never add redundant `role` (`role="navigation"` on `<nav>` is forbidden)
- **Modals**: any `<div>` with `aria-labelledby`/`aria-describedby` must have `role="dialog"` + `aria-modal="true"`; focus trap by DSFR JS
- **External links**: any `target="_blank"` must contain a `<NewTabNotice />` (text `fr-sr-only`)
- **aria-current**: use `NavLink` — `aria-current="page"` calculated via `usePathname()`
- **Icons**: `aria-hidden="true"` on purely decorative elements
- **Images**: `import Image from "next/image"` (raw `<img>` blocked by hook). Descriptive `alt` required, `alt=""` for decorative
- **Forms**: each `<input>` has an associated `<label>` via `htmlFor`/`id`; required → `aria-required`; error → `aria-invalid` + `aria-describedby`
- **Live regions**: server-action error → `role="alert"` alone; info/async → `aria-live="polite"` + `aria-atomic="true"` (never both)

Never add redundant `role` on semantic elements. Use `role="dialog"` + `aria-modal="true"` only on `<div>` elements.

---

## TypeScript typing

- `strict: true`, `noUncheckedIndexedAccess: true`
- No explicit `any` — use `unknown` + narrowing
- Shared object types in `types.ts` at module level
- Component props: `type Props = { ... }` (never `any`)

---

## General rules

- **Immutability**: never mutate objects/arrays — always spread (`{ ...obj, key: val }`)
- **Error handling**: always `try/catch` with explicit user-facing error message
- **Input validation**: Zod at system boundaries (forms, route params, API body)

---

## Forms

### Form state management

All forms must use `react-hook-form` with Zod validation via the shared `useZodForm` hook:

```tsx
import { useZodForm } from "~/modules/shared";
import { mySchema } from "~/modules/{domain}/schemas";

const form = useZodForm(mySchema, { defaultValues: { ... } });
```

**Forbidden patterns:**
- Multiple `useState` calls for form fields — use `useZodForm` instead
- Manual imperative validation in `handleSubmit` — Zod handles it
- Inline Zod schemas in tRPC routers — extract to `modules/{domain}/schemas.ts`

### Shared validation schemas

Zod schemas are the **single source of truth** for both frontend forms and tRPC backend:

```
src/modules/{domain}/schemas.ts    <- define schemas here
src/modules/{domain}/index.ts      <- re-export from barrel
src/server/api/routers/{x}.ts      <- import from ~/modules/{domain}/schemas
src/modules/{domain}/MyForm.tsx    <- import from ~/modules/{domain}/schemas
```

Never define schemas in `src/server/api/routers/`. Always in `src/modules/{domain}/schemas.ts`.

### DSFR form integration

- `register()` spreads directly on native `<input>` elements with DSFR classes
- Use `Controller` for non-standard controls (radios, custom selects)
- Field errors: `fr-input-group--error` + `<p className="fr-error-text">`
- Form errors: `fr-alert fr-alert--error` with `aria-live="polite"`

### File uploads

File upload forms keep the `useFileUploadForm` hook pattern. They do not need `react-hook-form` since the file upload lifecycle (select, validate, upload to S3, save metadata via tRPC) is distinct from standard form submission.

---

## Audit logging (issue #3174)

**Any new surface that falls under the audit taxonomy must wire its audit log at the same time.** Forgetting the log is a compliance bug, not an enhancement.

Covered surfaces:

| Surface | How to wire |
|---|---|
| New tRPC **mutation** | Add `AUDIT_ACTIONS.*` + category `"mutation"` + entry in `PROCEDURE_TO_ACTION` (`~/server/audit/trpcMiddleware.ts`) |
| New tRPC **query exposing PII / GIP data / company-scoped data** | Same as above but category `"read_sensitive"` (180-day retention) |
| New **Next.js Route Handler** (`src/app/api/**/route.ts`) | Wrap with `withAuditedRoute({ action, resolveContext })` + use `cachedAuth(request)` for session (never `auth()` directly twice per request) |
| New **NextAuth event / auth flow** | `logAction` directly; `logger.error` must stay synchronous (`void (async () => {...})()`) |
| New **cron-triggered / system action** | `logAction` directly, category `"system"` |

What does **not** need an audit entry:

- Pure public / non-sensitive reads (`company.list`, search)
- Health checks, static pages
- Procedures called only by another audited procedure in the same request (duplicate rows)

Every new action needs **3 wire-up points**:

1. `AUDIT_ACTIONS.*` constant in [`~/modules/audit/shared/actionKeys.ts`](src/modules/audit/shared/actionKeys.ts)
2. Category in `AUDIT_ACTION_CATEGORIES` in the same file (drives the CNIL retention bucket: `read_sensitive` → 180 days, everything else → 365 days)
3. Surface-specific wire (tRPC map / wrapper / direct `logAction` call)

The `metadata` jsonb must **never** contain secrets. The recursive sanitizer auto-strips `password`, `token`, `refresh_token`, `secret`, `client_secret`, `authorization`, `apikey`, `api_key`, `accesskey`, `access_key`, `private_key` at any depth — but when calling `logAction` directly (outside tRPC), the caller is responsible for staying clean. Never put IP addresses in `metadata` — there is a dedicated `ip_address` column.

DB-layer changes in `packages/app/scripts/audit-cleanup.mjs` (or any file that touches `audit.action_log` via non-trivial SQL) **must** come with an integration test `*.integration.test.ts` — unit tests mock the DB driver and will miss driver-level bugs. Run locally with `pnpm test:integration` (requires Docker).

> Full playbook with code snippets and a PR checklist → [`.claude/rules/audit-logging.md`](../../.claude/rules/audit-logging.md)

---

## File size

< 200 lines ideal, 200-400 acceptable, > 400 split, > 800 **forbidden**.

---

## Naming conventions

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `HeaderBrand.tsx` |
| Hook | camelCase + `use` | `useNavigation.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type / Interface | PascalCase | `type UserProfile = ...` |
| Constant | SCREAMING_SNAKE | `const MAX_RETRY = 3` |
| Module folder | camelCase | `modules/layout/` |

### Language: English mandatory

All code (components, functions, variables, comments, file names) in English. User-facing text (labels, buttons, content) remains in French.

---

## Tests

Tests live in `__tests__/` subfolder next to the module they test. Never in `src/app/`.
75% minimum global coverage (enforced by Vitest thresholds). 100% coverage on all logic files. Test observable behavior, not implementation details.

> **Pipeline ownership**: inside the `/implement` pipeline, the `tu-dev` agent (Opus) writes/fixes all vitest unit + integration tests at code-dev step 5.5 — before the 4 post-task gates run — and hands control back to code-dev on a genuine regression. The Playwright **E2E** tests are owned by the `e2e-dev` agent (Opus), which runs at the **end of the pipeline** (epic-end for a Feature, or after code-dev's `validated` verdict for a Task/Bug). `code-dev` writes **no test at all** — neither unit/integration nor E2E.

**E2E completeness**: every route in `src/app/**/page.tsx` must have corresponding E2E tests in `src/e2e/`. `e2e-dev` verifies coverage when pages are added or modified, preferring to **nest** new behavior into an existing global scenario over creating many small files.

> Full policy (what to test, mock boundaries, coverage rules, E2E completeness) → `.claude/rules/testing.md`

### Standard mocks

All common mocks are defined once in `src/test/setup.ts` and auto-loaded by Vitest. Never duplicate them in test files:

- `next/link` → simple `<a>` tag
- `next/navigation` → `usePathname` + `useRouter` stubs
- `next/image` → `<div role="img">` with `aria-label`, `data-src`, `data-testid="next-image"`
- `next-auth/react` → `signIn` stub
- `server-only` → empty module
- `~/trpc/server` → `HydrateClient` passthrough

Tests needing specific overrides can call `vi.mock()` locally — it takes precedence over `setup.ts`.

---

## Useful scripts

```bash
pnpm dev          # copies DSFR assets + starts Next.js in dev mode (port 3000)
pnpm build        # copies DSFR assets + build production
pnpm typecheck    # TypeScript verification (tsc --noEmit)
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests (requires dev server on port 3000)
pnpm test:lighthouse  # Lighthouse CI audit (requires dev server on port 3000)
```

Both `pnpm test:e2e` and `pnpm test:lighthouse` require `pnpm dev` running on port 3000. Lighthouse accessibility must score **100%**.

### Lint & Format (Biome)

Auto-applied by the `auto-lint` hook after each file edit. Manual commands:

| Command | When to use |
|---|---|
| `pnpm check:write` | Fix everything at once (lint + format) |
| `pnpm lint:check` / `pnpm format:check` | CI (read-only, exit 1 on error) |

### Environment variables

Declared and validated in `src/env.js` via `@t3-oss/env-nextjs` + Zod. **Never read `process.env` directly** — always `import { env } from "~/env.js"`.

To add a variable: declare in `src/env.js` (`server` or `client` section) + add to `runtimeEnv` + add to `.env` local + **add to `.kontinuous/` deployment config** (configmap for public values, sealed-secret for secrets). Base configmap: `.kontinuous/templates/egapro.configmap.yaml`. Environment-specific overrides: `.kontinuous/env/{dev,preprod,prod}/`.

> Pass `SKIP_ENV_VALIDATION=1` to bypass validation (Docker build, CI without secrets).

### Database (Drizzle Kit)

> Run from the monorepo root via `pnpm db:*`, or from `packages/app/` directly.

```bash
pnpm db:generate  # generates migration files after a schema change
pnpm db:migrate   # applies pending migrations to the database
pnpm db:push      # applies the schema directly without migration (dev only)
pnpm db:studio    # opens Drizzle Studio (UI to inspect the database)
```

**Standard workflow:**
1. Modify the schema in `src/server/db/`
2. `pnpm db:generate` — creates the SQL migration file
3. `pnpm db:migrate` — applies the migration
4. `pnpm dev` — restart the server if necessary

### Drizzle casing convention (mandatory)

All schema properties are **camelCase** in TypeScript, automatically mapped to `snake_case` in the database via `casing: "snake_case"` in both `src/server/db/index.ts` and `drizzle.config.ts`. Never specify explicit column names.

> Full DB rules (transactions, no module-scope Date) → `.claude/rules/database-drizzle.md`
