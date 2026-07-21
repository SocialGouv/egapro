---
paths:
  - "src/e2e/**"
---

# E2E tests (Playwright)

> **Used by**: `e2e-dev` (écrit/maintient **tous** les E2E dans `src/e2e/`, en fin de pipeline). **Pas** `code-dev` (il ne touche plus aux E2E) ni `tu-dev` (son périmètre = TU + intégration uniquement). Pour les TU / tests d'intégration → `rules/testing.md`. Auto-chargé via `paths: src/e2e/**`.

## Ownership : exclusivement `e2e-dev`

`code-dev` n'écrit plus aucun test E2E. La couverture E2E est ajoutée **après l'intégration du code**, par l'agent `e2e-dev` :

- **Feature (epic)** → **gate E2E bloquante** en fin d'`epic_loop.sh`, une fois tous les sous-tickets squash-mergés dans `epic/<N>` (avant doc-writer + PR finale).
- **Task / Bug** → après le verdict `validated` de `code-dev`, invoqué par `/implement`.

La gate est **bloquante** : sur une vraie régression, `e2e-dev` rend la main (commentaire `e2e-dev:`) et l'orchestrateur route vers l'agent `architect-rework` (création de tickets de fix reprocessés, ou escalade utilisateur sur doute fonctionnel). La PR finale n'est ouverte qu'une fois la suite E2E verte.

Voir `.claude/agents/e2e-dev/AGENT.md` (workflow : triage de régression, décision d'imbrication, criticité bugs) et `.claude/agents/architect-rework/AGENT.md`.

## Préférer l'imbrication aux fichiers isolés

Contrairement aux TU (nombreux, ciblés, 100% de couverture), on privilégie **peu de scénarios E2E globaux et riches**, qui rejouent un parcours utilisateur complet (`test.describe` + `test.step`, souvent `mode: "serial"`). On **greffe** une nouvelle fonctionnalité dans le scénario existant qui couvre déjà ce parcours plutôt que de créer un fichier par micro-comportement. Un **nouveau fichier** `*.e2e.ts` est réservé à un **parcours / une page réellement nouveaux**.

## Every page must be tested

Every route in `src/app/` **must** have corresponding E2E tests in `src/e2e/`. When a page is created or modified (by `code-dev`), `e2e-dev` verifies that an E2E test exists for it and updates/nests it if needed.

E2E tests must cover at minimum:
- The page renders without errors
- Key content/headings are visible
- Error pages (404, 500, 503) display correct status and messaging

Run `pnpm test:e2e` to execute all E2E tests (requires the dev server running on **port 3000** — the ProConnect test gateway only registers the `:3000` callback, so `auth.setup.ts` fails on any other port; worktree E2E runs must bind the dev server to `PORT=3000` while the docker stack keeps its index-derived ports). Port 3000 being a single global resource, all E2E runs are effectively serialized repo-wide: do not run an epic-end E2E gate (background) and a ticket-mode `e2e-dev` (foreground) at the same time — both fail closed on a busy port, but one of them will have to be re-run. E2E is **not** part of the CI pipeline, so `e2e-dev`'s local run is the authoritative E2E gate before the reviewable PR.

**Checklist for `e2e-dev` before completing any page-related coverage:**
1. List all routes in `src/app/**/page.tsx`
2. Verify each has a matching E2E test in `src/e2e/*.e2e.ts`
3. Add missing E2E tests for any uncovered page (nesting into an existing scenario where it fits)
