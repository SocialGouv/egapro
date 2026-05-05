---
name: implement
description: "Phase exécution. Détecte le mode (epic/task/bug) selon le type d'issue et lance le bon mécanisme : loop driver background pour epic, code-dev synchrone pour task/bug. Usage: /implement <issue#>"
---

# /implement

**Phase exécution** de la pipeline. Détecte le mode depuis le type d'issue et branche :

| Type d'issue | Mode | Mécanisme |
|---|---|---|
| `Feature` (epic) | epic | `nohup bash scripts/orchestration/epic_loop.sh <N> > /tmp/epic_loop_<KEY>.log 2>&1 &` (background, parallèle, plusieurs sub-tickets) |
| `Task` | task | Invoque `code-dev` agent en **foreground synchrone** sur l'issue |
| `Bug` | bug | Invoque `code-dev` agent en **foreground synchrone** avec `rules/bug-fix-workflow.md` |
| sub-issue d'un epic (non-feature) | task-debug | Comme `task` — utile pour re-rouler un sous-ticket d'un epic plus large (ex: après `refacto` ou debug) |

`/implement` n'orchestre rien lui-même : pour epic c'est `epic_loop.sh` qui parallèlise, pour task/bug c'est l'agent `code-dev` qui exécute.

---

## Step 0 — Valider l'argument

`$ARGUMENTS` doit contenir un numéro d'issue. Si vide → demander à l'utilisateur lequel exécuter.

```bash
ARG_HEAD="$(echo "$ARGUMENTS" | awk '{print $1}')"
ISSUE_N="${ARG_HEAD#\#}"

# Récupérer le type + parent eventuel
gh issue view "$ISSUE_N" --json number,title,issueType,labels,state \
  --jq '{number, title, issueType: .issueType.name, labels: [.labels[].name], state}'
```

Si `state != OPEN` → avertir et demander confirmation pour continuer.

## Step 1 — Vérifier que l'analyse a été faite

