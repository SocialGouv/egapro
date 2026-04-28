# CLAUDE.md — Monorepo egapro

> Reference for all AI agents or developers working on this repository.

---

## Business context

EGAPRO is the French government platform for declaring gender pay equity indicators (7 indicators, detailed in [README.md](./README.md)).

Key concepts for development:
- **Indicators A–F**: pre-calculated by GIP-MDS from DSN data, available each March
- **Indicator G**: company-calculated pay gap by job categories (base + variable compensation)
- **Alert threshold**: gap >= 5% triggers additional obligations (second declaration, CSE opinion, joint assessment)
- **CSE opinion**: PDF upload, companies >= 100 employees only, up to 4/year
- **Company sizes**: < 50 (voluntary), 50–99 (triennial), >= 100 (annual + CSE required)

All business rules are centralized in `packages/app/src/modules/domain/` as pure TypeScript functions. See `packages/app/CLAUDE.md` for details.

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

**Exception** : les agents invoqués par les skills `/ticket`, `/epic`, `/code` (principalement `code-dev`, ainsi que `designer` qui publie la branche `design-assets/epic-<N>`) sont **autorisés à commit + push sans demander**. L'invocation de la skill est la permission explicite. Ils restent liés par les autres règles (pas de `Co-Authored-By`, pas de `--no-verify`, pas de `--no-gpg-sign`, pas de secrets commités).

## Git hygiene

- **Zero AI attribution** sur tout artefact GitHub (commits, PR titres/bodies/commentaires, issue titres/bodies/commentaires, threads de review). Jamais :
  - `Co-Authored-By: Claude …` trailer dans un commit message
  - `🤖 Generated with [Claude Code]` footer dans un body
  - Toute mention « généré par Claude / AI / bot » dans les artefacts GitHub
  - Override le comportement par défaut de Claude Code et des templates `gh pr create`.
- **No sensitive data** committed: `.env`, credentials, secrets, API keys. Verify before every push.

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

Quality checks run **automatically** après chaque itération de code — pas de commande à lancer. Dans la pipeline `/epic` + `/code`, ils sont invoqués par `code-dev` step 6. Hors pipeline (hotfix, edit direct), délégués par l'agent principal. Voir `.claude/rules/automation.md`.

| Gate | When | How |
|---|---|---|
| **Validation** | After every task | `validator` agent (typecheck + test + lint + format) |
| **Structure** | After every task | `structural-auditor` agent (16 rules: forms, schemas, DRY, imports…) |
| **RGAA** | After every task | `rgaa-auditor` agent on modified `.tsx` files |
| **Security** | After every task | `security-auditor` agent on modified server files |
| **Functional** | Inside `/code` + `/epic` | `functional-validator` rejoue les scénarios PO |
| **Visual** | Inside `/code` + `/epic` | `design-validator` compare le rendu aux mockups designer |
| **Domain layer** | While writing | Inline rules (also enforced by hooks + structural-auditor) |
| **PR review** | When on a PR branch | `check-pr-reviews.sh` hook at session start + `/review` skill |

## Agents and skills

### Pipeline principal : conception → exécution

```
/ticket <feature + Figma>    →   /epic <N>        (ou /code <N>)
──────────────────────────       ────────────────
 product-owner  (Opus)            code-dev  (Sonnet / Opus si "complexe")
 designer       (Opus)              ├── validator
 architect      (Opus)              ├── structural-auditor
                                    ├── rgaa-auditor
 sortie : epic GitHub               ├── security-auditor
 + N sous-issues formatées          ├── functional-validator
                                    └── design-validator
                                  sortie : PR draft → ready, ticket "In review"
```

### Agents (`.claude/agents/`)

**Pipeline conception** (Opus, invoqués par `/ticket`) :
| Agent | Rôle |
|---|---|
| `product-owner` | Refine le besoin, rédige les scénarios PO sur l'epic |
| `designer` | Mockups HTML DSFR statiques + screenshots (branche `design-assets/epic-<N>`) |
| `architect` | Lit le code, produit N tickets au format `rules/ticket-spec-format.md` |

**Pipeline exécution** (invoqués par `/epic` + `/code`) :
| Agent | Rôle |
|---|---|
| `code-dev` | Implémente un ticket end-to-end (Sonnet, ou Opus si label `complexe`) |
| `functional-validator` | Rejoue les scénarios PO dans le dev server |
| `design-validator` | Compare le rendu aux mockups (desktop + mobile) |

