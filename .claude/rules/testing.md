---
paths:
  - "src/**/__tests__/**"
---

# Testing

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
