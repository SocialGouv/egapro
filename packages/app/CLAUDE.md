# CLAUDE.md — Conventions & Architecture · `packages/app`

> Reference for all AI agents or developers working on this package.
> Read in full before touching the code.

---

## Mandatory rule after each task

**After each code modification, without exception, run in this order:**

```bash
pnpm lint        # fixes linting errors
pnpm format      # formats code
pnpm typecheck   # verifies TypeScript types
```

Do not consider a task as complete until these three commands pass without error.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16 |
| UI | React | ^19 |
| Typing | TypeScript | ^5 — strict mode |
| Design system | @gouvfr/dsfr | ^1.14 (native, without react-dsfr) |
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

Default: **Server Component**. Add `"use client"` only if the component needs:
- hooks (`useState`, `useEffect`, `usePathname`, `useRouter`...)
- browser event listeners
- Web APIs (`localStorage`, `document`...)

```tsx
// Server Component — no directive (default)
export function FooterBody() { ... }

// Client Component — mandatory directive on first line
"use client";
export function NavLink({ href }: { href: string }) {
  const pathname = usePathname(); // Next.js hook
  ...
}
```

Do not unnecessarily push `"use client"` up to parents. Isolate the interactive part at the lowest possible level.

### Component granularity

**Rule: one component = one responsibility.** Prefer many small components over a few large ones.

- A component should only do one thing readable in one sentence
- As soon as a component exceeds ~50 lines of JSX, extract sub-components
- Name components based on what they display, not based on their position in the tree

```tsx
// FORBIDDEN — catch-all component
export function Dashboard() {
  // 200 lines of JSX: header, table, filters, pagination...
}

// CORRECT — decomposed
export function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardFilters />
      <DashboardTable />
      <DashboardPagination />
    </>
  );
}
```

Each extracted sub-component is **testable independently** — this is the objective.

---

## DSFR — Usage rules

### MCP DSFR (mandatory)