Avant tout dispatch, vérifier qu'un agent conception est passé sur l'issue (sinon `code-dev` n'aura pas de spec à exécuter).

| Type | Marqueur attendu |
|---|---|
| `Feature` (epic) | `subIssues.totalCount > 0` ET commentaire `## Analyse PO` sur l'epic |
| `Task` | Commentaire `## Analyse architecte` sur l'issue |
| `Bug` | Commentaire `## Analyse du bug` sur l'issue |

```bash
# Pour Task ou Bug : check du commentaire d'analyse
HEADER=$(case "$TYPE" in
  Task) echo "## Analyse architecte" ;;
  Bug)  echo "## Analyse du bug" ;;
esac)

if [ -n "$HEADER" ]; then
    HAS_ANALYSE=$(gh issue view "$ISSUE_N" --json comments \
      --jq "[.comments[] | select(.body | startswith(\"$HEADER\"))] | length")
    if [ "$HAS_ANALYSE" -eq 0 ]; then
        echo "Aucune analyse trouvée sur ce ticket. Lancer '/analyse $ISSUE_N' d'abord ?"
        exit 0
    fi
fi
```

Pour les epics, vérifier `subIssues.totalCount > 0` via GraphQL (snippet 5 de `rules/github-board.md`).

## Step 2 — Dispatcher selon le mode

### Mode epic — bash loop driver background

Workflow identique à l'ex-`/epic` :

1. Vérifier qu'aucun loop driver ne tourne déjà sur cet epic :
   ```bash
   EPICS="$ISSUE_N"
   EPICS_KEY=$(echo "$EPICS" | tr ' ' '_')
   pgrep -af "epic_loop.sh.*${EPICS_KEY}" | head
   ```
   Si oui : avertir, proposer (a) attendre via `/report`, (b) `pkill -f "epic_loop.sh.*${EPICS_KEY}"` puis relancer, (c) annuler.

2. Lancer le bash loop driver en background :
   ```bash
   LOG_FILE="/tmp/epic_loop_${EPICS_KEY}.log"
   nohup bash scripts/orchestration/epic_loop.sh $EPICS > "$LOG_FILE" 2>&1 &
   PID=$!
   disown
   echo "epic_loop lancé en background (PID $PID, log: $LOG_FILE). Suivi via /report."
   ```

3. Rendre la main immédiatement (pas de polling — utiliser `/report`).

### Mode task ou bug — code-dev synchrone foreground

Pour un single ticket (Task, Bug, ou sub-issue d'epic dispatchée manuellement), le pipeline parallèle est overkill. On invoque `code-dev` directement, en foreground, avec un worktree dédié :

1. **Worktree + stack docker** :
   - Identifier la base branch :
     - **Sub-issue d'un epic** → `origin/epic/<EPIC_N>`. Si la branche n'existe pas encore : `bash scripts/orchestration/ensure_epic_branch.sh <EPIC_N>`.
     - **Task ou Bug standalone** (pas de parent epic) → `origin/alpha` direct.
   - Picker un index libre dans `[0, EPIC_MAX_PARALLEL[` (`lsof` sur les ports 3001–3005).
   - `git worktree add` + `scripts/setup-worktree.sh <index> [<extras>]` (parser `## Requires services` du ticket pour les extras).

2. **Branche linkée à l'issue** :
   ```bash
   bash scripts/orchestration/create_linked_branch.sh "$ISSUE_N" "$BASE_BRANCH"
   ```

3. **Status board** : `set_ticket_status.sh "$ISSUE_N" "In progress"`.

4. **Invoquer `code-dev`** en foreground via le subagent :
   - Inputs : ticket number, worktree path, worktree index, base branch (sans préfixe `origin/`), working branch.
   - Si label `complexe` → model `opus`, sinon `sonnet`.
   - L'agent suit `code-dev/AGENT.md` : implémente, push, ouvre PR draft, force PR↔issue link, fait passer les 4 quality gates + `functional-validator`, `gh pr ready`, retourne JSON. **Le ticket reste en `In progress`** — les transitions `In review` et `Done` sont user-only.

5. **Parser le JSON retourné** :

   | `.status` | Action skill | Markdown affiché |
   |---|---|---|
   | `validated` | aucune (ticket reste In progress, l'utilisateur le bouge à In review à son rythme) | `## Code: PASS` + ticket/branche/PR + next-step revue humaine |
   | `needs_opus_escalation` | re-invoquer immédiatement `code-dev` en `model: "opus"` avec les mêmes inputs ; afficher le verdict final | `## Code: PASS` ou `## Code: REFACTO` selon le retour Opus |
   | `refacto` | aucune (le ticket est en To Do) | `## Code: REFACTO` + diagnostic + next-step `/analyse <N>` (re-spec) |
   | `rate_limited` | proposer de retenter dans `retry_in` secondes ou abandonner | `## Code: RATE_LIMITED` + délai suggéré |
   | `failed` | propager l'erreur sans modifier le ticket | `## Code: FAILED` + raison technique |

6. **Pour les sub-issues d'epic validées en mode synchrone** : `process_tick_result.sh` n'est pas appelé (c'est un mécanisme du loop driver). Le squash-merge de la PR validée dans `epic/<N>` peut être déclenché manuellement :
   ```bash
   bash scripts/orchestration/merge_validated_ticket.sh "$PR_N" "$EPIC_N" "$ISSUE_N"
   ```
   À déclencher seulement si l'utilisateur veut que les enfants suivants se débloquent. Pour une Task / Bug standalone, pas de squash-merge auto — l'humain merge la PR sur `alpha` à la review.

---

## Suivi de la progression (mode epic)

- `/report` — dashboard live agents actifs + état du board
- `/report <N>` — état détaillé des sous-tickets de l'epic
- `tail -f /tmp/epic_loop_<EPICS_KEY>.log`
- `ls .claude/state/epic_run/ticks/<EPICS_KEY>/` — JSON des ticks (plan + result + agent returns)

### Codes de sortie du script (mode epic)

| Exit | Signification | Action user |
|---|---|---|
| 0 | Tous les sub-tickets squash-mergés dans `epic/<N>` (= leurs branches `ticket/*` supprimées sur origin), final epic PR ouverte | Review + merge la PR finale `epic/<N> → alpha` |
| 1 | Erreur technique (claude CLI, plan malformé, fetch raté) | Voir log + `tick_<N>_agent_*.json` |
| 2 | `dispatch=escalate` posé (3 refacto consécutifs ou conflit rebase epic branch) | Lire les commentaires → orienter / re-spec, retirer le label, relancer |
| 3 | `EPIC_LOOP_MAX_TICKS` (30 par défaut) atteint sans converger | Inspecter pourquoi des tickets ne progressent pas |

### Si le loop est toujours actif

```bash
pkill -f "epic_loop.sh.*<EPICS_KEY>"
```

Pour reprendre : relancer `/implement <N>` — le script est idempotent (worktrees existants réutilisés, tickets dont la branche est gone sont skippés par `dispatch_plan`).

---

## Configuration (env vars, défauts)

| Variable | Défaut | Effet |
|---|---|---|
| `EPIC_MAX_PARALLEL` | 5 | Worktrees max en parallèle (range 1–5). |
| `EPIC_LOOP_MAX_TICKS` | 30 | Plafond sécuritaire. |
| `EPIC_LOOP_SLEEP_TICK` | 5 | Sleep entre 2 ticks (sec). |
| `EPIC_LOOP_SLEEP_WAIT` | 30 | Sleep quand le plan est vide mais des tickets sont en flight. |
| `EPIC_LOOP_BUDGET_SONNET` | 10 | Budget USD max par sub-agent Sonnet (`claude --max-budget-usd`). |
| `EPIC_LOOP_BUDGET_OPUS` | 40 | Budget USD max par sub-agent Opus. |
| `EPIC_LOOP_AGENT_TIMEOUT` | 5400 | Timeout dur par sub-agent en sec (90 min). |

```bash
EPIC_LOOP_BUDGET_OPUS=80 /implement 42
```

---

## Anti-boucle (mode epic)

`process_tick_result.sh` track un compteur d'échecs consécutifs via les labels `attempt=1`, `attempt=2`, `attempt=3` :

- 1ᵉʳ `refacto` → `attempt=1`, re-Todo, re-dispatch
- 2ᵉ → `attempt=2`, re-Todo, re-dispatch
- 3ᵉ → `attempt=3` + `dispatch=escalate` → `dispatch_plan.sh` ne dispatchera plus le ticket. Le loop driver exit code 2.

L'utilisateur retire `dispatch=escalate` (et `attempt=3`) après orientation pour relancer.

---

## Règles

- **NE JAMAIS** dupliquer la logique d'orchestration ici — tout est dans `scripts/orchestration/`
- **NE PAS** attendre le retour du loop driver en mode epic (`nohup ... &; disown`)
- **NE PAS** poll l'état — utiliser `/report`
- **En mode task/bug**, c'est synchrone : tu invoques `code-dev` et tu attends le JSON final, comme l'ancien `/code`
- Avant tout dispatch : check **analyse présente** (cf. Step 1) ; sinon proposer `/analyse <N>` et exit

---

## Référence

- Loop driver : `scripts/orchestration/epic_loop.sh`
- Branche d'intégration (NEW mode) : `scripts/orchestration/{ensure_epic_branch,merge_validated_ticket,rebase_epic_branch,open_epic_final_pr}.sh`
- Computation du plan : `scripts/orchestration/dispatch_plan.sh`
- Mutations board : `scripts/orchestration/process_tick_result.sh`
- Helpers : `scripts/orchestration/{cache_gh,log_event,set_ticket_status,epic_state,render_dashboard,create_linked_branch,force_pr_issue_link}.sh`
- Dashboard : skill `/report`
