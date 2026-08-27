---
paths:
  - "src/**/__tests__/**"
---

# Tests unitaires et d'intégration

> Chargée sur `src/**/__tests__/**`. Propriétaire dans la pipeline : `tu-dev`. Pour les E2E Playwright → `rules/e2e.md` (propriétaire : `e2e-dev`).

## Couverture

75 % minimum en global (statements, branches, functions, lines) — seuil **appliqué** par Vitest, `pnpm test --coverage` échoue en dessous. **100 %** sur les fichiers de logique ; seules exceptions, les thin wrappers `src/app/*/page.tsx` et les chemins déjà exclus par `vitest.config.ts` (`src/trpc`, `src/server/db`, `src/server/auth`, `src/app/api`, `env.js`, instrumentation).

Les tests vivent dans un `__tests__/` à côté du module qu'ils testent, jamais dans `src/app/`.

## Ce qu'on teste

Le **comportement observable** : ce que l'utilisateur voit, ce que l'API retourne. Pas le nombre de rendus, pas l'appel d'un setter.

Pour chaque unité : cas nominal, cas d'erreur (entrée invalide, échec réseau, donnée absente), cas limites (tableau vide, valeurs de bord, `null`/`undefined`).

Compter des **comportements et des classes d'équivalence**, pas des branches `if`/`else` — une branche peut demander plusieurs tests, plusieurs branches peuvent n'en demander qu'un. Sur un seuil métier, tester des deux côtés **et** exactement dessus (seuil d'alerte à 5 % → 4,9 / 5,0 / 5,1), en utilisant la constante de `~/modules/domain`, jamais un `5` en dur.

## Mocks

Mocker **uniquement les frontières** : `next/navigation`, `next/link`, `server-only`, tRPC, la DB. Jamais l'unité sous test ni ses helpers internes.

Les mocks communs sont définis **une fois** dans `src/test/setup.ts` et auto-chargés par Vitest — `next/link`, `next/navigation`, `next/image`, `next-auth/react`, `server-only`, `~/trpc/server`. Ne jamais les redupliquer dans un fichier de test ; un `vi.mock()` local reste possible pour un override ponctuel, il a la priorité.

## Pièges déjà rencontrés

- **Mocks réels et complets** — typer le mock avec le vrai type et remplir chaque champ requis. Pas de mock partiel. Dans le doute, ouvrir le modèle et comparer les champs.
- **Asserter le vrai état initial** — vérifier l'état dans lequel le code démarre réellement (`loading: true`), jamais un état inventé.
- **Async** — toujours `await waitFor(() => expect(…))`, jamais `setTimeout` / `setImmediate`.
- **Re-render** — changer le mock **avant** d'appeler `rerender()` ; `rerender()` seul ne change rien.
- **Spy console** — n'espionner `console.error`/`console.warn` que si le code les appelle vraiment.

## Tests d'intégration

`*.integration.test.ts`, vraie base Postgres jetable via testcontainers, lancés par `pnpm test:integration` (exige Docker). **Obligatoires** dès qu'un changement touche le DB-layer ou du SQL non trivial : les tests unitaires mockent le driver et ratent les bugs de driver. Voir `rules/audit-logging.md`.