The MCP server [`dsfr-mcp`](https://github.com/SocialGouv/dsfr-mcp) exposes all DSFR documentation directly in the AI assistant (HTML structure, CSS classes, variants, accessibility, color tokens, icons).

**One-time installation (user scope):**

```bash
claude mcp add dsfr --scope user -- npx dsfr-mcp
```

Or via `.mcp.json` at the project root to share with the team:

```json
{
  "mcpServers": {
    "dsfr": {
      "command": "npx",
      "args": ["dsfr-mcp"]
    }
  }
}
```

**Available tools once connected:**

| Tool | Usage |
|---|---|
| `list_components` | List all available DSFR components |
| `get_component_doc` | Component documentation: HTML, CSS classes, variants, accessibility |
| `search_components` | Full-text search in the documentation |
| `search_icons` | Find an icon by name/category -> CSS class `fr-icon-*` |
| `get_color_tokens` | Color tokens by context/usage, light/dark themes |

**Rule:** before writing DSFR HTML, use `get_component_doc` or `search_components` to verify the correct structure. Never guess DSFR CSS classes from memory.

### Assets
DSFR assets (CSS, fonts, icons) are copied to `public/dsfr/` by `scripts/copy-dsfr.js`. This folder is **ignored by git** and regenerated on each `dev` / `build`.

Never import DSFR CSS via webpack/node_modules. Always via `<link href="/dsfr/...">` in the layout.

### JavaScript DSFR
The DSFR JS (`dsfr.module.min.js`) is loaded via `<Script type="module" strategy="beforeInteractive">`. It handles:
- Opening/closing modals and dropdown menus
- Theme toggle (dark/light/system) via `data-fr-scheme`
- Keyboard navigation of interactive components

Never duplicate DSFR JS logic in React. Rely on the `data-fr-*` attributes and let the DSFR JS do its work.

### Dark mode
- Attribute `data-fr-scheme="system"` on `<html>` by default
- Inline script in `<head>` reads the `fr-theme` cookie before render to avoid flash
- The `ThemeModal` modal handles the change; the DSFR JS persists in the cookie and updates the attribute

### Icons
Use DSFR utility classes: `fr-icon-{name}-{fill|line}`.
The full icon set is available in `/dsfr/utility/icons/`.
Always add `aria-hidden="true"` on decorative icons.

---

## Accessibility (RGAA / WCAG 2.1 AA)

### Mandatory checklist

- **Skip links**: `SkipLinks` as first child of `<body>` (RGAA 12.7)
- **Landmarks**: use semantic `<header>`, `<nav>`, `<main>`, `<footer>`. Do not add redundant `role` (`role="navigation"` on `<nav>` is forbidden)
- **Modals**: any `<div>` with `aria-labelledby` or `aria-describedby` must have `role="dialog"` + `aria-modal="true"`
- **External links**: any `target="_blank"` must contain a `<NewTabNotice />` (text `fr-sr-only`)
- **aria-current**: use `NavLink` for navigation links — `aria-current="page"` is calculated dynamically via `usePathname()`
- **Icons**: `aria-hidden="true"` on purely decorative elements
- **Images**: descriptive `alt` required, `alt=""` for decorative images
- **Forms**: each `<input>` must have an associated `<label>` via `htmlFor`/`id`

### Semantic elements vs ARIA

```tsx
// CORRECT — native element, implicit role
<nav aria-label="Main menu">...</nav>

// FORBIDDEN — redundant role
<nav role="navigation" aria-label="Main menu">...</nav>

// CORRECT — div without implicit role, role="dialog" required
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">...</div>
```

---

## TypeScript typing

- `strict: true` enabled, `noUncheckedIndexedAccess: true`
- No explicit `any` — use `unknown` and narrowing
- Shared object types in `types.ts` files at the module level
- Always type component props with a `type Props = { ... }`

```ts
// CORRECT
type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

// FORBIDDEN
const MyComponent = (props: any) => { ... }
```

---

## Immutability

Never mutate an object or array. Always create new instances.

```ts
// FORBIDDEN
user.name = "Jean";

// CORRECT
const updatedUser = { ...user, name: "Jean" };
```

---

## Error handling

```ts
// CORRECT — with explicit user message
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error("fetchData failed:", error);
  throw new Error("Impossible to load data. Please try again later.");
}
```

---

## Input validation

Always validate with Zod at system boundaries (forms, route parameters, API body).

```ts
import { z } from "zod";

const schema = z.object({
  siren: z.string().regex(/^\d{9}$/, "Invalid SIREN"),
  annee: z.number().int().min(2018).max(new Date().getFullYear()),
});
```

---

## File size

| Size | Status |
|---|---|
| < 200 lines | Ideal |
| 200-400 lines | Acceptable |
| 400-800 lines | To split |
| > 800 lines | **Forbidden** — extract sub-components |

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

**The site is in French**, but all code must be in English:
- All comments must be in English
- All component names must be in English
- All function and variable names must be in English
- User-facing text (content, labels, buttons, links) remains in French

```tsx
// CORRECT
export function HeaderBrand() {
  // Render the brand logo and tagline
  return (
    <div className="fr-header__brand">
      <Logo />
      <h1>Service Name</h1>
    </div>
  );
}

// FORBIDDEN
export function MarqueEnTete() {
  // Affiche le logo et la devise
  return (
    <div className="fr-header__brand">
      <Logo />
      <h1>Nom du service</h1>
    </div>
  );
}
```

This rule applies to:
- All React component names
- All function and variable names
- All comments in the code
- All file names (except documented exceptions like Next.js routes)

---

## Tests

### Localization: `__tests__` rule

Tests live **in the module they test**, in a `__tests__/` subfolder:

```
src/modules/home/
  HomePage.tsx
  __tests__/
    HomePage.test.tsx       <- tests of HomePage

src/modules/layout/shared/
  NavLink.tsx
  __tests__/
    NavLink.test.tsx        <- tests of NavLink
```

Never place tests in `src/app/` — routes are thin wrappers without their own logic.

### Test policy: 100% coverage

**All written code must be tested. Without exception.**

- Each React component -> render test + observable behaviors
- Each hook -> test of all states and side effects
- Each utility / server function -> test of all cases (nominal + errors + edge cases)
- Each tRPC route -> integration test (valid input, invalid input, errors)

A file without tests is **incomplete**. Do not consider a task as complete if logic files are not covered at 100%.

> **Unique exception**: thin wrappers of routes `src/app/*/page.tsx` that contain no logic of their own (only import + return of a component).

### Tools

- **Vitest** for unit and integration tests
- **Playwright** for E2E tests in `src/e2e/`
- Target coverage: **100%** on all files with logic

### What to test

```ts
// CORRECT — tests observable behavior
it("displays aria-current=page on the active link", () => { ... });
it("renders the link to #content", () => { ... });

// USELESS — tests internal implementation
it("calls usePathname once", () => { ... });
```

### Standard mocks

```ts
// next/link -> simple HTML anchor
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// next/navigation -> mock usePathname
vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

// server-only -> empty (avoids error in jsdom)
vi.mock("server-only", () => ({}));

// tRPC server -> HydrateClient passthrough
vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

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

### E2E & Lighthouse tests (require a running dev server)

Both `pnpm test:e2e` and `pnpm test:lighthouse` need the app running on **port 3000**.

**Before running:**
```bash
# In a separate terminal (or background)
pnpm dev          # starts on http://localhost:3000
```

**Lighthouse CI** (config in `.lighthouserc.json`):
- Accessibility score must be **100%** (`error` if < 1)
- Performance score warns if < 70%
- Override URL: `LIGHTHOUSE_URL=http://localhost:4000 pnpm test:lighthouse`

**Playwright** (config in `playwright.config.ts`):
- Override URL: `PLAYWRIGHT_BASE_URL=http://localhost:4000 pnpm test:e2e`
- Install browsers: `pnpm playwright:install`

### Lint & Format (Biome)

| Command | Effect | When to use |
|---|---|---|
| `pnpm lint` | fixes linting errors (`--write`) | locally, before commit |
| `pnpm lint:check` | checks without modifying, exit 1 if error | CI |
| `pnpm format` | formats files (`--write`) | locally, before commit |
| `pnpm format:check` | checks without modifying, exit 1 if error | CI |
| `pnpm check` | lint + format check (both) | quick verification |
| `pnpm check:write` | lint + format auto-fix (both) | global correction |

> In CI, always use `:check` variants. Locally, prefer `pnpm lint` and `pnpm format` (or `pnpm check:write` to fix everything at once).

### Environment variables

Variables are declared and validated in `src/env.js` via [`@t3-oss/env-nextjs`](https://env.t3.gg/) + Zod. Validation runs at server startup and at build.

**Rule: never read `process.env` directly in the code. Always import `env` from `~/env.js`.**

```ts
// FORBIDDEN
const secret = process.env.AUTH_SECRET;

// CORRECT
import { env } from "~/env.js";
const secret = env.AUTH_SECRET; // typed, validated
```

**Add a variable:**

1. Declare it in `src/env.js` in the appropriate section:
   - `server` — server-only variables (never exposed to client)
   - `client` — public variables, **must** have the `NEXT_PUBLIC_` prefix

2. Add it to `runtimeEnv` (mapping `process.env`):

```ts
// src/env.js
server: {
  MA_VARIABLE: z.string(),                  // mandatory
  MA_VARIABLE_OPT: z.string().optional(),   // optional
  MA_URL: z.string().url(),                 // validated URL
},
runtimeEnv: {
  MA_VARIABLE: process.env.MA_VARIABLE,
},
```

3. Add it to the `.env` local (never commit `.env`) and document in `.env.example`.

**Required runtime variables:**

| Variable | Type | Usage |
|---|---|---|
| `AUTH_SECRET` | `string` | NextAuth secret (JWT signing) |
| `DATABASE_URL` | `string` (URL) | PostgreSQL connection |
| `EGAPRO_PROCONNECT_CLIENT_ID` | `string` | OAuth ProConnect |
| `EGAPRO_PROCONNECT_CLIENT_SECRET` | `string` | OAuth ProConnect |
| `EGAPRO_PROCONNECT_ISSUER` | `string` (URL) | OIDC issuer ProConnect |

**Optional variables:**

| Variable | Type | Usage |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `string` (URL) | Sentry monitoring |
| `NEXT_PUBLIC_MATOMO_URL` | `string` (URL) | Matomo analytics |
| `NEXT_PUBLIC_MATOMO_SITE_ID` | `string` | Matomo analytics |

> Pass `SKIP_ENV_VALIDATION=1` to bypass validation (Docker build, CI build without secrets).

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
