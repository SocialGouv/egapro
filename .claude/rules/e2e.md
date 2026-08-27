---
paths:
  - "src/e2e/**"
---

# Tests E2E (Playwright)

> Propriétaire **exclusif** : l'agent `e2e-dev`. `code-dev` ne touche jamais à `src/e2e/**` — il possède les TU et l'intégration, pas l'E2E. Quand la gate tourne et ce qui se passe sur régression → `.claude/pipeline/orchestration.md`. Pour les TU et tests d'intégration → `rules/testing.md`.

## Peu de scénarios, mais riches

Contrairement aux tests unitaires — nombreux, ciblés, 100 % de couverture — on privilégie **peu de scénarios E2E globaux** qui rejouent un parcours utilisateur complet (`test.describe` + `test.step`, souvent `mode: "serial"`). Une nouvelle fonctionnalité se **greffe** dans le scénario existant qui couvre déjà ce parcours. Un **nouveau fichier** `*.e2e.ts` est réservé à un parcours ou une page réellement nouveaux.

## Couverture des pages

Chaque route de `src/app/**/page.tsx` doit avoir une couverture E2E : la page rend sans erreur, le contenu et les titres clés sont visibles, les pages d'erreur (404, 500, 503) affichent le bon statut et le bon message.

Le mandat porte sur la **couverture d'un parcours**, pas sur chaque édition d'un fichier de page. Une modification purement visuelle (SCSS, `className`, libellé, espacement) sur une route déjà couverte ne le déclenche pas, et il ne prime **jamais** sur le critère de criticité d'`e2e-dev` : entre « la page est modifiée » et « le parcours change », c'est la criticité qui tranche.

## Contrats de fidélité Figma

La suite porte aussi les contrats de fidélité visuelle — la couche de régression **permanente** que le gate `design-validator`, ponctuel et dégradable si la session ProConnect manque, ne fournit pas. Il n'y a **ni moteur générique ni dossier de fixtures** : un contrat est un `*.e2e.ts` dédié qui porte ses valeurs attendues en constantes de module et les asserte via `getComputedStyle` / `getBoundingClientRect`. Quatre existent (`breadcrumb-spacing`, `stepper-spacing`, `declaration-header-alignment`, `second-declaration-info-styling`) — les copier plutôt qu'en inventer la forme. L'assertion s'imbrique dans le scénario qui atteint déjà l'écran dans le bon état, jamais un tunnel rejoué pour une mesure. Discipline d'écriture → `rules/visual-quality-validation.md`.

## Lancer la suite

`pnpm test:e2e`, avec le dev server sur le **port 3000** : la passerelle de test ProConnect n'enregistre que ce callback, donc `auth.setup.ts` échoue sur tout autre port. Un run E2E en worktree doit binder le dev server sur `PORT=3000` pendant que la stack docker garde ses ports dérivés de l'index.

Le port 3000 étant une ressource globale unique, **tous les runs E2E du dépôt sont de fait sérialisés** : ne jamais lancer une gate E2E de fin d'epic (background) et un `e2e-dev` en mode ticket (foreground) en même temps. Les deux échouent proprement sur un port occupé, mais l'un des deux sera à relancer.

`e2e.yaml` rejoue aussi la suite en CI sur toute PR ciblant `alpha` (check « Test e2e »). Le run local d'`e2e-dev` reste la gate qui précède l'ouverture de la PR.
