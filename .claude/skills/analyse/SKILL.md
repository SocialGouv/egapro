---
name: analyse
description: "Phase conception. Lance le bot iterion egapro_analyse_agents.bot (qui auto-détecte epic/task/bug et invoque product-owner / architect / bug-analyst) via le launcher, et résout les gates + Q&A. Usage: /analyse [<issue#>] [<description>]"
---

# /analyse

**Phase conception** de la pipeline. `/analyse` lance le bot iterion
**`egapro_analyse_agents.bot`** via le launcher canonique. Le bot **auto-détecte
le mode** (`detect_mode` sur l'issueType ; type absent / description libre →
`mode_gate` qui te demande) et invoque l'agent Opus adapté :

| Mode | Déclencheur | Agent (nœud iterion) | Sortie |
|---|---|---|---|
| **epic** | issueType `Feature` (ou mode_gate=epic) | `product_owner` → `architect_epic` | Epic GitHub + N sous-issues sizées |
| **task** | issueType `Task` (ou mode_gate=task) | `architect_task` | commentaire `## Analyse architecte` |
| **bug** | issueType `Bug` (ou mode_gate=bug) | `bug_analyst` | commentaire `## Analyse du bug` |

> Les agents `product-owner` / `architect` / `bug-analyst` sont des **nœuds
> iterion** (pas d'agents CLI registrables). Le seul entrypoint est le bot.
> Le rôle du skill : parser les arguments → lancer → résoudre les gates + Q&A.

---

## Step 0 — Parser les arguments

```bash
ARG_HEAD="$(echo "$ARGUMENTS" | awk '{print $1}')"
case "$ARG_HEAD" in
  '#'[0-9]*|[0-9]*)                 ISSUE_N="${ARG_HEAD#\#}" ;;
  https://github.com/*/issues/*)    ISSUE_N="$(echo "$ARG_HEAD" | sed -E 's#.*/issues/([0-9]+).*#\1#')" ;;
  *)                                ISSUE_N="" ;;
esac
# Le reste de la ligne = contexte d'invocation (URL Figma, précisions de repro,
# amendements pour un enrich). Sans issue, c'est la description libre de l'epic.
if [ -n "$ISSUE_N" ]; then
  EXTRA_CONTEXT="$(echo "$ARGUMENTS" | cut -d' ' -f2-)"; DESCRIPTION=""
else
  DESCRIPTION="$ARGUMENTS"; EXTRA_CONTEXT="$ARGUMENTS"
fi
```

## Step 1 — Lancer le bot via le launcher

```bash
bash scripts/orchestration/run_iterion_pipeline.sh analyse "${ISSUE_N:-new}" \
  --var description="$DESCRIPTION" --var extra_context="$EXTRA_CONTEXT"
```

Le launcher provisionne le run-worktree, exporte `ITERION_SKIP_MCP_HEALTH=1`, lance en **background** + un **studio** (`:4900`), et écrit `/tmp/egapro-iterion-analyse-<slug>.{pid,runid,log}` (slug = `<issue#>` ou `new`).

```bash
SLUG="${ISSUE_N:-new}"
RUN_ID=$(cat /tmp/egapro-iterion-analyse-${SLUG}.runid)
STORE="/tmp/egapro-iterion-analyse-${SLUG}/.iterion"
```

## Step 2 — Résoudre les gates + Q&A

Le run background (`--no-interactive`) **se met en pause** à chaque nœud `human`
et à chaque question `mcp__iterion__ask_user` d'un agent. À chaque pause, relaie
à l'utilisateur puis reprends le run avec la réponse. Vue live : `http://127.0.0.1:4900/runs`.

Les pauses possibles et leur clé de réponse (`iterion resume "$RUN_ID" --store-dir "$STORE" --sandbox none --no-interactive --answer <clé>=<val>`) :

| Pause | Contexte | Réponse |
|---|---|---|
| `mode_gate` | issueType absent / description libre | `--answer mode=epic` \| `task` \| `bug` \| `stop` |
| **ask_user** (PO / architect / bug-analyst) | 3-5 questions métier ciblées | reprendre avec la clé demandée par la question (visible dans le studio / le log) |
| `po_gate` | l'analyse PO est prête (mode epic, mi-flux) | `--answer approved=true` (lancer l'architecte) \| `approved=false` (stopper, reformuler) |
| `review_gate` | l'analyse finale est postée (marqueur `[Validation utilisateur] …`) | `--answer approved=true` (→ report, Next: `/implement`) \| `approved=false` (stop) |

Boucle : lire la pause (question + nœud) via le studio ou le log, la relayer via `AskUserQuestion`, `iterion resume … --answer …`, jusqu'à ce que le run atteigne `report` (`## Analyse: DONE — Next: /implement <issue>`) ou `fail`.

> **Task / Bug** exigent une issue existante : sans numéro d'issue, `mode_gate`
> te fera répondre `mode=stop` — crée d'abord l'issue GitHub puis relance
> `/analyse <issue#>`. Le mode **epic** sait, lui, créer l'epic depuis la description.

---

## Règles

- **NE PAS** déléguer à `product-owner` / `architect` / `bug-analyst` via `claude --agent` ni le Task tool (nœuds iterion, pas d'agents registrables).
- Aucune transition de board côté conception (les agents sont read-only ; le PO peut ajouter l'epic au project en Backlog).
- Résoudre les pauses via `iterion resume … --answer` (jamais éditer le store).
- Sizing (`Size` + `Estimate`) fait par l'agent en fin d'analyse (`set_ticket_size.sh`).

## Référence

- Launcher : `scripts/orchestration/run_iterion_pipeline.sh`
- Bot : `egapro_analyse_agents.bot`
- Suite : `/implement <issue#>` (une fois l'analyse validée)
