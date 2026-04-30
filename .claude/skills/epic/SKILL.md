---
name: epic
description: "Lance le bash loop driver d'orchestration d'epics en background. Thin wrapper — toute la logique vit dans scripts/orchestration/. Le main context reste libre pendant l'exécution. Suivi via /report. Usage: /epic <N1> [<N2> ...]"
---

# /epic — Thin wrapper sur `epic_loop.sh`

## Usage

- `/epic <N1> [<N2> ...]` — lance le bash loop driver en background sur les epics donnés (ordre = priorité stricte)
- `/epic` — liste les epics actifs (Backlog/To Do/In progress) et demande à l'utilisateur lesquels orchestrer

## Ton rôle

Tu es **un thin wrapper**. Tu n'orchestres rien toi-même — tu valides les arguments, tu spawnes le script bash `epic_loop.sh` en background, et tu rends la main à l'utilisateur.

**Toute la logique d'orchestration est dans `scripts/orchestration/`** (loop driver bash + scripts shellisés). Ne pas dupliquer cette logique ici.

---

## Workflow

### 1. Valider les arguments

Si aucun argument :

```bash
gh issue list --label epic --state open --json number,title \
  | jq -r '.[] | "#\(.number): \(.title)"'
```

Demander à l'utilisateur lesquels lancer, dans quel ordre.

Pour chaque numéro fourni, vérifier que c'est bien un epic :

```bash
gh issue view $N --json labels --jq '[.labels[].name]' | grep -qi '"epic"' \
  || echo "ERREUR: #$N n'est pas un epic"
```

### 2. Vérifier qu'aucun loop driver ne tourne déjà sur ces epics

```bash
EPICS_KEY=$(echo "$EPICS" | tr ' ' '_')
pgrep -af "epic_loop.sh.*${EPICS_KEY}" | head
```

Si un loop driver est actif sur les mêmes epics, avertir l'utilisateur et demander :

- Attendre qu'il finisse (suivre via `/report`)
- Killer l'ancien (`pkill -f "epic_loop.sh.*${EPICS_KEY}"`) puis relancer
- Annuler

### 3. Lancer le bash loop driver en background

L'orchestration n'est **pas** un agent LLM — c'est un script bash qui tourne en background. Le script invoque `claude` CLI à chaque tick pour spawner les sub-agents en parallèle (via `--print --output-format json --max-budget-usd`), mais la boucle est en bash, donc pas de drift LLM possible.

```bash
EPICS="<N1> <N2>"
EPICS_KEY=$(echo "$EPICS" | tr ' ' '_')
LOG_FILE="/tmp/epic_loop_${EPICS_KEY}.log"

nohup bash scripts/orchestration/epic_loop.sh $EPICS > "$LOG_FILE" 2>&1 &
PID=$!
disown

echo "epic_loop lancé en background (PID $PID, log: $LOG_FILE)"
```

### 4. Informer l'utilisateur

Message court :

```
Loop driver bash lancé sur epics #<N1> #<N2> en background (PID <PID>).
Log temps réel : tail -f /tmp/epic_loop_<EPICS_KEY>.log
Main context libre — tu peux continuer à travailler normalement.
Utilise /report pour voir la progression à tout moment.
```

### 5. Retour

Rendre la main immédiatement. Le bash loop tourne en arrière-plan jusqu'à terminaison.

**Note** : le user n'aura **pas** de notification automatique à la fin (puisque c'est un script bash, pas un agent). Il doit checker `/report` ou `tail -f $LOG_FILE`. Pour un epic de N tickets, prévoir ~5–15 min par ticket selon complexité.

---

## Suivi de la progression

Le bash loop tourne en background. Pas de notification automatique à la fin. L'utilisateur check via :

- `/report` — dashboard live agents actifs + état du board
- `/report <N>` — état détaillé des sous-tickets de l'epic
- `tail -f /tmp/epic_loop_<EPICS_KEY>.log` — log temps réel du loop driver
- `ls .claude/state/epic_run/ticks/<EPICS_KEY>/` — les ticks effectués + leurs résultats JSON (`tick_<N>_plan.json`, `tick_<N>_result.json`, `tick_<N>_agent_<TICKET>.json`)

### Codes de sortie du script

L'utilisateur peut vérifier le retour final si le script est terminé (`echo $?` dans le terminal qui l'a lancé) :

