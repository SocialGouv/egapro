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

`pnpm test:e2e` utilise `PLAYWRIGHT_BASE_URL` si elle est fournie, puis `SITE_URL`, puis `http://localhost:3000`. La connexion ProConnect passe par Charon, dont la configuration egapro dans `SocialGouv/infra-apps` autorise les callbacks locaux sur :3000–:3010 après déploiement. Le port de la base Playwright, `PORT` et `NEXTAUTH_URL` doivent être identiques. Contexte complet → README, § Connexion ProConnect.

Les gates E2E de fin d'epic réservent les indices 5 à 9 (ports :3006–:3010) via `run_e2e_dev.sh`. Les worktrees de ticket utilisent les indices 0 à 4 (ports :3001–:3005). Ne réutiliser ni un index ni les ports Docker associés pendant une autre exécution ; une gate échoue si ses cinq créneaux sont occupés.

`e2e.yaml` rejoue aussi la suite en CI sur toute PR ciblant `alpha` (check « Test e2e »), **et avec elle les 185 coordonnées de la grille de recette** (`pnpm test:e2e:grille`) : depuis #4132 les deux tournent en shards parallèles — 2 pour la suite, 3 pour la grille — sous un job agrégateur qui porte le nom du check requis. Le deuxième shard de la suite utilise :3006 et vérifie ainsi un vrai callback ProConnect hors :3000 ; il exige que la configuration Charon correspondante soit déployée. Une coordonnée rouge bloque donc la PR, au même titre qu'un spec rouge. `e2e-grille.yaml` reste le run nocturne, qui produit le rapport de recette.

Conséquence pour qui touche au graphe de projets ou aux modes d'exécution : Playwright ne shard que les projets de **premier niveau** et rejoue un projet de dépendance en entier dans chaque shard — mettre un projet en aval d'un autre renvoie donc toute sa collection dans le premier shard. Un `test.describe.configure({ mode: "serial" })` au niveau d'un fichier ne rend insécable que **ce fichier** : `admin-access`, `campaign-year`… le sont déjà et se répartissent normalement entre shards. Le problème n'apparaît que si un seul bloc `serial` concentre l'essentiel de la collection, comme la grille avant #4132 — un shard hérite alors de la quasi-totalité des tests et les autres restent vides. Le workflow refuse un shard qui ne collecte rien, précisément pour que cette annulation silencieuse de la parallélisation se voie.

Le run local d'`e2e-dev` reste la gate qui précède l'ouverture de la PR. Il joue toujours la suite. Il ne joue la grille que si le diff touche le parcours qu'elle rejoue ; sinon, c'est la CI qui la rejoue sur la PR. La règle est un script, `scripts/orchestration/grille_scope.sh`, appliqué à l'étape 3 de [`e2e-dev`](../agents/e2e-dev/AGENT.md).
