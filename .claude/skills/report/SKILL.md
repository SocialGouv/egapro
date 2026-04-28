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

Ce script pur bash lit `.claude/state/epic_run/agents/*.log`, trie les agents par inactivité (stuck en tête), affiche les derniers events de chacun, et signale les agents inactifs depuis plus de 10 minutes.

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
2. **Copier-coller la sortie telle quelle** à l'utilisateur
3. Ajouter **au maximum 2 lignes de commentaire** en tête si tu remarques quelque chose d'important (ex: « Attention, 2 agents inactifs > 20 min — probablement stuck »)

**Ne PAS reformater** la sortie du script. Le format texte-table est voulu pour la lisibilité terminal.

## Ajustement du seuil d'inactivité

Par défaut, un agent est flaggé inactif après 10 minutes sans nouvel event. Pour ajuster :

```bash
INACTIVITY_THRESHOLD_SEC=300 bash scripts/orchestration/render_dashboard.sh   # seuil 5 min
```

## Cas où les logs sont vides

Si `.claude/state/epic_run/agents/` n'existe pas ou ne contient aucun `.log` :

- Aucun agent n'a été dispatché récemment, OU
- `/epic` tourne mais ses agents n'ont pas encore loggé

Dans ce cas le script affiche `(Aucun epic en cours)`. Si `<N>` est fourni en argument, `epic_state.sh` donne quand même l'état GitHub des sous-tickets (la query GraphQL ne dépend pas des logs locaux).

## Règles

- **Zéro LLM processing** quand les scripts suffisent. Si l'utilisateur demande un rapport standard, c'est juste `bash` + affichage.
- **Interventions LLM autorisées** : commentaire analytique (max 2 lignes) en tête du rapport pour signaler un pattern important (plusieurs agents stuck, epic bientôt finie, etc.).
- **Ne pas interroger GitHub** pour des données que les logs per-agent ont déjà (last_event, retries). GitHub n'est sollicité que via `epic_state.sh` pour le status board.
- **Ne pas dispatcher ni prendre de décision d'orchestration** pendant un `/report` — l'utilisateur décide ensuite.
