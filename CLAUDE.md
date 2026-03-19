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

## MCP Servers (`.mcp.json`)

Three MCP servers are configured and **must be used** in the relevant contexts:

| Server | When to use | Key tools |
|---|---|---|
| `next-devtools` | Debugging, runtime errors, route inspection, Next.js docs | `nextjs_index`, `nextjs_call`, `nextjs_docs`, `browser_eval` |
| `dsfr` | Before writing any DSFR HTML | `get_component_doc`, `search_components`, `get_color_tokens` |
| `figma` | When implementing from a Figma design | `get_design_context`, `get_screenshot` |

**Next.js DevTools** is particularly important: use `nextjs_docs` to look up Next.js APIs (never guess from memory), and use `nextjs_call(get_errors)` to check runtime/compilation errors after changes.

See `packages/app/CLAUDE.md` for detailed usage instructions per MCP server.

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

## Automatic quality gates

Quality checks run **automatically** after every code change — no command needed. See `.claude/rules/automation.md` for full details.

| Gate | When | How |
|---|---|---|
| **Validation** | After every task | 3 parallel agents: `pnpm typecheck` + `pnpm test` + `pnpm lint:check && format:check` |
| **RGAA** | **After every task** | Delegate to `rgaa-auditor` agent on all created/modified files |
| **Security** | **After every task** | Delegate to `security-auditor` agent on all created/modified files |
| **PR review** | When on a PR branch | Auto-fetch unresolved comments before starting work |

## Parallelized workflow for multi-page tasks

When creating multiple pages/screens, follow this 4-phase approach:

| Phase | Strategy | Details |
|---|---|---|
| 1. Analysis | **Parallel** | Launch one Explore agent per page (Figma analysis, DSFR components, data needs) |
| 2. Shared code | **Sequential** | DB schema, shared types, shared components, tRPC procedures |
| 3. Pages | **Parallel** | One agent per page (with `isolation: "worktree"` for git isolation) |
| 4. Quality | **Parallel** | Automatic via quality gates above |

## Agents and skills

### Agents (`.claude/agents/`) — specialized sub-agents, delegated automatically

| Agent | Role | Triggered by |
|---|---|---|
| `code-reviewer` | 21-point code quality checklist | `/review-pr`, PR gate |
| `rgaa-auditor` | 13-theme RGAA accessibility audit | `/audit-rgaa`, RGAA gate |
| `security-auditor` | OWASP Top 10 + RGS security review | `/audit-secu`, security gate |

### Skills (`.claude/skills/`) — manual overrides via `/command`

| Skill | Purpose |
|---|---|
| `/validate` | Force run all quality checks (3 parallel agents) |
| `/review-pr` | Deep PR review: GH comments + code-reviewer + RGAA + security + auto-fix |
| `/audit-rgaa` | Deep 13-theme RGAA audit with detailed report + auto-fix |
| `/audit-secu` | Deep OWASP + RGS security audit with detailed report + auto-fix |
| `/create-page` | Create pages from Figma (4-phase parallelized workflow) |
| `/process-issue` | Process a GitHub issue (parent + sub-issues) with mandatory quality gates |
| `/verify-feature` | Post-feature completeness audit — loops until zero issues (forms, schemas, code quality) |

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