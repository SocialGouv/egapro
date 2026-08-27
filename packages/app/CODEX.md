# CODEX.md — Conventions & Architecture · `packages/app`

> Reference for Codex and any AI agent or developer working on this package.
> Read in full before touching the code.

---

## Package convention source of truth

This package is still primarily documented through:

- `packages/app/CLAUDE.md`
- `.claude/rules/automation.md`
- `.claude/rules/react-components.md`
- `.claude/rules/styling-dsfr.md`
- `.claude/rules/testing.md`
- `.claude/rules/database-drizzle.md`
- `.claude/rules/trpc-api.md`

For Codex, treat those files as authoritative until dedicated Codex-native rule files exist.

---

## Mandatory rule after each task

All quality checks defined by the repository are expected to pass before considering work complete:

- **Lint/format**: the repository expects formatting and lint consistency after every edit
- **Forbidden patterns**: repository hooks and rules ban known bad patterns
- **Post-task gates**: the project defines validation, structural, RGAA, and security checks as the quality baseline

See `.claude/rules/automation.md` for the full workflow.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16 |
| UI | React | ^19 |
| Typing | TypeScript | ^5 — strict mode |
| Design system | @gouvfr/dsfr | ^1.14 (native, without react-dsfr) |
| Styling | DSFR classes + SCSS Modules | sass |
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

```text
src/
  app/                     <- Next.js routes only
  modules/                 <- Business logic and UI by domain
  server/                  <- Server-only code
  trpc/                    <- tRPC client utilities
  env.js                   <- Typed environment variables
  instrumentation.ts       <- Sentry setup
  test/                    <- Vitest setup
  e2e/                     <- Playwright tests
```

### Absolute rule: no custom components in `src/app/`

`src/app/` contains only route files such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `template.tsx`, and `default.tsx`.

Every custom component must live in `src/modules/{domain}/`. Pages stay thin and import from module barrels.

### Fundamental rule: domain organization

Organize by business/domain cohesion, not by file type. Each module exposes an `index.ts` barrel, and consumers import from the barrel rather than internal files.

---

## React Components: Server vs Client

Default: **Server Component**.

Add `"use client"` only for hooks, browser events, or Web APIs. Keep the interactive boundary as low as possible.

### Component granularity

One component = one responsibility. Extract sub-components when the JSX stops being easy to scan.

Detailed rules remain in `.claude/rules/react-components.md`.

---

## MCP Servers (`.mcp.json`)

Three MCP servers are configured and should be used in the relevant contexts:

| MCP Server | When to use | Key tools |
|---|---|---|
| `next-devtools` | Debugging, error diagnostics, route inspection, docs lookup | `nextjs_index`, `nextjs_call`, `nextjs_docs`, `browser_eval` |
| `dsfr` | Before writing any DSFR HTML | `get_component_doc`, `search_components`, `get_color_tokens` |
| `figma` | When implementing from a Figma design | `get_design_context`, `get_screenshot` |

### MCP Next.js DevTools

When the dev server is running:

- Check runtime and compilation errors through the MCP instead of guessing from terminal state
- Use `nextjs_docs` for framework behavior rather than relying on memory
- Use browser tooling for verification when UI behavior matters

### MCP DSFR

Before writing DSFR markup, verify the expected structure with DSFR docs tools. Do not guess DSFR classes from memory.

---

## Styling strategy

Priority order:

1. DSFR classes
2. DSFR utilities and CSS custom properties
3. Scoped SCSS module as a last resort

Inline `style={}` should be treated as forbidden unless there is a very strong reason and the project conventions already allow it.

Detailed styling rules remain in `.claude/rules/styling-dsfr.md`.

### SCSS Modules & DSFR SASS

`next.config.js` injects DSFR mixins through `sassOptions.additionalData`.

| Mixin | Media query | Usage |
|---|---|---|
| `@include respond-from(md)` | `min-width: 48em` | Mobile-first |
| `@include respond-to(sm)` | `max-width: 47.98em` | Desktop-first fallback |

### DSFR runtime

- DSFR assets are copied to `public/dsfr/`
- DSFR JS behavior should come from the framework runtime, not reimplemented ad hoc in React
- Decorative icons must be `aria-hidden="true"`
- Figma assets should be exported as SVG unless they are real photos

---

## Accessibility (RGAA / WCAG 2.1 AA)

Mandatory expectations:

- `SkipLinks` as first child of `<body>`
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`
- Dialog semantics for modal containers
- `NewTabNotice` for `target="_blank"` links
- `NavLink` for navigation items using `aria-current`
- `next/image` for images, with correct `alt`
- Labels for form fields

Do not add redundant `role` attributes on already semantic elements.

---

## TypeScript typing

- `strict: true`
- `noUncheckedIndexedAccess: true`
- No explicit `any`
- Shared types live in `types.ts` at module level when reused
- Component props use explicit `type Props = { ... }`

---

## General rules

- Prefer immutability over in-place mutation
- Handle errors explicitly
- Validate inputs at system boundaries
- Keep business rules in the domain layer as pure functions when possible

---

## Forms

Forms should use the project's shared form abstractions and Zod validation rather than ad hoc field state.

Treat these as forbidden defaults:

- One `useState` per field
- Validation logic split across many handlers
- Business validation embedded directly in JSX

Follow the concrete form conventions from `packages/app/CLAUDE.md` and `.claude/rules/*`.

---

## Practical Codex note

This file is the Codex-facing entry point for `packages/app`, but the deeper operational rules still live in the Claude-named repository files. In practice:

1. Start with `packages/app/CODEX.md`
2. Load `packages/app/CLAUDE.md` for the detailed package rules
3. Follow the relevant `.claude/rules/*` files for the files you touch
