# AGENTS.md — Monorepo egapro

> Référence pour tout agent IA ou développeur travaillant sur ce dépôt.

---

## Structure du monorepo

```
egapro/
  packages/
    app/        ← Application Next.js (tout le code actif)
    api/        ← Placeholder vide
  .github/
    workflows/  ← CI/CD GitHub Actions
```

Gestionnaire de paquets : **pnpm workspaces** (`pnpm@10`).

---

## Règle de chargement des conventions

**Si tu travailles dans `packages/app/` ou sur un fichier qui en dépend, charge et respecte impérativement :**

```
packages/app/AGENTS.MD
```

Ce fichier contient toutes les conventions du package : stack, structure des modules,
règles React/TypeScript, DSFR, accessibilité, tests, variables d'environnement, scripts.

---

## Règle absolue

Ne **jamais** créer de commit git, sauf si l'utilisateur le demande explicitement.

---

## Scripts racine utiles

```bash
pnpm dev:app              # démarre l'app en mode dev
pnpm build                # build tous les packages
pnpm lint:check           # vérifie le lint (CI)
pnpm format:check         # vérifie le format (CI)
pnpm typecheck            # vérifie les types TypeScript
pnpm test                 # lance tous les tests unitaires
pnpm test:e2e             # lance les tests Playwright
pnpm db:migrate           # applique les migrations Drizzle
pnpm db:studio            # ouvre Drizzle Studio
```

---

## CI

Les workflows GitHub Actions sont dans `.github/workflows/` :

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `ci.yaml` | chaque push | build · lint · format · typecheck · tests |
| `release.yml` | manuel (branche `beta`) | semantic-release |
| `review.yaml` | PR | déploiement review app |
| `preproduction.yaml` | push `beta` | déploiement préprod |
| `production.yaml` | push `master` | déploiement prod |
