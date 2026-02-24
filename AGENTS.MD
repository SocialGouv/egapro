# AGENTS.md — Monorepo egapro

> Reference for all AI agents or developers working on this repository.

---

## Monorepo structure

```
egapro/
  packages/
    app/        ← Next.js application (all active code)
    api/        ← Empty placeholder
  .github/
    workflows/  ← CI/CD GitHub Actions
```

Package manager: **pnpm workspaces** (`pnpm@10`).

---

## Convention loading rule

**If you work in `packages/app/` or on a file that depends on it, you must load and strictly follow:**

```
packages/app/AGENTS.MD
```

This file contains all package conventions: stack, module structure,
React/TypeScript rules, DSFR, accessibility, tests, environment variables, scripts.

---

## Règle absolue

Ne **jamais** créer de commit git, sauf si l'utilisateur le demande explicitement.

---

## Scripts racine utiles
## Absolute rule

Never create a git commit, unless the user explicitly requests it.

---

## Language policy

**The site is in French**, but all code must be in English:
- All comments must be in English
- All component names must be in English
- All function and variable names must be in English
- User-facing text (content, labels, buttons, links) remains in French

---

## Useful root scripts

```bash
pnpm dev:app              # starts the app in dev mode
pnpm build                # builds all packages
pnpm lint:check           # checks lint (CI)
pnpm format:check         # checks format (CI)
pnpm typecheck            # checks TypeScript types
pnpm test                 # runs all unit tests
pnpm test:e2e             # runs Playwright tests
pnpm db:migrate           # applies Drizzle migrations
pnpm db:studio            # opens Drizzle Studio
```

---

## CI

GitHub Actions workflows are in `.github/workflows/` :

| File | Trigger | Role |
|---|---|---|
| `ci.yaml` | each push | build · lint · format · typecheck · tests |
| `release.yml` | manual (branch `beta`) | semantic-release |
| `review.yaml` | PR | review app deployment |
| `preproduction.yaml` | push `beta` | preprod deployment |
| `production.yaml` | push `master` | prod deployment |