| Exit code | Signification | Action user |
|---|---|---|
| 0 | Tous les tickets en état terminal (`In review` ou `dispatch=escalate`), aucun en flight | Revoir les PR et merger |
| 1 | Erreur technique (claude CLI failed, plan malformé, etc.) | Voir `/tmp/epic_loop_<KEY>.log` + `tick_<N>_agent_*.json` pour comprendre |
| 2 | Tickets avec label `dispatch=escalate` détectés (3 refacto consécutifs ou pose manuelle) | Voir les commentaires des tickets concernés → orienter / re-spec, retirer le label, remettre en To Do |
| 3 | `EPIC_LOOP_MAX_TICKS` (30 par défaut) atteint sans converger | Inspecter pourquoi des tickets ne progressent pas (`/report`, logs) |

### Si le loop est toujours actif

Pour killer proprement :

```bash
pkill -f "epic_loop.sh.*<EPICS_KEY>"
```

Pour reprendre où on en était : juste relancer `/epic <N>` — le script repartira du tick 0 mais comme les tickets en `In review` restent en `In review` et les worktrees existants sont réutilisés (idempotence par `dispatch_plan.sh` + `ensure_worktree`), la reprise est naturelle.

---

## Configuration (env vars, défauts entre crochets)

| Variable | Défaut | Effet |
|---|---|---|
| `EPIC_MAX_PARALLEL` | 5 | Worktrees max en parallèle (range 1–5). Aussi configurable dans `.claude/settings.json`. |
| `EPIC_LOOP_MAX_TICKS` | 30 | Plafond sécuritaire de ticks d'orchestration. |
| `EPIC_LOOP_SLEEP_TICK` | 5 | Sleep entre 2 ticks (sec). |
| `EPIC_LOOP_SLEEP_WAIT` | 30 | Sleep quand le plan est vide mais des tickets sont en flight (sec). |
| `EPIC_LOOP_BUDGET_SONNET` | 10 | Budget USD max par sub-agent Sonnet (`claude --max-budget-usd`). |
| `EPIC_LOOP_BUDGET_OPUS` | 40 | Budget USD max par sub-agent Opus. |
| `EPIC_LOOP_AGENT_TIMEOUT` | 5400 | Timeout dur par sub-agent en sec (90 min). |
| `EPIC_DEFAULT_BASE` | `origin/alpha` | **LEGACY mode uniquement** (epics avec label `pipeline=legacy`). Base par défaut pour les tickets sans dépendance dans le pattern stacked-PR historique. En NEW mode (par défaut), la base est toujours `origin/epic/<N>` et cette variable est ignorée. |

Pour un run avec budget plus généreux, override en ligne :

```bash
EPIC_LOOP_BUDGET_OPUS=80 nohup bash scripts/orchestration/epic_loop.sh 42 > /tmp/epic_loop_42.log 2>&1 &
```

---

## Anti-boucle

`process_tick_result.sh` track un compteur d'échecs consécutifs sur chaque ticket via les labels `attempt=1`, `attempt=2`, `attempt=3` :

- 1ᵉʳ `refacto` → `attempt=1`, re-Todo, re-dispatch au prochain tick
- 2ᵉ `refacto` → `attempt=2`, re-Todo, re-dispatch
- 3ᵉ `refacto` → `attempt=3` + `dispatch=escalate` → `dispatch_plan.sh` ne dispatchera plus le ticket (filtré). Le loop driver détecte le label `dispatch=escalate` au tick suivant et exit avec code 2.

L'utilisateur retire `dispatch=escalate` (et éventuellement `attempt=3`) après orientation pour relancer.

---

## Règles

- **NE JAMAIS** dupliquer la logique d'orchestration ici — tout est dans `scripts/orchestration/`
- **NE JAMAIS** spawner les agents `code-dev` directement depuis ce skill (c'est `epic_loop.sh` qui le fait via `claude` CLI)
- **NE PAS** attendre le retour du loop driver (`nohup ... &; disown`)
- **NE PAS** poll l'état — utiliser `/report`
- **Ne garder ici** que : validation des args, check d'un loop déjà actif, spawn du script

---

## Référence

- Loop driver : `scripts/orchestration/epic_loop.sh`
- Branche d'intégration (NEW mode) : `scripts/orchestration/{ensure_epic_branch,merge_validated_ticket,rebase_epic_branch,open_epic_final_pr}.sh`
- Computation du plan : `scripts/orchestration/dispatch_plan.sh` (DAG `Depends on`, base = `epic/<N>` en NEW mode, stacked PR en LEGACY mode si l'epic carry `pipeline=legacy`)
- Mutations board : `scripts/orchestration/process_tick_result.sh` (anti-boucle 3 attempts, refus du `Done`, squash-merge dans `epic/<N>` sur `validated`)
- Helpers : `scripts/orchestration/{cache_gh,log_event,set_ticket_status,epic_state,render_dashboard}.sh`
- Dashboard : skill `/report`
- Legacy (ancienne version LLM-driven du skill) : `.claude/skills/epic/SKILL-legacy.md.bak`
