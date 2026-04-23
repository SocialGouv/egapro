---
name: epic
description: "Execute an epic: parallel worktrees, code-dev + validators, loop until In review. Usage: /epic <N>"
---

# /epic

Dispatche les sous-issues d'un epic sur plusieurs worktrees en parallèle, invoque `code-dev` + validators, boucle jusqu'à ce que tous les tickets soient **In review** (= terminus IA) ou bloqués en REFACTO.

**Ne passe jamais de ticket en `Done`** — seul l'utilisateur le fait après revue humaine de la PR.

## Arguments

`$ARGUMENTS` — numéro d'epic (`#42`, `42`). Obligatoire.

---

# Step 0 — Preconditions

- Vérifier que l'issue existe et a le label `Epic`
- Fetcher ses sous-issues avec leur statut board — utiliser le snippet op. 5 de `rules/github-board.md`
- **Parser la section `Depends on`** du body de chaque sub-issue pour construire le DAG de dépendances inter-tickets (regex : extraire les `#<N>` listés dans la section).
- Valider le DAG : pas de cycles. Si cycle détecté → exit avec diagnostic.
- Filtrer les tickets dispatchables = en **To Do** (ignorer Backlog / In progress / In review / Done).

Si aucun ticket dispatchable → exit avec `Nothing to dispatch on epic #<N>`.

---

# Step 1 — Worktree + port + base branch + stack docker

Pour chaque ticket à dispatcher, déterminer :

- **Index du worktree** (0, 1, 2, …) — drive tous les ports et le namespace docker
- **Worktree path** : `../egapro-epic<N>-t<ticket-id>`
- **Base branch** selon l'état de ses dépendances (stacked PR pattern) :

  | État des dépendances | Base branch |
  |---|---|
  | Aucune dépendance | `origin/alpha` |
  | Toutes `Done` (PR mergées) | `origin/alpha` (après `git fetch`) |
  | Exactement 1 en `In review` (PR non mergée) | `ticket/<parent-slug>` (branche de cette dépendance) |
  | 2+ en `In review` | **ne pas dispatcher** — attendre qu'au moins une soit mergée (partial blocking v1) |
  | 1+ en `In progress` ou `To Do` | **ne pas dispatcher** — attendre que la dépendance arrive en `In review` au minimum |

- **Services docker extras** : parser la section `## Requires services` du body du ticket. Typiquement `clamavd` pour les tickets qui touchent à l'upload (lourd, ~1 GB RAM, donc opt-in uniquement).

**Création** :

```bash
# 1. Worktree
git fetch origin <base-branch>
git worktree add ../egapro-epic42-t123 -b ticket/123-<slug> <base-branch>

# 2. Stack docker-compose isolée (DB + MinIO + Maildev + Valkey + éventuellement ClamAV)
#    Le script écrit packages/app/.env.local avec les ports calculés depuis l'index
#    et lance docker compose avec un COMPOSE_PROJECT_NAME unique.
cd ../egapro-epic42-t123
scripts/setup-worktree.sh <index> [<extras>]
```

