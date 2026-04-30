---
name: code
description: "Execute a single ticket via code-dev agent. Usage: /code <N>"
---

# /code

Exécute **un seul ticket** end-to-end via l'agent `code-dev`. Utilisé seul (debug, fix manuel, re-run après RETRY) ou appelé par `/epic` dans une boucle parallèle.

## Arguments

`$ARGUMENTS` — numéro de ticket (`#123`, `123`). Obligatoire.

---

# Step 0 — Preconditions

- Vérifier que l'issue existe et a un `Parent issue` (= doit dériver d'un epic)
- Récupérer le status board du ticket (op. 3 de `rules/github-board.md`) :
  - **To Do** ou **In progress** → OK, continue
  - **In review** → demander à l'utilisateur : re-run (RETRY/REFACTO) ou exit ?
  - **Done** → exit (ne jamais rejouer un ticket Done)
  - **Backlog** → exit avec message `Ticket pas prêt, passer d'abord par /ticket`
- Vérifier que le body respecte `rules/ticket-spec-format.md`. Si non → remettre en **To Do** (op. 4, option `61e4505c`) avec commentaire listant les manques, et exit.

---

# Step 1 — Worktree + port + base branch + stack docker

Si déjà dans un worktree assigné par `/epic` → le réutiliser (`packages/app/.env.local` et stack docker déjà en place par `setup-worktree.sh`). `/epic` a déjà calculé la base branch.

Sinon (standalone), déterminer la base branch selon la section `Depends on` du body :
- Aucune dépendance → `origin/alpha`
- Toutes les dépendances en `Done` → `origin/alpha` (après `git fetch`)
- 1 dépendance en `In review` → `ticket/<parent-slug>` (stacked PR)
- 2+ dépendances en `In review` → **exit** avec message : « attendre le merge d'au moins une dépendance avant `/code` »
- 1+ dépendance en `In progress` ou `To Do` → **exit** avec message : « dépendance pas prête, attendre `/epic` »

Parser la section `## Requires services` pour détecter les services docker extras (typiquement `clamavd`).

Création :

```bash
# 1. Worktree
git fetch origin <base-branch>
git worktree add ../egapro-ticket<N> -b ticket/<N>-<slug> <base-branch>

# 2. Calculer un index unique (standalone = premier index libre, check via lsof sur les ports déjà utilisés)
#    Puis lancer la stack docker isolée pour ce worktree.
cd ../egapro-ticket<N>
scripts/setup-worktree.sh <index> [<extras>]
```

Le script écrit `packages/app/.env.local` avec les ports et URLs, lance docker-compose avec un `COMPOSE_PROJECT_NAME` unique, attend la DB, applique les migrations.

---

# Step 2 — Delegate to code-dev

Invoquer l'agent `code-dev` (`.claude/agents/code-dev/AGENT.md`) avec :
- Ticket number
- Worktree path
- Worktree index (pour setup-worktree.sh si standalone ; sinon assigné par `/epic`)
- Dev server port (`PORT` variable du `.env.local` écrit par setup-worktree.sh = `3001 + index`)
- Base branch (cf. Step 1)

Model :
- **opus** si ticket a label `complexe`
- **sonnet** sinon

L'agent :
1. Implémente le ticket
2. Passe les 4 agents existants (`validator`, `structural-auditor`, `rgaa-auditor`, `security-auditor`) en parallèle
3. Ouvre une PR draft
4. Lance `functional-validator` + `design-validator` en parallèle
5. Sur tous PASS → `gh pr ready` + ticket **In review** + retour `{"status":"validated", ...}`
6. Sur 3-retry Sonnet → retour `{"status":"needs_opus_escalation", ...}` (en standalone `/code`, **re-invoquer immédiatement** le même agent en `model: "opus"` avec les mêmes inputs)
7. Sur 3-retry Opus ou spec invalide → retour `{"status":"refacto", ...}` (ticket reste en **To Do** avec diagnostic)

---

# Step 3 — Report

L'agent `code-dev` retourne un JSON strict en dernier message. Le parser et formatter pour l'utilisateur :

| `.status` retourné | Action skill | Markdown affiché |
|---|---|---|
| `validated` | aucune (déjà In review) | `## Code: PASS` + ticket/branche/PR/status In review + next-step revue humaine |
| `needs_opus_escalation` | en standalone, re-invoquer `code-dev` en Opus avec les mêmes inputs ; afficher le verdict final | `## Code: PASS` ou `## Code: REFACTO` selon le retour Opus |
| `refacto` | aucune (le ticket est en To Do) | `## Code: REFACTO` + ticket/diagnostic/next-step `/ticket` (architect) |
| `rate_limited` | proposer de retenter dans `retry_in` secondes ou abandonner | `## Code: RATE_LIMITED` + délai suggéré |
| `failed` | propager l'erreur sans modifier le ticket | `## Code: FAILED` + raison technique |

Format affiché à l'utilisateur :

```
## Code: <PASS | REFACTO | RATE_LIMITED | FAILED>

Ticket: #<N>
Branch: <name>
PR: #<PPP>
Status: <In review | To Do | unchanged>

<Si PASS> Next: utilisateur revoit la PR, merge, passe le ticket In review → Done manuellement.
<Si REFACTO> Next: /ticket sur l'epic parent (phase architect) pour re-découper.
```

---

## Notes

- **Standalone vs /epic** : même skill, le contexte (worktree, port) peut venir de `/epic` ou être créé ici.
- **Jamais auto-Done** : terminus IA = **In review**.
- **Contrat JSON strict** : le dernier message de `code-dev` est un JSON parsable. Voir `.claude/agents/code-dev/AGENT.md` section « Format de retour ».
- **Escalade Opus en standalone** : `/code` re-invoque `code-dev` en Opus si le retour est `needs_opus_escalation`. Dans `/epic`, c'est le pipeline (`process_tick_result.sh`) qui orchestre la ré-attribution au prochain tick — `/code` n'a pas ce mécanisme et doit gérer l'escalade lui-même.
