---
name: report
description: "Dashboard d'avancement des epics en cours. Thin wrapper sur les scripts bash qui agrègent les logs per-agent (.claude/state/epic_run/) et le state GitHub. Pas de LLM lourd. Usage: /report [<epic_N> ...]"
---

# /report — Dashboard orchestrateur

## Usage

- `/report` — dashboard des agents actifs (tous epics confondus)
- `/report <N>` — dashboard + état des sous-tickets de l'epic #N
- `/report <N1> <N2> ...` — dashboard + état multi-epic

## Exécution

**Cas nominal — juste le dashboard des agents actifs** :

```bash
bash scripts/orchestration/render_dashboard.sh
```

Ce script pur bash lit `.claude/state/epic_run/agents/*.log`, calcule pour chaque agent son statut (`healthy` / `slow` / `stuck`) via `agent_status.sh`, son coût LLM (live ou estimate) via `compute_cost.sh`, et rend une table compacte :

```
AGENT  TICKET  PHASE  ATTEMPT  AGE  MODEL  EST. $  REASON
```

Les agents flagués 🔴 stuck déclenchent automatiquement un drill-down (last 20 events, shell command actif, git status du worktree, dernier check CI failed, dernier comment PR) — fourni par `agent_drilldown.sh`. Les ⚠ slow sont juste mentionnés dans la table sans drill-down.

**Cas avec epic(s) en argument — ajouter l'état des sous-tickets** :

```bash
bash scripts/orchestration/render_dashboard.sh
echo ""
bash scripts/orchestration/epic_state.sh <N1> [<N2> ...]
```

`epic_state.sh` affiche un tableau compact : numéro, status board, labels, last_event, age, retries, PR.

## Format du rapport

Le dashboard est déjà formaté par les scripts. Tu n'as qu'à :

1. Exécuter les commandes bash ci-dessus
2. **Re-rendre les tableaux en markdown propre** (colonnes alignées, headers `|` syntax). L'UI utilisateur rend mal les tableaux bash bruts (── boxes, alignement à espaces multiples).
3. **Joindre une analyse** : interprétation de l'état actuel, qui bouge, qui est bloqué, prochaine étape attendue.

> Note : la version « copier-coller la sortie telle quelle » a été remplacée par cette mouture markdown + analyse. Les scripts bash restent la source de vérité — la donnée vient toujours d'eux, ne pas inventer.

## Mode auto-report (lancé depuis /loop, e.g. par /implement)

Quand `/report` est invoqué via `/loop` (mode dynamic-pacing), il devient l'élément central d'un suivi automatique pendant la durée d'un `/implement` epic. À chaque iteration :

1. Run `/report <N>` (rendu markdown + analyse comme ci-dessus)
2. **Vérifier la condition d'arrêt** : la PR finale `epic/<N> → alpha` est-elle ouverte ?
   ```bash
   gh pr list --repo SocialGouv/egapro --base alpha --head "epic/<N>" --state open --json number --jq 'length'
   ```
   - Retourne `> 0` → l'epic est terminé (loop driver a appelé `open_epic_final_pr.sh`). **Omettre `ScheduleWakeup`** → loop s'arrête. Annoncer à l'utilisateur.
   - Retourne `0` → re-schedule un wakeup avec délai adaptatif (cf. ci-dessous).
3. **Picking du délai adaptatif** :
   - **Activité récente** (logs avec event dans les 5 min, agent qui spawn/transition de phase) → 60-270s (cache prompt warm)
   - **État stable** (agent log-silent, rien d'actionable) → 1200-1800s (un seul cache miss couvre une longue fenêtre)
   - **300s = NEVER** : worst-of-both case (cache miss sans amortissement)
4. La cadence DOIT s'adapter à ce que tu OBSERVES, pas à un timer fixe. Lis le delta de coût (`*` indicateur live), l'âge du dernier event, l'état de la PR — décide en fonction.

## Ajustement des seuils

Les seuils stuck/slow sont définis dans `agent_status.sh` (variables d'env) :

```bash
SLOW_THRESHOLD_SEC=300 \
STUCK_PHASE_SEC=1200 \
STUCK_BOT_SEC=900 \
bash scripts/orchestration/render_dashboard.sh
```

Règles de décision (voir `agent_status.sh`) :
- 🔴 **stuck** : ≥ 3 RETRY sur le même axis · CI_FAIL ≥ 3 fois consécutifs sur le même check · BOT_WAIT > 15min sans BOT_REPLIED · phase stalled > 20min · process gone (fallback)
- ⚠ **slow** : log silent > 5min, process alive, pas de pattern stuck identifié
- ✓ **healthy** : activité log récente OU process actif

## Cas où les logs sont vides

Si `.claude/state/epic_run/agents/` n'existe pas ou ne contient aucun `.log` :

- Aucun agent n'a été dispatché récemment, OU
- `/implement` (mode epic) tourne mais ses agents n'ont pas encore loggé

Dans ce cas le script affiche `(Aucun epic en cours)`. Si `<N>` est fourni en argument, `epic_state.sh` donne quand même l'état GitHub des sous-tickets (la query GraphQL ne dépend pas des logs locaux).

## Règles

- **Données d'entrée = scripts bash** (`render_dashboard.sh`, `epic_state.sh`). Toujours les exécuter, ne pas inventer la donnée.
- **Rendu = markdown propre + analyse** (cf. « Format du rapport »). Ne pas dump la sortie bash brute.
- **Ne pas interroger GitHub** pour des données que les logs per-agent ont déjà (last_event, retries). GitHub n'est sollicité que via `epic_state.sh` pour le board ET via le check d'arrêt de loop (mode auto-report).
- **Ne pas dispatcher ni prendre de décision d'orchestration** pendant un `/report` — l'utilisateur décide ensuite. Exception : en mode auto-report, décider du délai du prochain wakeup ET de l'arrêt du loop.
