# Migration de l'outillage IA — où est passé quoi, et la preuve qu'on n'a rien perdu

> Référence de revue pour la refonte `.claude/` + `.codex/` → `AGENTS.md` + `.agents/`. Les preuves se rejouent : voir § Rejouer les preuves.

## 1. Qui lit quoi

| | Claude Code | OpenCode | Codex |
|---|---|---|---|
| Instructions | `CLAUDE.md` → `@AGENTS.md` | `AGENTS.md` + `opencode.json` `instructions` | `AGENTS.md` |
| Skills | `.claude/skills` → symlink `.agents/skills` | `.agents/skills` | `.agents/skills` |
| MCP | `.mcp.json` *(généré)* | `opencode.json` `mcp` *(généré)* | `.codex/config.toml` *(généré)* |
| ultra11y (gate + skills `review-a11y`, `ultra11y`) | plugin `ultra11y@ultra11y` (`.claude/settings.json`) | plugin dans `opencode.json`, chargé depuis la devDependency | `ultra11y install --codex` (portée utilisateur, seule supportée) |
| Garde-fous mécaniques | git pre-commit (`lefthook.yml`) · `pnpm verify` · CI — **identiques pour tous, y compris un humain** | ← | ← |

Source unique de chaque chose : `AGENTS.md` (instructions), `.agents/skills/` (workflows + règles), `.agents/mcp.json` (serveurs MCP, `node scripts/ai/sync-agent-config.mjs` génère les trois fichiers, la CI refuse une dérive), `scripts/quality/check-patterns.sh` (interdits mécaniques). Les fichiers propres à un outil ne contiennent que ce qu'aucun standard ne couvre.

## 2. Correspondance ancien → nouveau

### Instructions

| Ancien | Nouveau |
|---|---|
| `CLAUDE.md` | `AGENTS.md` (CLAUDE.md = `@AGENTS.md`) |
| `packages/app/CLAUDE.md` | `packages/app/AGENTS.md` (CLAUDE.md = `@AGENTS.md`) |
| `CODEX.md`, `packages/app/CODEX.md` | supprimés — copie anglaise périmée de CLAUDE.md (8 gates au lieu de 4, Lighthouse en erreur, CI fausse) |
| `.codex/skills/*` (6 renvois vers `.claude/skills`) | supprimés — Codex lit `.agents/skills` |

### Règles (`.claude/rules/`, chargées par `paths:` — dont les globs ne matchaient pas depuis la racine)

| Ancien | Nouveau |
|---|---|
| `code-quality.md`, `react-components.md`, `styling-dsfr.md`, `trpc-api.md`, `database-drizzle.md`, `demarche-state-machine.md`, `testing.md` | `.agents/skills/implement/references/conventions/<même nom>` |
| `figma-workflow.md` | `implement/references/conventions/figma.md` |
| `audit-logging.md` | règle + checklist → `implement/references/conventions/audit-logging.md` ; inventaire des routes, colonnes conservées, miroir stdout → `docs/audit-logging-inventaire.md` |
| `bug-fix-workflow.md` | analyse → `analyze/references/bug-analysis.md` ; correctif → `implement/references/bug-fix.md` |
| `e2e.md` | `implement/references/e2e.md` |
| `visual-quality-validation.md` | `review/references/design-fidelity.md` |
| `rgaa.md` | principe + dispositif → `AGENTS.md` § Accessibilité ; versions, couches, revue → `review/references/a11y.md` |
| `git-artefact-hygiene.md` | `AGENTS.md` § Hygiène git (intégral, toujours chargé) ; filtre secrets avant post → aussi `review/references/pr-comments.md` |
| `automation.md` | `AGENTS.md` § Garde-fous (hooks → git + `pnpm verify` + CI ; 4 gates → `/review gates`) |

### Agents (`.claude/agents/`) → références lues par le modèle de la session

| Ancien agent | Nouveau |
|---|---|
| `product-owner` | `analyze/references/product-owner.md` |
| `architect` | `analyze/references/architect.md` |
| `bug-analyst` | `analyze/references/bug-analysis.md` |
| `architect-rework` | `analyze/references/rework.md` (mode `/analyze <epic> rework`) |
| `code-dev` | `implement/SKILL.md` + `implement/references/workflow.md` |
| `e2e-dev` | `implement/references/e2e.md` (étape 8 d'`/implement`, plus d'agent séparé) |
| `validator` | `pnpm verify` (`scripts/quality/verify.sh`) |
| `structural-auditor` | `review/references/structural.md` |
| `security-auditor` | `review/references/security.md` |
| `rgaa-auditor` | `review/references/a11y.md` (lance le skill ultra11y `review-a11y`, sinon la voie CLI) |
| `design-validator` | `review/references/design-fidelity.md` |
| `functional-validator` | `review/references/functional.md` |
| `review-fixer` | `review/SKILL.md` mode `pr` + `review/references/pr-comments.md` |
| `doc-writer` | supprimé avec `/doc` |

### Skills

