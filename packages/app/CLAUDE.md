# CLAUDE.md — `packages/app`

> Architecture et conventions structurantes du package. Les règles ponctuelles vivent dans `.claude/rules/` et arrivent toutes seules selon le fichier ouvert — elles ne sont pas recopiées ici.

---

## Stack

| Couche | Outil | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16 |
| UI | React | ^19 |
| Typage | TypeScript | ^6 — strict |
| Design system | @gouvfr/dsfr | ^1.14 (natif, sans react-dsfr) |
| Styles | classes DSFR + SCSS Modules | sass (mixins DSFR auto-injectés) |
| API | tRPC | ^11 |
| ORM | Drizzle | ^0.45 |
| Auth | NextAuth (ProConnect) | 4.x |
| Validation | Zod | ^4 |
| Lint / Format | Biome | ^2 |
| Tests unitaires | Vitest | ^4 |
| E2E | Playwright | ^1.59 |

---

## Structure

```
src/
  app/                 <- routes App Router — wrappers minces, RIEN d'autre
    api/               <- route handlers (tRPC, NextAuth)
  modules/             <- toute la logique et tous les composants, par domaine métier
    domain/            <- règles métier pures (isomorphes, zéro dépendance React/tRPC/Drizzle)
      index.ts         <- barrel : point d'import unique
      types.ts
      shared/          <- une préoccupation par fichier (gap, siren, campaign, workforce…)
      __tests__/       <- 100 % de couverture
    shared/            <- helpers transverses (useZodForm, useFileUploadForm…)
    <feature>/         <- un dossier par domaine métier (declaration, my-space, referents, admin…)
      index.ts         <- barrel
      schemas.ts       <- schémas Zod partagés form ↔ tRPC
      <Component>.tsx
      shared/
      __tests__/
  server/              <- code server-only
    api/               <- routeur tRPC
    db/                <- schéma Drizzle + connexion
    auth/              <- config NextAuth
    rules/             <- moteur d'étapes de la démarche (FSM) + son schéma
    services/
  trpc/                <- client tRPC (react, server, query-client)
  e2e/                 <- Playwright
  test/                <- setup Vitest (mocks communs)
  env.js               <- variables d'environnement typées
```

Cette arborescence décrit la **forme**, pas l'inventaire : la liste des modules bouge à chaque feature, la forme non.

### Deux règles structurelles absolues

**`src/app/` ne contient que des fichiers de route Next.js** — `page`, `layout`, `loading`, `error`, `not-found`, `global-error`, `template`, `default`, `opengraph-image`, `icon`, `apple-icon`. Tout composant sur mesure vit dans `src/modules/{domaine}/` ; la page est un wrapper mince qui importe depuis le barrel. Appliqué par le hook `block-bad-patterns`.

**Cohésion par fonctionnalité, jamais par type de fichier.**

```
src/modules/layout/Header/HeaderBrand.tsx   # CORRECT
src/components/HeaderBrand.tsx              # INTERDIT
src/hooks/useNavigation.ts                  # INTERDIT
src/app/ma-route/MonComposant.tsx           # INTERDIT (bloqué par le hook)
```

Chaque module expose un `index.ts`. Les consommateurs importent **toujours** depuis le barrel, jamais depuis un fichier interne.

---

## Formulaires

Tout formulaire utilise `react-hook-form` + Zod via le hook partagé `useZodForm` :

```tsx
import { useZodForm } from "~/modules/shared";
import { mySchema } from "~/modules/{domaine}/schemas";

const form = useZodForm(mySchema, { defaultValues: { … } });
```

Interdits : plusieurs `useState` pour des champs de formulaire, une validation impérative écrite à la main dans `handleSubmit`, un schéma Zod inline dans un routeur tRPC.

**Les schémas Zod sont la source unique de vérité, partagée front ↔ back :**

```
src/modules/{domaine}/schemas.ts    <- ils se définissent ici, et nulle part ailleurs
src/modules/{domaine}/index.ts      <- ré-exportés depuis le barrel
src/server/api/routers/{x}.ts       <- le routeur les importe
src/modules/{domaine}/MyForm.tsx    <- le formulaire importe les mêmes
```

Intégration DSFR : `register()` se spread directement sur un `<input>` natif portant les classes DSFR ; `Controller` pour les contrôles non standard (radios, selects custom) ; erreur de champ → `fr-input-group--error` + `<p className="fr-error-text">` ; erreur de formulaire ou de server action → `fr-alert fr-alert--error` avec **`role="alert"`** (qui implique assertive — ne jamais y ajouter `aria-live`), tandis qu'un statut informatif ou asynchrone prend `aria-live="polite"` + `aria-atomic="true"`.

**Upload de fichiers** : garde le hook `useFileUploadForm`. Son cycle de vie (sélection, validation, upload S3, persistance des métadonnées via tRPC) est distinct d'une soumission de formulaire classique — `react-hook-form` n'y apporte rien.

