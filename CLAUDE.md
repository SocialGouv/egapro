# CLAUDE.md — Monorepo egapro

> Reference for all AI agents or developers working on this repository.

---

## Business context

EGAPRO is the French government platform for declaring gender pay equity indicators (7 indicators, detailed in [README.md](./README.md)).

Key concepts for development:
- **Indicators A–F**: pre-calculated by GIP-MDS from DSN data, available each March
- **Indicator G**: company-calculated pay gap by job categories (base + variable compensation)
- **Alert threshold**: gap >= 5% triggers additional obligations (second declaration, CSE opinion, joint assessment)
- **CSE opinion**: PDF upload, companies >= 100 employees only, up to 3/year

Full specs: <https://github.com/SocialGouv/egapro/wiki/Spec-V2>

---

## Monorepo structure

```
egapro/
  packages/
    app/        <- Next.js application (all active code)
    api/        <- Empty placeholder
  .github/
    workflows/  <- CI/CD GitHub Actions
```

Package manager: **pnpm workspaces** (`pnpm@10`).

---

## Convention loading rule

**If you work in `packages/app/` or on a file that depends on it, you must load and strictly follow:**

```
packages/app/CLAUDE.md
```

This file contains all package conventions: stack, module structure,
React/TypeScript rules, DSFR, accessibility, tests, environment variables, scripts.

---

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
pnpm dev:app              # starts the app in dev mode (port 3000)
pnpm build                # builds all packages
pnpm lint:check           # checks lint (CI)
pnpm format:check         # checks format (CI)
pnpm typecheck            # checks TypeScript types
pnpm test                 # runs all unit tests
pnpm test:e2e             # runs Playwright E2E tests (requires dev server on port 3000)
pnpm test:lighthouse      # runs Lighthouse CI audit (requires dev server on port 3000)
pnpm db:migrate           # applies Drizzle migrations
pnpm db:studio            # opens Drizzle Studio
```

> **Note:** `pnpm test:e2e` and `pnpm test:lighthouse` require the dev server running on port 3000 (`pnpm dev:app`).
> Lighthouse accessibility must score **100%** — it is configured as an error threshold in `.lighthouserc.json`.

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