| Ancien | Nouveau |
|---|---|
| `/analyse` | `/analyze` |
| `/implement` (loop epic en tâche de fond) | `/implement` (un ticket par session ; epic → `implement/references/epic.md`) |
| `/review` | `/review <PR>` (mode `pr`) + `/review gates` (nouveau : les 4 gates + design + fonctionnel) |
| `/doc`, `/open`, `/report`, `/velocity`, `/plan-sprint` | supprimés (demande explicite) |

### Pipeline (`.claude/pipeline/`)

| Ancien | Nouveau |
|---|---|
| `board.md` | `analyze/references/board.md` |
| `ticket-spec-format.md` | `analyze/references/ticket-spec-format.md` |
| `complexity-estimation.md` | `analyze/references/complexity-estimation.md` |
| `orchestration.md`, `README.md` | supprimés — décrivaient la loop |

### Hooks (`.claude/hooks/`, Claude Code uniquement)

| Ancien | Nouveau |
|---|---|
| `block-bad-patterns.sh` (avant chaque Edit/Write de Claude) | `scripts/quality/check-patterns.sh` : pre-commit, `pnpm verify`, CI. **Parité prouvée** (§ 3) |
| `auto-lint.sh` (biome après chaque édition) | pre-commit `biome check --write` sur les fichiers indexés (+ `pnpm verify`) |
| `check-pr-reviews.sh` (comptait les *états* de review) | `/review <PR>` lit les **threads non résolus** (GraphQL `reviewThreads`) |
| `check-ultra11y-plugin.sh` | étape 1 de `review/references/a11y.md` ; le gating ne dépend plus du plugin |

### Scripts (`scripts/orchestration/`)

Supprimés (loop) : `epic_loop`, `dispatch_plan`, `process_tick_result`, `run_e2e_dev` (+ test), `run_architect_rework`, `run_doc_writer`, `agent_status`, `agent_drilldown`, `epic_state`, `render_dashboard`, `compute_cost`, `log_event`, `cache_gh`, `cleanup_terminal_worktrees`, `open_worktree`, `plan_sprint`, `sprint_velocity`, `backfill_ticket_dates`, `refresh_pr_link`, `e2e_port_pool` (+ test, ne servait que `run_e2e_dev`). Gardés, comportement inchangé : ceux qu'appellent les skills ou la CI (`set_ticket_*`, `create_linked_branch`, `ensure_epic_branch`, `merge_validated_ticket`, `rebase_epic_branch`, `open_epic_final_pr`, `force_pr_issue_link`, `wait_for_bot_reviews`, `check_review_replies`, `grille_scope`). Seul changement de comportement : le label `dispatch=escalate`, sans plus aucun lecteur, n'est plus posé.

## 3. Preuves de non-régression

### 3.1 Interdits mécaniques — parité exacte avec l'ancien hook

`scripts/ai/migration-parity.sh` rejoue l'ancien `block-bad-patterns.sh` (lu dans l'historique git) et `check-patterns.sh` sur les mêmes entrées :

| Corpus | Entrées | Bloquées par l'ancien hook | Écarts de verdict |
|---|---:|---:|---:|
| lignes ajoutées des 300 derniers commits d'`alpha` (commit × fichier) | 3 291 | 26 | **0** |
| fixtures de règles (chaque interdit + ses exclusions) | 35 | — | **0** |

Les 26 entrées bloquées sont **arrivées dans `alpha` quand même** : l'ancien hook ne voyait que les éditions faites par Claude Code. Le pre-commit et la CI ferment ce trou pour tout auteur.

### 3.2 Contenu — où est passée chaque ligne

`scripts/ai/migration-coverage.mjs` classe les **1 864 lignes porteuses de sens** (≥ 6 mots) des 44 anciens fichiers (règles, agents, pipeline, skills, CLAUDE.md). Les lignes non retrouvées automatiquement ont ensuite été **jugées une à une** (trois revues indépendantes : côté analyze, implement, review) :

| Statut | Lignes | Part |
|---|---:|---:|
| retrouvées verbatim | 499 | 27 % |
| reformulées (≥ 60 % des mots distinctifs) | 328 | 18 % |
| présentes ailleurs — traduites EN → FR ou déplacées (jugement, avec `fichier:ligne`) | 517 | 28 % |
| **retirées volontairement** (loop, contrats JSON, modèles/effort, skills supprimés, en-têtes de chargement `paths:`) | 499 | 27 % |
| **perdues → restaurées** | 21 | 1 % |
| perdues non restaurées | **0** | 0 % |

Les règles de code (`code-quality`, `audit-logging`, `testing`, `styling-dsfr`, `react-components`, `trpc-api`, `database-drizzle`, `demarche-state-machine`, `figma`) et `packages/app/CLAUDE.md` sont conservées à 92–100 % **verbatim**.

Les 21 restaurations (toutes relues) :