---

## Moteur d'étapes de la démarche (FSM)

La progression de la déclaration — écran suivant, transitions, conditions — a **une seule autorité** : `src/server/rules/v2027.1.json` + `engine.ts`, dont le vocabulaire d'états est la const `DECLARATION_FSM_STATUSES` de `~/modules/domain` (l'union `DeclarationFsmStatus` en dérive). Depuis #3974 le lien est **imposé par le compilateur**.

**Ne jamais réencoder le graphe d'états à la main.** Deux miroirs seulement le projettent (`declaration-remuneration/shared/complianceNavigation.ts`, `my-space/declarationProcessState.ts`) — ne pas en créer un troisième : tout code conscient de l'état se type sur `DeclarationFsmStatus` avec un `switch` exhaustif **sans `default:`**, ou dérive directement du moteur.

> Détail et modèles de tests → `.claude/rules/demarche-state-machine.md`

---

## Journalisation d'audit (#3174)

**Toute nouvelle surface relevant de la taxonomie d'audit câble son log en même temps.** Oublier le log est un bug de conformité, pas une amélioration.

| Surface | Câblage |
|---|---|
| Mutation tRPC | `AUDIT_ACTIONS.*` + catégorie `"mutation"` + entrée dans `PROCEDURE_TO_ACTION` |
| Query tRPC exposant PII / données GIP / données d'entreprise | idem, catégorie `"read_sensitive"` (rétention 180 j) |
| Route handler `src/app/api/**/route.ts` | wrapper `withAuditedRoute(…)` + `cachedAuth(request)` |
| Événement NextAuth, action cron / système | `logAction` direct |

Trois points de câblage sont requis à chaque fois : la constante, la catégorie (qui décide le bucket de rétention CNIL), et le fil propre à la surface. Le `metadata` jsonb ne doit **jamais** contenir de secret ni d'adresse IP (il y a une colonne dédiée).

> Playbook complet, snippets et checklist → `.claude/rules/audit-logging.md`

---

## Outillage

### MCP `next-devtools` (dès que le dev server tourne)

- **Avant** de modifier : `nextjs_index` pour découvrir le serveur, puis `nextjs_call` pour inspecter routes, arbre de composants et erreurs courantes
- **Après** : `nextjs_call(get_errors)` — il attrape les erreurs de compilation et de runtime que `pnpm typecheck` ne voit pas
- **Doc Next.js** : `nextjs_docs` (lire d'abord la ressource `nextjs-docs://llms-index` pour trouver les chemins). **Ne jamais deviner une API Next.js de mémoire**
- **Navigateur** : `browser_eval` pour naviguer, capturer, lire la console

Les MCP `dsfr` et `figma` sont couverts par `.claude/rules/styling-dsfr.md` et `.claude/rules/figma-workflow.md`.

### Scripts

```bash
pnpm dev              # copie les assets DSFR + Next.js en dev (port 3000)
pnpm build            # copie les assets DSFR + build production
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:integration # Vitest + testcontainers (exige Docker)
pnpm test:e2e         # Playwright (exige le dev server sur le port 3000)
pnpm check:write      # Biome : corrige lint + format d'un coup
pnpm a11y:dev         # side-car ultra11y (dashboard sur 127.0.0.1:4111) — optionnel
```

`pnpm test:e2e` et `pnpm test:lighthouse` exigent `pnpm dev` sur le **port 3000** — la passerelle de test ProConnect n'enregistre que ce callback.

### Base de données

```bash
pnpm db:generate      # génère la migration après un changement de schéma
pnpm db:migrate       # applique les migrations en attente
pnpm db:push          # applique le schéma sans migration (dev local uniquement)
pnpm db:studio        # Drizzle Studio
```

> Transactions, casing, interdits sur `drizzle/` → `.claude/rules/database-drizzle.md`

### Variables d'environnement

Déclarées et validées dans `src/env.js` (`@t3-oss/env-nextjs` + Zod). **Jamais de `process.env` direct** — `import { env } from "~/env.js"` (bloqué par le hook).

Ajouter une variable = 4 gestes : la déclarer dans `src/env.js` (section `server` ou `client`), l'ajouter à `runtimeEnv`, l'ajouter au `.env` local, **et l'ajouter à la config de déploiement `.kontinuous/`**. Il n'y a pas de configmap unique « egapro » : le conteneur app monte ses variables via `app.envFrom` / `app.env` de `.kontinuous/values.yaml`, chaque bloc pointant vers une configmap ou une sealed-secret **par sujet** (`proconnect`, `mail`, `s3`, `api`, `matomo`…) définie sous `.kontinuous/env/{dev,preprod,prod}/templates/<sujet>.{configmap,sealed-secret}.yaml`. Une valeur publique va dans la configmap du sujet, un secret dans sa sealed-secret.

> `SKIP_ENV_VALIDATION=1` contourne la validation (build Docker, CI sans secrets).
