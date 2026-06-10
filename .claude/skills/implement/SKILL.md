---
name: implement
description: "Phase exécution. Détecte le mode (epic/task/bug) selon le type d'issue et lance le bon mécanisme : loop driver background pour epic, code-dev synchrone pour task/bug. Usage: /implement <issue#>"
---

# /implement

**Phase exécution** de la pipeline. Détecte le mode depuis le type d'issue et branche :

| Type d'issue | Mode | Mécanisme |
|---|---|---|
| `Feature` (epic) | epic | `nohup bash scripts/orchestration/epic_loop.sh <N> > /tmp/epic_loop_<KEY>.log 2>&1 &` (background, parallèle, plusieurs sub-tickets ; **e2e-dev** lancé en fin de loop sur `epic/<N>`) |
| `Task` | task | Lance `code-dev` en **CLI foreground** (`claude --agent code-dev`, bloquant), puis **e2e-dev** une fois `validated` |
| `Bug` | bug | Lance `code-dev` en **CLI foreground** (`claude --agent code-dev`, bloquant) avec `rules/bug-fix-workflow.md`, puis **e2e-dev** une fois `validated` |
| sub-issue d'un epic (non-feature) | task-debug | Comme `task` — utile pour re-rouler un sous-ticket d'un epic plus large (ex: après `refacto` ou debug) |

`/implement` n'orchestre rien lui-même : pour epic c'est `epic_loop.sh` qui parallèlise (et exécute la **gate E2E bloquante** `run_e2e_dev.sh` → `run_architect_rework.sh` en fin de loop), pour task/bug c'est un process CLI `claude --agent code-dev` foreground suivi d'un `claude --agent e2e-dev`. **`code-dev` tourne comme _main agent_ (process CLI)** — obligatoire pour qu'il puisse lancer ses propres sous-agents (`tu-dev`, les 4 validateurs, `functional-validator`) : un sous-agent ne peut pas en spawner d'autres. **`e2e-dev` tourne en fin de pipeline** (après dev terminé + sous-tickets mergés pour une Feature, ou après `code-dev validated` pour une Task/Bug) et possède toute la couverture E2E — `code-dev` n'écrit plus aucun test E2E.

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

2. **Aligner le main worktree sur `epic/<N>`** — la pipeline orchestrate doit tourner sur la branche d'intégration de l'epic, pas depuis `alpha` ni un worktree dédié. Sinon : `rebase_epic_branch.sh` entre ticks plante (`epic/<N> is already used by worktree at ...`), et l'état dans `.claude/state/epic_run/` finit sur le mauvais worktree (cassant `/report`).
   ```bash
   # Sécurité : refuser si working tree dirty (commit/stash d'abord)
   if [ -n "$(git status --porcelain)" ]; then
       echo "ERROR: working tree dirty — commit ou stash avant /implement <N>"
       exit 1
   fi

   # S'assurer que la branche d'intégration existe sur origin (idempotent)
   bash scripts/orchestration/ensure_epic_branch.sh "$ISSUE_N"

   # Checkout epic/<N> sur le main worktree
   git fetch origin "epic/${ISSUE_N}" --quiet
   if git rev-parse --verify --quiet "epic/${ISSUE_N}" >/dev/null; then
       git checkout "epic/${ISSUE_N}"
       git pull --ff-only origin "epic/${ISSUE_N}"
   else
       git checkout -B "epic/${ISSUE_N}" "origin/epic/${ISSUE_N}"
   fi
   ```

3. Lancer le bash loop driver en background **depuis le main worktree** (qui est désormais sur `epic/<N>`) :
   ```bash
   LOG_FILE="/tmp/epic_loop_${EPICS_KEY}.log"
   nohup bash scripts/orchestration/epic_loop.sh $EPICS > "$LOG_FILE" 2>&1 &
   PID=$!
   disown
   echo "epic_loop lancé en background (PID $PID, log: $LOG_FILE)."
   ```