Si un worktree avec ce path existe déjà (re-run d'`/epic`), le réutiliser et **ne pas re-lancer setup-worktree.sh** (`packages/app/.env.local` déjà présent).

## Parallélisme — hard cap

**Maximum 5 tickets en parallèle** par défaut, configurable via `EPIC_MAX_PARALLEL` (minimum 1, maximum 5).

Justification du cap :
- Chaque worktree = ~1.2 GB de containers docker (Postgres + MinIO + Maildev + Valkey ; +1 GB si ClamAV) + ~1.5–2 GB de dev server Next.js
- Au-delà de 3, les rate limits API (Claude tokens/min, GitHub 5000 req/h) commencent à être un souci
- Une machine 16 GB RAM supporte confortablement 3 worktrees complets

---

# Step 2 — Dispatch loop

Tant qu'il reste des tickets en **To Do** dispatchables (toutes dépendances résolues selon le tableau de Step 1) :

1. **Sélectionner les N prochains tickets dispatchables** — `N = min(EPIC_MAX_PARALLEL, tickets_restants)`, plafonné à **5** par défaut.

2. **Invoquer `code-dev` en parallèle** (un Agent tool call par ticket, dans un seul message) :
   - Model : **opus** si label `complexe`, sinon **sonnet**
   - Arguments : ticket number, worktree path, **worktree index** (pour que code-dev passe au setup-worktree.sh), dev server port, base branch
   - `run_in_background: true` pour que `/epic` continue à orchestrer pendant l'exécution

3. **Attendre la complétion** de tous les `code-dev` lancés. Chaque retour est PASS ou REFACTO.

4. **Traiter les verdicts** :
   - **PASS** → ticket en **In review**, PR prête (`gh pr ready`). Worktree conservé pour revue utilisateur. Les tickets qui dépendaient de celui-ci deviennent **dispatchables** en stacked (leur base branch = la branche de ce ticket).
   - **REFACTO** → ticket retourné en **To Do** avec diagnostic. Signaler à l'utilisateur qu'une intervention `architect` est probablement nécessaire. **Tous les tickets qui en dépendent restent bloqués** jusqu'à résolution.

5. **Reboucler** sur Step 2 tant qu'il reste des tickets dispatchables.

**Fin de boucle** — il peut rester des tickets en To Do dont les dépendances ne sont ni `In review` ni `Done` (ex : dépendances multiples toutes encore en flight). Dans ce cas, sortir proprement du loop et signaler à l'utilisateur que certains tickets attendent le merge humain d'une de leurs dépendances.

---

# Step 3 — Report

```
## Epic #<N>: dispatch complete

PASS (In review):
  - #N1 (PR #101, base: origin/alpha)
  - #N3 (PR #103, base: ticket/N1-slug ← stacked)
  - #N4 (PR #104, base: ticket/N3-slug ← stacked)
REFACTO (retour To Do): #N2 — <diagnostic>
Bloqués (en attente merge humain) : #N5 (dépend de #N3 merged)
Worktrees actifs: ../egapro-epic<N>-t* (stacks docker toujours up)

Next:
1. Revoir et merger les PR dans l'ordre du stack (#101 → #103 → #104)
2. Les PR dépendantes seront auto-retargettées par GitHub vers `alpha` après chaque merge
3. Passer manuellement les tickets In review → Done
4. Si REFACTO : re-lancer /ticket sur l'epic (phase architect) puis /epic
5. Après merge de chaque PR, dans le worktree associé :
   - `scripts/teardown-worktree.sh` (arrête containers + drop volumes)
   - `git worktree remove ../egapro-epic<N>-tXXX`
```

---

## Notes

- **Nettoyage worktrees** : conservés après `/epic` pour la revue humaine. L'utilisateur les supprime après merge.
- **Never auto-Done** : `/epic` termine sur **In review** pour tous les tickets PASS. La transition **Done** est manuelle.
- **Parallélisme** : max 3 par défaut. Chaque dev server consomme de la RAM et des ports. Ajuster `N` si machine modeste.
- **Stacked PR pattern** : un ticket dépendant part immédiatement dès que son parent est **In review** (PR prête, pas encore mergée). Sa PR est ouverte avec `--base ticket/<parent-slug>`. GitHub retargette automatiquement vers `alpha` quand le parent est mergé. Évite le blocage sur la validation humaine.
- **Ordre de merge humain** : critique. Merger les PR **dans l'ordre du stack** (parent avant enfant). Merger un enfant avant son parent casse l'historique. `/epic` le rappelle dans le report final.
- **Multi-dépendances non mergées** (v1) : partial blocking — attendre qu'au moins une dépendance soit mergée avant de dispatcher le ticket. v2 future : merge commits croisés si besoin.
