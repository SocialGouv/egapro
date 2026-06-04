---
paths:
  - "src/e2e/**"
---

# E2E tests (Playwright)

> **Used by**: `code-dev` (écrit/maintient les E2E dans `src/e2e/`). **Pas** `tu-dev` (son périmètre = TU + intégration uniquement). Pour les TU / tests d'intégration → `rules/testing.md`. Auto-chargé via `paths: src/e2e/**`.

## Every page must be tested

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
