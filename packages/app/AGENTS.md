# AGENTS.md — Conventions & Architecture · `packages/app`

> Référence pour tout agent IA ou développeur travaillant sur ce package.
> Lire en entier avant de toucher au code.

---

## Règle obligatoire après chaque tâche

**Après chaque modification de code, sans exception, lancer dans cet ordre :**

```bash
pnpm lint        # corrige les erreurs lint
pnpm format      # formate le code
pnpm typecheck   # vérifie les types TypeScript
```

Ne pas considérer une tâche comme terminée tant que ces trois commandes passent sans erreur.

---

## Stack technique

| Couche | Outil | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16 |
| UI | React | ^19 |
| Typage | TypeScript | ^5 — strict mode |
| Design system | @gouvfr/dsfr | ^1.14 (natif, sans react-dsfr) |
| API | tRPC | ^11 |
| ORM | Drizzle ORM | ^0.45 |
| Auth | NextAuth | 4.x |
| Validation | Zod | ^4 |
| Lint / Format | Biome | ^2 |
| Tests unitaires | Vitest | ^4 |
| Tests E2E | Playwright | ^1.58 |
| Gestionnaire de paquets | pnpm (workspace) | ^10 |

---

## Structure des modules

```
src/
  app/                     ← Routes Next.js (App Router) — thin wrappers uniquement
    layout.tsx             ← Root layout : <html>, DSFR CSS/JS, SkipLinks, Header, Footer
    page.tsx               ← Importe HomePage + wrap HydrateClient
    global-error.tsx       ← Error boundary global (Sentry)
    api/                   ← Route handlers (tRPC, NextAuth)
    login/
      page.tsx             ← Page de connexion ProConnect (redirige si déjà connecté)

  modules/                 ← Logique métier et composants par domaine
    analytics/             ← Tracking Matomo
      index.ts             ← Barrel : exporte MatomoAnalytics
      MatomoAnalytics.tsx  ← Composant client de tracking Matomo (NEXT_PUBLIC_MATOMO_*)
    layout/                ← Composants de mise en page globale
      index.ts             ← Barrel : exporte Header, Footer, SkipLinks
      shared/
        NavLink.tsx        ← Lien actif avec aria-current dynamique ("use client")
        NewTabNotice.tsx   ← Texte sr-only pour les liens target="_blank"
        SkipLinks.tsx      ← Navigation d'évitement (RGAA 12.7)
        __tests__/
          NavLink.test.tsx
          NewTabNotice.test.tsx
          SkipLinks.test.tsx
      Header/
        index.tsx          ← Orchestrateur
        HeaderBrand.tsx    ← Logo Marianne + nom de service + tagline
        HeaderQuickAccess.tsx ← Bouton "Se connecter" (desktop)
        Navigation.tsx     ← <nav> avec sous-menus déroulants (JS DSFR)
        MobileMenu.tsx     ← Dialog modale de navigation mobile
      Footer/
        index.tsx          ← Orchestrateur
        FooterTopLinks.tsx ← Liens utiles + liens ministère
        FooterBody.tsx     ← Logo + description + liens gouvernementaux
        FooterBottom.tsx   ← Mentions légales + paramètres d'affichage + licence
        ThemeModal.tsx     ← Dialog modale dark mode (thème clair/sombre/système)
    home/
      index.ts             ← Barrel : exporte HomePage
      HomePage.tsx         ← Contenu visuel de la page d'accueil
      __tests__/
        HomePage.test.tsx

  server/                  ← Code serveur uniquement
    auth/                  ← Configuration NextAuth
    api/                   ← Routeur tRPC
    db/                    ← Schéma Drizzle + connexion Postgres

  trpc/                    ← Client tRPC (react, server, query-client)
  env.js                   ← Variables d'environnement typées (@t3-oss/env-nextjs)
  instrumentation.ts       ← Setup Sentry (serveur + edge)
  test/                    ← Setup Vitest (setup.ts)
  e2e/                     ← Tests Playwright
```

### Règle fondamentale : organisation par domaine

```
# CORRECT — cohésion par fonctionnalité
src/modules/layout/Header/HeaderBrand.tsx

# INTERDIT — organisation par type de fichier
src/components/HeaderBrand.tsx
src/hooks/useNavigation.ts
```

Chaque module expose un `index.ts` barrel. Les consommateurs importent toujours depuis le barrel, jamais depuis les sous-fichiers internes.

```ts
// CORRECT
import { Header, Footer } from "~/modules/layout";

// INTERDIT
import { Header } from "~/modules/layout/Header/index";
```

---

## Composants React : Server vs Client

Défaut : **Server Component**. Ajouter `"use client"` uniquement si le composant a besoin de :
- hooks (`useState`, `useEffect`, `usePathname`, `useRouter`…)
- event listeners navigateur
- Web APIs (`localStorage`, `document`…)

