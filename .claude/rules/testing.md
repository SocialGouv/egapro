---
paths:
  - "src/**/__tests__/**"
---

# Testing (unit + integration)

> **Used by**: `tu-dev` (écrit les TU + tests d'intégration), `validator` (exécute `pnpm test`), `structural-auditor` (règle 2.13). Pour les tests E2E → `rules/e2e.md`. Auto-chargé via `paths:`.

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

Count distinct behaviors and equivalence classes, not `if`/`else` branches — one branch may need several tests, and several branches may collapse into one. For a business threshold, test both sides of and exactly on the boundary (a 5% alert threshold → 4.9 / 5.0 / 5.1), using the domain constant from `~/modules/domain`, never a hardcoded `5`. Rule of thumb: one test = one behavior.

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

## Writing reliable tests

- **Real, complete mock data** — type the mock with the real type and fill every required field. No partial mocks, no `any` (also blocked by hook). When unsure, open the model and compare fields.
- **Assert the real initial state** — verify the state the code actually starts in (e.g. `loading: true`); never invent a state that does not exist.
- **Async** — always `await waitFor(() => expect(...))`; never `setTimeout`/`setImmediate`.
- **Re-render** — change the mock *before* calling `rerender()`; `rerender()` alone changes nothing.
- **Console spy** — only spy on `console.error`/`console.warn` when the code actually calls it; otherwise don't.

## Test skeleton (two-path service)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FetchResult } from "~/modules/example/types";

describe("fetchDeclaration", () => {
  const mockResponse: FetchResult = { id: "123", gap: 4.2, valid: true };

  const mockApiSuccess = (data: FetchResult) =>
    vi.spyOn(api, "get").mockResolvedValue(data);
  const mockApiError = (error: Error) =>
    vi.spyOn(api, "get").mockRejectedValue(error);

  beforeEach(() => vi.clearAllMocks());

  it("returns the declaration on success", async () => {
    mockApiSuccess(mockResponse);
    await expect(fetchDeclaration("123")).resolves.toEqual(mockResponse);
  });

  it("propagates the error on network failure", async () => {
    mockApiError(new Error("Network down"));
    await expect(fetchDeclaration("123")).rejects.toThrow("Network down");
  });
});
```
