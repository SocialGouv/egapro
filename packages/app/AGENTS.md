# AGENTS.md — Conventions & Architecture · `packages/app`

> Référence pour tout agent IA ou développeur travaillant sur ce package.
> Lire en entier avant de toucher au code.

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

---

## DSFR — Règles d'usage

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

### Outils

- **Vitest** pour les tests unitaires et d'intégration
- **Playwright** pour les tests E2E dans `src/e2e/`
- Couverture minimale : **80%** sur les fichiers avec de la logique (utils, hooks, server)
- Les composants DSFR purement statiques (markup sans logique) n'ont pas besoin de tests unitaires

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
pnpm check        # lint Biome
pnpm check:write  # lint Biome + auto-fix
pnpm typecheck    # vérification TypeScript
pnpm test         # tests Vitest
pnpm test:e2e     # tests Playwright
```

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