```tsx
// Server Component — pas de directive (défaut)
export function FooterBody() { ... }

// Client Component — directive obligatoire en première ligne
"use client";
export function NavLink({ href }: { href: string }) {
  const pathname = usePathname(); // hook Next.js
  ...
}
```

Ne pas remonter `"use client"` inutilement vers les parents. Isoler la partie interactive au niveau le plus bas possible.

### Granularité des composants

**Règle : un composant = une responsabilité.** Préférer beaucoup de petits composants à quelques gros.

- Un composant ne doit faire qu'une seule chose lisible en une phrase
- Dès qu'un composant dépasse ~50 lignes de JSX, extraire des sous-composants
- Nommer les composants d'après ce qu'ils affichent, pas d'après leur position dans l'arbre

```tsx
// INTERDIT — composant fourre-tout
export function Dashboard() {
  // 200 lignes de JSX : header, tableau, filtres, pagination…
}

// CORRECT — décomposé
export function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardFilters />
      <DashboardTable />
      <DashboardPagination />
    </>
  );
}
```

Chaque sous-composant extrait est **testable indépendamment** — c'est l'objectif.

---

## DSFR — Règles d'usage

### MCP DSFR (obligatoire)

Le serveur MCP [`dsfr-mcp`](https://github.com/SocialGouv/dsfr-mcp) expose toute la documentation DSFR directement dans l'assistant IA (structure HTML, classes CSS, variantes, accessibilité, tokens couleur, icônes).

**Installation une seule fois (scope utilisateur) :**

```bash
claude mcp add dsfr --scope user -- npx dsfr-mcp
```

Ou via `.mcp.json` à la racine du projet pour le partager en équipe :

```json
{
  "mcpServers": {
    "dsfr": {
      "command": "npx",
      "args": ["dsfr-mcp"]
    }
  }
}
```

**Outils disponibles une fois connecté :**

| Outil | Usage |
|---|---|
| `list_components` | Lister tous les composants DSFR disponibles |
| `get_component_doc` | Doc d'un composant : HTML, classes CSS, variantes, accessibilité |
| `search_components` | Recherche plein texte dans la documentation |
| `search_icons` | Trouver une icône par nom/catégorie → classe CSS `fr-icon-*` |
| `get_color_tokens` | Tokens couleur par contexte/usage, thèmes clair/sombre |

**Règle :** avant d'écrire du HTML DSFR, utiliser `get_component_doc` ou `search_components` pour vérifier la structure correcte. Ne jamais deviner les classes CSS DSFR de mémoire.

### Assets
Les assets DSFR (CSS, fonts, icônes) sont copiés dans `public/dsfr/` par `scripts/copy-dsfr.js`. Ce dossier est **ignoré par git** et regénéré à chaque `dev` / `build`.

Ne jamais importer le CSS DSFR via webpack/node_modules. Toujours via `<link href="/dsfr/...">` dans le layout.

### JavaScript DSFR
Le JS DSFR (`dsfr.module.min.js`) est chargé via `<Script type="module" strategy="beforeInteractive">`. Il gère :
- Ouverture/fermeture des modales et menus déroulants
- Bascule de thème (dark/light/system) via `data-fr-scheme`
- Navigation clavier des composants interactifs

Ne **jamais** dupliquer la logique JS DSFR en React. S'appuyer sur les attributs `data-fr-*` et laisser le JS DSFR faire son travail.

### Dark mode
- Attribut `data-fr-scheme="system"` sur `<html>` par défaut
- Script inline dans `<head>` lit le cookie `fr-theme` avant render pour éviter le flash
- La modale `ThemeModal` gère le changement ; le JS DSFR persiste dans le cookie et met à jour l'attribut

### Icônes
Utiliser les classes utilitaires DSFR : `fr-icon-{nom}-{fill|line}`.
L'ensemble des icônes est disponible dans `/dsfr/utility/icons/`.
Toujours ajouter `aria-hidden="true"` sur les icônes décoratives.

---

## Accessibilité (RGAA / WCAG 2.1 AA)

### Checklist obligatoire

- **Skip links** : `SkipLinks` en premier enfant de `<body>` (RGAA 12.7)
- **Landmarks** : utiliser `<header>`, `<nav>`, `<main>`, `<footer>` sémantiques. Ne pas ajouter de `role` redondant (`role="navigation"` sur `<nav>` est interdit)
- **Modales** : tout `<div>` avec `aria-labelledby` ou `aria-describedby` doit avoir `role="dialog"` + `aria-modal="true"`
- **Liens externes** : tout `target="_blank"` doit contenir un `<NewTabNotice />` (texte `fr-sr-only`)
- **aria-current** : utiliser `NavLink` pour les liens de navigation — `aria-current="page"` est calculé dynamiquement via `usePathname()`
- **Icônes** : `aria-hidden="true"` sur les éléments purement décoratifs
- **Images** : `alt` descriptif obligatoire, `alt=""` pour les images décoratives
- **Formulaires** : chaque `<input>` doit avoir un `<label>` associé via `htmlFor`/`id`

### Éléments sémantiques vs ARIA

```tsx
// CORRECT — élément natif, role implicite
<nav aria-label="Menu principal">...</nav>

// INTERDIT — role redondant
<nav role="navigation" aria-label="Menu principal">...</nav>

// CORRECT — div sans rôle implicite, role="dialog" requis
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">...</div>
```

---

## Typage TypeScript

- `strict: true` activé, `noUncheckedIndexedAccess: true`
- Pas de `any` explicite — utiliser `unknown` et narrowing
- Types d'objets partagés dans des fichiers `types.ts` au niveau du module
- Toujours typer les props des composants avec un `type Props = { ... }`

```ts
// CORRECT
type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

// INTERDIT
const MyComponent = (props: any) => { ... }
```

---

## Immutabilité

Ne jamais muter un objet ou un tableau. Toujours créer de nouvelles instances.

```ts
// INTERDIT
user.name = "Jean";

// CORRECT
const updatedUser = { ...user, name: "Jean" };
```

---

## Gestion des erreurs

```ts
// CORRECT — avec message utilisateur explicite
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error("fetchData failed:", error);
  throw new Error("Impossible de charger les données. Réessayez plus tard.");
}
```

---

## Validation des entrées

Toujours valider avec Zod aux frontières du système (formulaires, paramètres de route, body API).

```ts
import { z } from "zod";

const schema = z.object({
  siren: z.string().regex(/^\d{9}$/, "SIREN invalide"),
  annee: z.number().int().min(2018).max(new Date().getFullYear()),
});
```

---

## Taille des fichiers

| Taille | Statut |
|---|---|
| < 200 lignes | Idéal |
| 200–400 lignes | Acceptable |
| 400–800 lignes | À découper |
| > 800 lignes | **Interdit** — extraire des sous-composants |

---

## Conventions de nommage

| Type | Convention | Exemple |
|---|---|---|
| Composant React | PascalCase | `HeaderBrand.tsx` |
| Hook | camelCase + `use` | `useNavigation.ts` |
| Utilitaire | camelCase | `formatDate.ts` |
| Type / Interface | PascalCase | `type UserProfile = ...` |
| Constante | SCREAMING_SNAKE | `const MAX_RETRY = 3` |
| Dossier module | camelCase | `modules/layout/` |

### Langue : Anglais obligatoire

**Règle absolue : tous les commentaires et les noms de composants doivent être en anglais.**

```tsx
// CORRECT
export function HeaderBrand() {
  // Render the brand logo and tagline
  return (
    <div className="fr-header__brand">
      <Logo />
      <h1>Service Name</h1>
    </div>
  );
}

// INTERDIT
export function MarqueEnTete() {
  // Affiche le logo et la devise
  return (
    <div className="fr-header__brand">
      <Logo />
      <h1>Nom du service</h1>
    </div>
  );
}
```

Cette règle s'applique à :
- Tous les noms de composants React
- Tous les noms de fonctions et variables
- Tous les commentaires dans le code
- Tous les noms de fichiers (sauf exceptions documentées comme les routes Next.js)

---

## Tests

### Localisation : règle `__tests__`

Les tests vivent **dans le module qu'ils testent**, dans un sous-dossier `__tests__/` :

```
src/modules/home/
  HomePage.tsx
  __tests__/
    HomePage.test.tsx       ← tests de HomePage

src/modules/layout/shared/
  NavLink.tsx
  __tests__/
    NavLink.test.tsx        ← tests de NavLink
```

Ne jamais placer des tests dans `src/app/` — les routes sont des thin wrappers sans logique propre.

### Politique de test : couverture 100 %

**Tout code écrit doit être testé. Sans exception.**

- Chaque composant React → test de rendu + comportements observables
- Chaque hook → test de tous les états et effets de bord
- Chaque utilitaire / fonction serveur → test de tous les cas (nominal + erreurs + edge cases)
- Chaque route tRPC → test d'intégration (input valide, input invalide, erreurs)

Un fichier sans tests est **incomplet**. Ne pas considérer une tâche comme terminée si des fichiers de logique ne sont pas couverts à 100 %.

> **Exception unique** : les thin wrappers de routes `src/app/*/page.tsx` qui ne contiennent aucune logique propre (uniquement import + return d'un composant).

### Outils

- **Vitest** pour les tests unitaires et d'intégration
- **Playwright** pour les tests E2E dans `src/e2e/`
- Couverture cible : **100 %** sur tous les fichiers avec de la logique

### Ce qu'il faut tester

```ts
// CORRECT — teste le comportement observable
it("affiche aria-current=page sur le lien actif", () => { ... });
it("rend le lien vers #content", () => { ... });

// INUTILE — teste l'implémentation interne
it("appelle usePathname une fois", () => { ... });
```

### Mocks standard

```ts
// next/link → ancre HTML simple
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// next/navigation → mock usePathname
vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

// server-only → vide (évite l'erreur dans jsdom)
vi.mock("server-only", () => ({}));

// tRPC server → HydrateClient passthrough
vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

---

## Scripts utiles

```bash
pnpm dev          # copie DSFR assets + démarre Next.js en mode dev
pnpm build        # copie DSFR assets + build production
pnpm typecheck    # vérification TypeScript (tsc --noEmit)
pnpm test         # tests Vitest
pnpm test:e2e     # tests Playwright
```

### Lint & Format (Biome)

| Commande | Effet | Quand l'utiliser |
|---|---|---|
| `pnpm lint` | corrige les erreurs lint (`--write`) | en local, avant commit |
| `pnpm lint:check` | vérifie sans modifier, exit 1 si erreur | CI |
| `pnpm format` | formate les fichiers (`--write`) | en local, avant commit |
| `pnpm format:check` | vérifie sans modifier, exit 1 si erreur | CI |
| `pnpm check` | lint + format check (les deux) | vérification rapide |
| `pnpm check:write` | lint + format auto-fix (les deux) | correction globale |

> En CI, toujours utiliser les variantes `:check`. En local, préférer `pnpm lint` et `pnpm format` (ou `pnpm check:write` pour tout corriger d'un coup).

### Variables d'environnement

Les variables sont déclarées et validées dans `src/env.js` via [`@t3-oss/env-nextjs`](https://env.t3.gg/) + Zod. La validation s'exécute au démarrage du serveur et au build.

**Règle : ne jamais lire `process.env` directement dans le code. Toujours importer `env` depuis `~/env.js`.**

```ts
// INTERDIT
const secret = process.env.AUTH_SECRET;

// CORRECT
import { env } from "~/env.js";
const secret = env.AUTH_SECRET; // typé, validé
```

**Ajouter une variable :**

1. La déclarer dans `src/env.js` dans la section appropriée :
   - `server` — variables serveur uniquement (jamais exposées au client)
   - `client` — variables publiques, **doivent** avoir le préfixe `NEXT_PUBLIC_`

2. L'ajouter dans `runtimeEnv` (mapping `process.env`) :

```ts
// src/env.js
server: {
  MA_VARIABLE: z.string(),                  // obligatoire
  MA_VARIABLE_OPT: z.string().optional(),   // optionnelle
  MA_URL: z.string().url(),                 // URL validée
},
runtimeEnv: {
  MA_VARIABLE: process.env.MA_VARIABLE,
},
```

3. L'ajouter au `.env` local (ne jamais commiter `.env`) et documenter dans `.env.example`.

**Variables requises au runtime :**

| Variable | Type | Usage |
|---|---|---|
| `AUTH_SECRET` | `string` | Secret NextAuth (JWT signing) |
| `DATABASE_URL` | `string` (URL) | Connexion PostgreSQL |
| `EGAPRO_PROCONNECT_CLIENT_ID` | `string` | OAuth ProConnect |
| `EGAPRO_PROCONNECT_CLIENT_SECRET` | `string` | OAuth ProConnect |
| `EGAPRO_PROCONNECT_ISSUER` | `string` (URL) | OIDC issuer ProConnect |

**Variables optionnelles :**

| Variable | Type | Usage |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `string` (URL) | Monitoring Sentry |
| `NEXT_PUBLIC_MATOMO_URL` | `string` (URL) | Analytics Matomo |
| `NEXT_PUBLIC_MATOMO_SITE_ID` | `string` | Analytics Matomo |

> Passer `SKIP_ENV_VALIDATION=1` pour bypasser la validation (Docker build, CI build sans secrets).

### Base de données (Drizzle Kit)

> À lancer depuis la racine du monorepo via `pnpm db:*`, ou depuis `packages/app/` directement.

```bash
pnpm db:generate  # génère les fichiers de migration après un changement de schéma
pnpm db:migrate   # applique les migrations en attente sur la base de données
pnpm db:push      # applique le schéma directement sans migration (dev uniquement)
pnpm db:studio    # ouvre Drizzle Studio (UI pour inspecter la base)
```

**Workflow standard :**
1. Modifier le schéma dans `src/server/db/`
2. `pnpm db:generate` — crée le fichier SQL de migration
3. `pnpm db:migrate` — applique la migration
4. `pnpm dev` — relancer le serveur si nécessaire