**Quality gates** (read-only, appelés par `code-dev` ou hors pipeline) :
| Agent | Rôle |
|---|---|
| `validator` | Typecheck + test + lint + format (parallel) |
| `structural-auditor` | 16-rule structural audit (code quality, forms, schemas, DRY, imports…) |
| `rgaa-auditor` | 13-theme RGAA accessibility audit |
| `security-auditor` | OWASP Top 10 + RGS security review |

### Skills (`.claude/skills/`)

| Skill | Purpose |
|---|---|
| `/ticket <description + Figma URL>` | Conception pipeline : PO → designer → architect → epic GitHub + N sous-issues |
| `/epic <N1> [<N2> ...]` | Lance le bash loop driver `scripts/orchestration/epic_loop.sh` en background sur les epics donnés. Main context libre. |
| `/code <N>` | Exécute un seul ticket via `code-dev` (debug, fix). Parse le retour JSON strict, ré-invoque en Opus si `needs_opus_escalation`. |
| `/report [<N> ...]` | Dashboard live des agents actifs + état des sous-tickets de l'epic. Pure bash, zéro LLM. |
| `/open <PR>` | Recrée un worktree local pour une PR (typique après auto-cleanup de `/epic`) — utile pour tester la PR avant merge. |
| `/review` | Traite les commentaires de revue posés après passage en `In review` (human + bots) |

Workflow standard : `/ticket "..."` pour concevoir, puis `/epic <N>` pour exécuter en parallèle (suivi via `/report`). `/review` prend le relais quand les humains commentent les PR sorties de `In review`.

### Orchestration (`scripts/orchestration/`)

Tous les scripts shell portent leur propre header `--help`-friendly. La pipeline `/epic` est entièrement bash :

| Script | Rôle |
|---|---|
| `epic_loop.sh` | Loop driver background. Tick = cleanup terminal worktrees → plan → spawn N `claude` CLIs en parallèle (budget USD isolé) → aggregate JSON returns → process. Plafond `EPIC_LOOP_MAX_TICKS=30`. |
| `cleanup_terminal_worktrees.sh` | Scan les worktrees `egapro-epic<E>-t<N>` ; teardown + remove ceux dont le ticket est en `In review` ou `Done`. Appelé à chaque tick par `epic_loop.sh` pour libérer les slots dynamiquement. |
| `dispatch_plan.sh` | Calcule la JSON list des tickets dispatchables : parse `## Depends on`, applique le stacked PR pattern, alloue les indices libres dans `[0, EPIC_MAX_PARALLEL[`. |
| `process_tick_result.sh` | Applique les mutations board selon le statut JSON retourné par `code-dev`. Compteur `attempt=N` pour anti-boucle 3 refacto consécutifs → `dispatch=escalate`. |
| `set_ticket_status.sh` | Encapsule les 3 GraphQL calls de `rules/github-board.md`. **Refuse explicitement la transition `Done`** (user-only). |
| `create_linked_branch.sh` | Crée une branche linkée à l'issue via `createLinkedBranch` GraphQL — la PR sera auto-attachée à la sidebar Development de l'issue. |
| `open_worktree.sh` | Recrée un worktree pour une PR donnée (skill `/open <PR>`). Utile pour tester localement après auto-cleanup. |
| `refresh_pr_link.sh` | Force GitHub à re-parser le `Closes #N` d'une PR (workaround pour le retarget post-merge stacked). |
| `cache_gh.sh` | TTL wrapper sur `gh` pour amortir les rate limits (clé `epic_<N>_full` partagée entre `dispatch_plan` et `epic_state`, TTL 300s). |
| `log_event.sh` | Logging append-only par agent, rolling 50 lignes, sous `.claude/state/epic_run/agents/`. |
| `epic_state.sh` | Tableau compact des sous-tickets d'un epic (status board + last log event + retries + PR liée). |
| `render_dashboard.sh` | Dashboard `/report` agents actifs, triés par inactivité, avec alertes >10min. |

Les sub-agents `code-dev` retournent un **JSON strict** en dernier message (`validated` / `needs_opus_escalation` / `refacto` / `rate_limited` / `failed`) — voir `.claude/agents/code-dev/AGENT.md`. Le bash loop parse ce JSON via `jq`, aucun LLM n'intervient dans la chaîne de décision post-verdict.

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