4. **Lancer l'auto-report dynamique** — invoquer le skill `/loop` avec args `/report <N>` (mode dynamic-pacing, pas d'intervalle fixe).
   ```
   Skill("loop", args="/report <N>")
   ```
   Le `/loop` va run `/report <N>` immédiatement, puis re-schedule un wakeup avec délai adaptatif (60-3600s) basé sur ce que `/report` observe. À chaque wakeup, après le rendu du dashboard, **vérifier la condition d'arrêt** : la PR finale `epic/<N> → alpha` est-elle ouverte ?
   ```bash
   gh pr list --repo SocialGouv/egapro --base alpha --head "epic/<N>" --state open --json number --jq 'length'
   ```
   Si > 0 → omettre `ScheduleWakeup` → loop s'arrête. Sinon → re-schedule.

   Cadence recommandée :
   - **Activité récente côté logs** (phase qui bouge, agent qui spawn) → 60-270s (cache prompt warm)
   - **État stable** (agent silent, rien à observer) → 1200-1800s (un seul cache miss)
   - **Sortie 5 min** → toujours mauvais choix (300s = cache miss sans amortissement)

5. Rendre la main immédiatement (le /loop continue en arrière-plan, t'auto-rapporte jusqu'à fin de l'epic).

> **Note** : le main worktree reste sur `epic/<N>` pendant toute la durée du loop (ticks + final PR). Pour faire du travail sur `alpha` en parallèle (hotfix, autre branche), monter un worktree dédié (`git worktree add /tmp/egapro-alpha alpha`). À la fin de l'epic — quand la PR finale est mergée sur alpha — basculer manuellement le main worktree avec `git checkout alpha && git pull`.

### Mode task ou bug — code-dev synchrone foreground (puis e2e-dev)

Pour un single ticket (Task, Bug, ou sub-issue d'epic dispatchée manuellement), le pipeline parallèle est overkill. On invoque `code-dev` directement, en foreground, avec un worktree dédié — puis, une fois `code-dev` `validated`, on enchaîne sur `e2e-dev` (même worktree, dev server + stack déjà debout) pour la couverture E2E + le triage de régression (`code-dev` ne touche plus aux E2E) :

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

4. **Lancer `code-dev` en CLI foreground** (PAS via le Task tool) — code-dev DOIT être *main agent* de son propre process pour pouvoir lancer ses sous-agents (`tu-dev` étape 5.5, les 4 quality gates étape 6, `functional-validator` étape 9a) ; un sous-agent ne peut pas en spawner d'autres. Même invocation que `epic_loop.sh` (`spawn_agent`), mais **synchrone/bloquante** pour un seul ticket :

   ```bash
   MODEL=$(gh issue view "$ISSUE_N" --json labels --jq '.labels[].name' | grep -qx complexe && echo opus || echo sonnet)
   BUDGET=$([ "$MODEL" = opus ] && echo 40 || echo 10)
   env -u CLAUDECODE timeout 5400 claude \
     --agent code-dev --model "$MODEL" \
     --print --output-format stream-json --verbose \
     --dangerously-skip-permissions --max-budget-usd "$BUDGET" \
     "$PROMPT" 2>&1 | tee "/tmp/code-dev-${ISSUE_N}.jsonl"
   ```

   - `$PROMPT` : le même brief par ticket que construit `epic_loop.sh` (numéro de ticket + type, worktree path, index → port `3001+index`, base branch `origin/...`, working branch déjà checkout, « suivre STRICTEMENT `code-dev/AGENT.md` », retour JSON strict en dernier message). Pour un Bug, rappeler `rules/bug-fix-workflow.md`.
   - **Récupérer le verdict JSON** depuis la sortie stream-json (dernier objet `{"status":...}`) — même extraction que `epic_loop.sh` : essayer `jq -e '.status'`, fallback bloc ` ```json `, puis premier `{...}` contenant `"status"`.
   - L'agent suit `code-dev/AGENT.md` : implémente, **délègue tous les tests (TU + intégration) à `tu-dev`** (Opus, étape 5.5 — `tu-dev` rend la main sur une vraie régression), push, ouvre PR draft, force PR↔issue link, fait passer les 4 quality gates + `functional-validator`, `gh pr ready`, retourne JSON. **Le ticket reste en `In progress`** — `In review` / `Done` user-only.

5. **Parser le JSON retourné** :

   | `.status` | Action skill | Markdown affiché |
   |---|---|---|
   | `validated` | enchaîner sur **e2e-dev** (étape 5bis) ; le ticket reste In progress, l'utilisateur le bouge à In review à son rythme | `## Code: PASS` + ticket/branche/PR, puis le verdict E2E |
   | `needs_opus_escalation` | relancer immédiatement le **CLI `code-dev`** avec `--model opus` et le même `$PROMPT` ; si le retour Opus est `validated`, enchaîner sur e2e-dev (étape 5bis) | `## Code: PASS` ou `## Code: REFACTO` selon le retour Opus |
   | `refacto` | aucune (le ticket est en To Do) ; pas d'e2e-dev | `## Code: REFACTO` + diagnostic + next-step `/analyse <N>` (re-spec) |
   | `rate_limited` | proposer de retenter dans `retry_in` secondes ou abandonner | `## Code: RATE_LIMITED` + délai suggéré |
   | `failed` | propager l'erreur sans modifier le ticket ; pas d'e2e-dev | `## Code: FAILED` + raison technique |

5bis. **Lancer `e2e-dev` en CLI foreground** (uniquement si le verdict terminal de `code-dev` est `validated`) — `code-dev` ne possède plus les E2E ; `e2e-dev` (toujours Opus) lance la suite E2E actuelle (triage régression vs évolution légitime), puis décide d'imbriquer la nouvelle fonctionnalité dans un scénario E2E existant ou d'en créer un nouveau (et, pour un Bug, juge sa criticité). Il pousse ses commits de test sur **la branche de la PR** (ce qui re-déclenche la CI). Même worktree que `code-dev` (dev server + stack docker déjà debout) :

   ```bash
   env -u CLAUDECODE timeout 3600 claude \
     --agent e2e-dev --model opus \
     --print --output-format json \
     --dangerously-skip-permissions --max-budget-usd 15 \
     "$E2E_PROMPT" 2>&1 | tee "/tmp/e2e-dev-${ISSUE_N}.json"
   ```

   - `$E2E_PROMPT` : unité = ticket `#<N>` (+ type Task/Bug), worktree path, index → port `3001+index`, base de comparaison `origin/...` (la même que `code-dev`), branche de la PR déjà checkout, « suivre STRICTEMENT `e2e-dev/AGENT.md` », push sur `HEAD` (la branche de la PR), retour JSON strict en dernier message. Pour un Bug, rappeler le critère de **criticité** (`e2e-dev` décide s'il vaut un E2E).
   - **Récupérer le verdict JSON** (dernier objet `{"status":...}`) et l'afficher :

     | `.status` e2e-dev | Action skill | Markdown affiché |
     |---|---|---|
     | `validated` | aucune (tests poussés sur la branche, CI re-déclenchée) | `## E2E: PASS` + mode (`nested`/`new`/`none`) + fichiers + note « CI re-déclenchée par le push » |
     | `regression` | **bloquant** : invoquer `architect-rework` (CLI foreground) sur le ticket pour analyser la régression et créer le(s) ticket(s) de fix — ou escalader sur doute fonctionnel ; afficher les tickets créés / la question | `## E2E: REGRESSION` + tests en régression + fichier source suspecté + tickets de fix créés (next-step `/implement <fix>`) |
     | `rate_limited` | proposer de retenter ou de lancer `e2e-dev` plus tard | `## E2E: RATE_LIMITED` + délai |
     | `failed` | noter l'échec technique (dev server / infra), proposer de relancer | `## E2E: FAILED` + raison |

   - **Sur `regression`** : lancer `architect-rework` exactement comme `e2e-dev` (CLI foreground, `claude --agent architect-rework --model opus`), en lui passant le ticket et la base de comparaison. Il lit le commentaire `e2e-dev:`, crée des tickets Task de fix (To Do) ou pose une question à l'utilisateur (`needs_user`). Comme on est en foreground (utilisateur présent), afficher le verdict et la **next-step** (`/implement <ticket-de-fix>`), plutôt que de relancer l'orchestrateur automatiquement.
   - **e2e-dev ne bouge pas le board** : le ticket reste en `In progress` ; une régression est traitée par les tickets de fix d'`architect-rework` (l'utilisateur les implémente, puis `e2e-dev` re-valide).

6. **Pour les sub-issues d'epic validées en mode synchrone** : `process_tick_result.sh` n'est pas appelé (c'est un mécanisme du loop driver). Le squash-merge de la PR validée dans `epic/<N>` peut être déclenché manuellement (de préférence **après** que `e2e-dev` a poussé sa couverture, pour que les E2E partent avec) :
   ```bash
   bash scripts/orchestration/merge_validated_ticket.sh "$PR_N" "$EPIC_N" "$ISSUE_N"
   ```
   À déclencher seulement si l'utilisateur veut que les enfants suivants se débloquent. Pour une Task / Bug standalone, pas de squash-merge auto — l'humain merge la PR sur `alpha` à la review.

---

## Suivi de la progression (mode epic)

- **Auto-report `/loop /report <N>`** lancé automatiquement à l'étape 4 — délivre des dashboards adaptatifs jusqu'à la fin de l'epic, puis s'auto-arrête (cf. condition d'arrêt en step 4)
- `/report <N>` — déclencher manuellement à tout moment pour un check on-demand (n'interfère pas avec le loop dynamique)
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
- **En mode task/bug**, c'est synchrone : tu lances le **CLI `claude --agent code-dev`** (bloquant) et tu attends le JSON final, comme l'ancien `/code`. **PAS** le Task tool — code-dev doit être main agent pour lancer ses sous-agents (`tu-dev`, validateurs, `functional-validator`). Puis, si `validated`, tu lances le **CLI `claude --agent e2e-dev`** (bloquant) sur le même worktree pour la couverture E2E (étape 5bis).
- **E2E = exclusivement `e2e-dev`** — ni `/implement` ni `code-dev` n'écrivent de test E2E ; `e2e-dev` est le seul propriétaire de `src/e2e/**`, lancé en fin de pipeline.
- Avant tout dispatch : check **analyse présente** (cf. Step 1) ; sinon proposer `/analyse <N>` et exit

---

## Référence

- Loop driver : `scripts/orchestration/epic_loop.sh`
- Branche d'intégration (NEW mode) : `scripts/orchestration/{ensure_epic_branch,merge_validated_ticket,rebase_epic_branch,open_epic_final_pr}.sh`
- Gate E2E bloquante (fin d'epic, avant doc-writer + PR finale) : `scripts/orchestration/run_e2e_dev.sh` → sur régression `scripts/orchestration/run_architect_rework.sh` (crée les tickets de fix, reprocessés par le loop)
- Régénération doc (best-effort, après la gate E2E verte) : `scripts/orchestration/run_doc_writer.sh`
- Computation du plan : `scripts/orchestration/dispatch_plan.sh`
- Mutations board : `scripts/orchestration/process_tick_result.sh`
- Helpers : `scripts/orchestration/{cache_gh,log_event,set_ticket_status,epic_state,render_dashboard,create_linked_branch,force_pr_issue_link}.sh`
- Dashboard : skill `/report`
