---
paths:
  - "src/e2e/**"
---

# E2E tests (Playwright)

> **Used by**: `e2e-dev` (écrit/maintient **tous** les E2E dans `src/e2e/`, en fin de pipeline). **Pas** `code-dev` (il ne touche plus aux E2E) ni `tu-dev` (son périmètre = TU + intégration uniquement). Pour les TU / tests d'intégration → `rules/testing.md`. Auto-chargé via `paths: src/e2e/**`.

## Ownership : exclusivement `e2e-dev`

`code-dev` n'écrit plus aucun test E2E. La couverture E2E est ajoutée **après l'intégration du code**, par l'agent `e2e-dev` :

- **Feature (epic)** → en fin d'`epic_loop.sh`, une fois tous les sous-tickets squash-mergés dans `epic/<N>`.
- **Task / Bug** → après le verdict `validated` de `code-dev`, invoqué par `/implement`.

Voir `.claude/agents/e2e-dev/AGENT.md` pour le workflow complet (triage de régression, décision d'imbrication, critère de criticité pour les bugs).

## Préférer l'imbrication aux fichiers isolés

Contrairement aux TU (nombreux, ciblés, 100% de couverture), on privilégie **peu de scénarios E2E globaux et riches**, qui rejouent un parcours utilisateur complet (`test.describe` + `test.step`, souvent `mode: "serial"`). On **greffe** une nouvelle fonctionnalité dans le scénario existant qui couvre déjà ce parcours plutôt que de créer un fichier par micro-comportement. Un **nouveau fichier** `*.e2e.ts` est réservé à un **parcours / une page réellement nouveaux**.

## Every page must be tested

Every route in `src/app/` **must** have corresponding E2E tests in `src/e2e/`. When a page is created or modified (by `code-dev`), `e2e-dev` verifies that an E2E test exists for it and updates/nests it if needed.

E2E tests must cover at minimum:
- The page renders without errors
- Key content/headings are visible
- Error pages (404, 500, 503) display correct status and messaging

Run `pnpm test:e2e` to execute all E2E tests (requires the dev server running — `e2e-dev` runs it against its worktree's port via `PLAYWRIGHT_BASE_URL`, the default being port 3000). E2E is **not** part of the CI pipeline, so `e2e-dev`'s local run is the authoritative E2E gate before the reviewable PR.

**Checklist for `e2e-dev` before completing any page-related coverage:**
1. List all routes in `src/app/**/page.tsx`
2. Verify each has a matching E2E test in `src/e2e/*.e2e.ts`
3. Add missing E2E tests for any uncovered page (nesting into an existing scenario where it fits)
