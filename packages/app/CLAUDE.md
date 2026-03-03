# CLAUDE.md — Conventions & Architecture · `packages/app`

> Reference for all AI agents or developers working on this package.
> Read in full before touching the code.

---

## Mandatory rule after each task

All quality checks are **automatic** — no manual commands needed:

- **Lint/format**: auto-applied by the `auto-lint` hook after each edit and Bash command
- **Forbidden patterns**: blocked by the `block-bad-patterns` hook before edits
- **Validation**: 3 parallel agents (typecheck + tests + lint) run automatically after every task
- **RGAA**: accessibility checked inline when modifying UI components
- **Security**: verified inline when modifying server/tRPC code

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

### Fundamental rule: domain organization

```
# CORRECT — cohesion by functionality
src/modules/layout/Header/HeaderBrand.tsx

# FORBIDDEN — organization by file type
src/components/HeaderBrand.tsx
src/hooks/useNavigation.ts
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

- **Assets**: copied to `public/dsfr/` by `scripts/copy-dsfr.js` (git-ignored, regenerated on `dev`/`build`). Never import DSFR CSS via webpack.
- **JS**: loaded via `<Script type="module" strategy="beforeInteractive">`. Handles modals, dropdowns, theme toggle, keyboard navigation. Never duplicate this logic in React — use `data-fr-*` attributes.
- **Dark mode**: `data-fr-scheme="system"` on `<html>`, cookie `fr-theme` read by inline script to avoid flash, `ThemeModal` for user toggle.
- **Icons**: `fr-icon-{name}-{fill|line}` classes. Always `aria-hidden="true"` on decorative icons.
- **Figma assets**: always export as **SVG** (never PNG/JPG for illustrations/icons). Store in `public/assets/{module}/`. Only accept raster (WebP) for real photographs.

---

## Accessibility (RGAA / WCAG 2.1 AA)

### Mandatory checklist

- **Skip links**: `SkipLinks` as first child of `<body>` (RGAA 12.7)
- **Landmarks**: use semantic `<header>`, `<nav>`, `<main>`, `<footer>`. Do not add redundant `role` (`role="navigation"` on `<nav>` is forbidden)
- **Modals**: any `<div>` with `aria-labelledby` or `aria-describedby` must have `role="dialog"` + `aria-modal="true"`
- **External links**: any `target="_blank"` must contain a `<NewTabNotice />` (text `fr-sr-only`)
- **aria-current**: use `NavLink` for navigation links — `aria-current="page"` is calculated dynamically via `usePathname()`
- **Icons**: `aria-hidden="true"` on purely decorative elements
- **Images**: always use `import Image from "next/image"` (raw `<img>` blocked by hook). Descriptive `alt` required, `alt=""` for decorative images
- **Forms**: each `<input>` must have an associated `<label>` via `htmlFor`/`id`

Never add redundant `role` on semantic elements (`role="navigation"` on `<nav>` is forbidden). Use `role="dialog"` + `aria-modal="true"` only on `<div>` elements.

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
100% coverage on all logic files. Test observable behavior, not implementation details.

> Full policy (what to test, mock boundaries, coverage rules) → `.claude/rules/testing.md`

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

To add a variable: declare in `src/env.js` (`server` or `client` section) + add to `runtimeEnv` + add to `.env` local.

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

**Exception:** the `accounts` table uses snake_case properties (`refresh_token`, `access_token`, etc.) because `@auth/drizzle-adapter` requires these exact names.

> Full DB rules (transactions, no module-scope Date) → `.claude/rules/database-drizzle.md`
