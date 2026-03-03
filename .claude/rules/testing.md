---
paths:
  - "src/**/__tests__/**"
---

# Testing

## 75% minimum code coverage (enforced)

Global code coverage must stay **at or above 75%** for statements, branches, functions, and lines. This is enforced by Vitest coverage thresholds — `pnpm test --coverage` will fail if any metric drops below 75%.

Run `pnpm test --coverage` to check the current coverage report.

## 100% coverage on logic files

Every file with logic must have corresponding tests. The only exception is thin route wrappers in `src/app/*/page.tsx`.

## Test observable behavior

Test what the user sees and what the API returns — not internal implementation details.

```ts
// CORRECT
it("displays an error message when SIREN is invalid", ...)
it("returns NOT_FOUND when declaration does not exist", ...)

// USELESS
it("calls setSiren setter once", ...)
it("re-renders 3 times", ...)
```

## Test file location

Tests live in `__tests__/` subfolder next to the module they test. Never in `src/app/`.

## Cover all paths

For each function/component, test:
- Nominal case (happy path)
- Error cases (invalid input, network failure, missing data)
- Edge cases (empty arrays, boundary values, null/undefined)

## Mock boundaries only

Mock external dependencies (next/navigation, next/link, server-only, tRPC, DB).
Never mock the unit under test or its internal helpers.

## Standard mocks (centralized in `src/test/setup.ts`)

All common mocks are defined once in `setup.ts` and auto-loaded by Vitest. Never duplicate them in test files:
- `next/link` → simple `<a>` tag
- `next/navigation` → `usePathname` + `useRouter` stubs
- `next/image` → `<div role="img">`
- `next-auth/react` → `signIn` stub
- `server-only` → empty module
- `~/trpc/server` → `HydrateClient` passthrough

Tests needing specific overrides can call `vi.mock()` locally — it takes precedence over `setup.ts`.

## E2E: every page must be tested

Every route in `src/app/` **must** have corresponding E2E tests in `src/e2e/`. When creating or modifying a page, verify that an E2E test exists for it and update it if needed.

E2E tests must cover at minimum:
- The page renders without errors
- Key content/headings are visible
- Error pages (404, 500, 503) display correct status and messaging

Run `pnpm test:e2e` to execute all E2E tests (requires the dev server running on port 3000).

**Checklist before completing any page-related task:**
1. List all routes in `src/app/**/page.tsx`
2. Verify each has a matching E2E test in `src/e2e/*.e2e.ts`
3. Add missing E2E tests for any uncovered page
