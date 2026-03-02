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
