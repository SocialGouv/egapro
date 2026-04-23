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

# Step 1 — Worktree + port + base branch

Si déjà dans un worktree assigné par `/epic` → le réutiliser (variable d'env ou chemin courant), `/epic` a déjà calculé la base branch.

Sinon (standalone), déterminer la base branch selon la section `Depends on` du body :
- Aucune dépendance → `origin/alpha`
- Toutes les dépendances en `Done` → `origin/alpha` (après `git fetch`)
- 1 dépendance en `In review` → `ticket/<parent-slug>` (stacked PR)
- 2+ dépendances en `In review` → **exit** avec message : « attendre le merge d'au moins une dépendance avant `/code` »
- 1+ dépendance en `In progress` ou `To Do` → **exit** avec message : « dépendance pas prête, attendre `/epic` »

Création :
- `git fetch origin <base-branch>`
- `git worktree add ../egapro-ticket<N> -b ticket/<N>-<slug> <base-branch>`
- Assigner le prochain port libre (check via `lsof -i :3001`, incrémenter)

---

# Step 2 — Delegate to code-dev

Invoquer l'agent `code-dev` (`.claude/agents/code-dev/AGENT.md`) avec :
- Ticket number
- Worktree path
- Dev server port
- Base branch (cf. Step 1)

Model :
- **opus** si ticket a label `complexe`
- **sonnet** sinon

L'agent :
1. Implémente le ticket
2. Passe les 4 agents existants (`validator`, `structural-auditor`, `rgaa-auditor`, `security-auditor`) en parallèle
3. Ouvre une PR draft
4. Lance `functional-validator` + `design-validator` en parallèle
5. Sur tous PASS → `gh pr ready` + ticket **In review**
6. Sur REFACTO (après 3 RETRY) → ticket **To Do** avec diagnostic

---

# Step 3 — Report

```
## Code: <PASS | REFACTO>

Ticket: #<N>
Branch: <name>
PR: #<PPP>
Status: In review | To Do

<Si PASS>
Next: utilisateur revoit la PR, merge, passe le ticket In review → Done manuellement.

<Si REFACTO>
Next: /ticket sur l'epic parent (phase architect) pour re-découper.
```

---

## Notes

- **Standalone vs /epic** : même skill, le contexte (worktree, port) peut venir de `/epic` ou être créé ici.
- **Jamais auto-Done** : terminus IA = **In review**.
- **RETRY/REFACTO** sont gérés à l'intérieur de `code-dev`, pas ici — cette skill est un fin wrapper.