| Origine | Restauré dans |
|---|---|
| `code-dev` — corriger le body si `force_pr_issue_link.sh` échoue (« Closes keyword missing ») | `implement/references/workflow.md` § PR |
| `code-dev` — remplacer `<PR>` avant d'exécuter (redirection shell) | `workflow.md` § CI |
| `code-dev` — Sonar : bugs, vulnérabilités, hotspots non revus bloquent ; attendre « Quality Gate: Passed » avant `gh pr ready` | `workflow.md` § CI |
| `code-dev` — après un push pendant le cycle bots, re-attendre CI + Sonar ; lire aussi l'endpoint `/reviews` | `workflow.md` § CI |
| `e2e-dev` — consigner la réponse `grille_scope.sh` et ses fichiers dans le body, même en `none` | `implement/references/e2e.md` |
| `e2e-dev` — détails d'échec dans `packages/app/test-results/` (`trace: "retain-on-failure"`) | `e2e.md` |
| `visual-quality-validation` — pourquoi les contrats de fidélité (un `degraded` a laissé partir un écran jamais rendu, #3576) | `review/references/design-fidelity.md` § 8 |
| ancien `/implement` — `ensure_epic_branch.sh <parent>` avant un sous-ticket | `implement/SKILL.md` étape 2 |
| ancien `/implement` — `git pull --ff-only` d'`epic/<N>` avant l'E2E finale | `implement/references/epic.md` |
| `orchestration.md` — l'E2E CI ne tourne pas sur une PR de sous-ticket (base `epic/<N>`) | `e2e.md` étape 3 |
| ancien `/review` — choix d'un index de worktree libre (0–9, port `3001 + i`) | `review/SKILL.md` mode pr |
| `rgaa-auditor` — installer le plugin s'il manque | `review/references/a11y.md` étape 1 |
| `rgaa.md` — ce que `a11y-lite` ne voit pas (backlog existant, fichiers globaux → `sample.global`) | `a11y.md` étape 2 |
| `check-pr-reviews.sh` — signaler une PR aux threads non résolus en début de session | `AGENTS.md` § Workflows |
| `auto-lint.sh` — `pnpm check:write` pour corriger format/lint d'un coup | `implement/SKILL.md` étape 5 |
| `architect` — exemple de flux indépendants parallélisables | `analyze/references/architect.md` |
| `architect-rework` — lire aussi le scénario `.e2e.ts` en échec | `analyze/references/rework.md` |
| `bug-analyst` — motif de namespace des review apps ; preprod à namespace fixe | `analyze/references/bug-analysis.md` § 2b |
| `bug-analyst` — URL d'une review app | `bug-analysis.md` § 2b |
| `board.md` — End date : exclusions, droit `organization_projects: write` (token App), rejeu `workflow_dispatch` | `analyze/references/board.md` |
| `board.md` — IDs des options Size ; IDs à mettre à jour dans `set_ticket_*.sh` si le board est recréé | `board.md` |

> Limite honnête : la colonne « présentes ailleurs » et les « retirées volontairement » reposent sur un jugement (chaque cas cite sa destination), pas sur une égalité de texte. Le rapport complet — chaque ligne absente avec son `fichier:ligne` d'origine — se régénère avec la commande du § 5.

### 3.3 Comportement

- `pnpm verify` vert sur la branche (patterns, config agents, a11y, lint, format, typecheck, 9 361 tests).
- Pre-commit testé : bloque un `any` (biome + patterns), un bouton sans intitulé (RGAA 7.1) et un lien vide (6.2).
- OpenCode 2.2.5 + **DeepSeek** (modèle non frontier) : charge `AGENTS.md` + `packages/app/AGENTS.md`, les skills, les MCP `ultra11y` (16 outils) et `playwright` (25), le plugin ultra11y depuis la devDependency. Sur un fichier piège, `/review gates` a rendu **NEEDS WORK** avec les deux défauts que la machine ne voit pas : seuil CSE `>= 100` réécrit au lieu d'`isCseRequired()`, lien « Cliquez ici » (RGAA 6.1) — plus un lien mort, un export de barrel manquant et un test manquant.
- Claude Code : découvre les skills via le symlink `.claude/skills` (vérifié sur un dépôt témoin).

## 4. Retiré volontairement

- La loop epic headless et tout ce qui la servait (ticks, dispatch, budgets, journaux, dashboard, coûts, escalade auto de modèle, labels `attempt=N` / `dispatch=escalate`).
- Les contrats de retour JSON entre scripts et agents, les notes `model:` / `effort:`.
- Les skills `/doc`, `/open`, `/report`, `/velocity`, `/plan-sprint` et l'agent `doc-writer`.
- Le partage « `code-dev` n'écrit jamais d'E2E » : l'E2E s'écrit en fin d'`/implement`, dans la même session.

## 5. Rejouer les preuves

```bash
bash scripts/ai/migration-parity.sh origin/alpha 300     # ancien hook vs check-patterns.sh, verdict par verdict
node scripts/ai/migration-coverage.mjs <ref-avant-migration> --out /tmp/coverage.md   # ligne à ligne, où est passé l'ancien corpus
bash scripts/quality/check-patterns.sh --self-test       # chaque règle bloque sa fixture
node scripts/ai/sync-agent-config.mjs --check            # les 3 configs MCP = .agents/mcp.json
pnpm verify                                              # tous les gates locaux
```

`<ref-avant-migration>` : `origin/alpha` tant que la PR n'est pas mergée, puis le commit parent du merge.
