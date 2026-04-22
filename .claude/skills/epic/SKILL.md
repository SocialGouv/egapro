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
- Filtrer : ne conserver que les tickets dont le champ `Status` = **To Do** (ignorer Backlog / In progress / In review / Done)
- Valider le graphe de dépendances (parents avant enfants, pas de cycles)

Si rien en To Do → exit avec `Nothing to dispatch on epic #<N>`.

---

# Step 1 — Worktree + port assignment

Pour chaque ticket à dispatcher, assigner :
- **Worktree** : `../egapro-epic<N>-t<ticket-id>`
- **Dev server port** : `3000 + <index>` (3001, 3002, 3003, …)

Création :

```bash
git worktree add ../egapro-epic42-t123 -b ticket/123-<slug> origin/alpha
```

Si un worktree avec ce path existe déjà (re-run d'`/epic`), le réutiliser plutôt que d'en créer un nouveau.

---

# Step 2 — Dispatch loop

Tant qu'il reste des tickets en **To Do** dont toutes les dépendances (Parent issue / Sub-issues GitHub) sont en **In review** ou **Done** :

1. **Sélectionner les N prochains tickets dispatchables** — parallélisme par défaut **N = 3**. Ajuster selon la RAM de la machine (~1–2 GB par dev server).

2. **Invoquer `code-dev` en parallèle** (un Agent tool call par ticket, dans un seul message) :
   - Model : **opus** si label `complexe`, sinon **sonnet**
   - Arguments : ticket number, worktree path, dev server port
   - `run_in_background: true` pour que `/epic` continue à orchestrer pendant l'exécution

3. **Attendre la complétion** de tous les `code-dev` lancés. Chaque retour est PASS ou REFACTO.

4. **Traiter les verdicts** :
   - **PASS** → ticket en **In review**, PR prête (`gh pr ready`). Worktree conservé pour revue utilisateur.
   - **REFACTO** → ticket retourné en **To Do** avec diagnostic. Signaler à l'utilisateur qu'une intervention `architect` est probablement nécessaire.

5. **Reboucler** sur Step 2 tant qu'il reste des tickets dispatchables.

---

# Step 3 — Report

```
## Epic #<N>: dispatch complete

PASS (In review): #N1, #N3, #N4
REFACTO (retour To Do): #N2 — <diagnostic>
Worktrees actifs: ../egapro-epic<N>-t*

Next:
1. Revoir les PR ouvertes
2. Passer manuellement les tickets In review → Done
3. Si REFACTO : re-lancer /ticket sur l'epic (phase architect) puis /epic
4. `git worktree remove ../egapro-epic<N>-t*` après merge de toutes les PR
```

---

## Notes

- **Nettoyage worktrees** : conservés après `/epic` pour la revue humaine. L'utilisateur les supprime après merge.
- **Never auto-Done** : `/epic` termine sur **In review** pour tous les tickets PASS. La transition **Done** est manuelle.
- **Parallélisme** : max 3 par défaut. Chaque dev server consomme de la RAM et des ports. Ajuster `N` si machine modeste.
- **Ordre de dispatch** : les tickets sans dépendance partent en premier. Les tickets dépendants attendent que leur parent soit **In review** (pas Done — sinon `/epic` bloquerait sur la validation humaine).
