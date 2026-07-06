---
name: implement
description: "Phase exécution. Lance le bot iterion egapro_implement_agents.bot (qui auto-détecte epic/task/bug) via le launcher, surveille le run, et résout la gate d'acceptation utilisateur. Usage: /implement <issue#>"
---

# /implement

**Phase exécution** de la pipeline. `/implement <issue#>` lance le bot iterion
**`egapro_implement_agents.bot`** via le launcher canonique. Le bot **auto-détecte
le mode** (`detect_mode`) et exécute toute l'orchestration lui-même :

| Type d'issue | Ce que le bot fait |
|---|---|
| `Feature` (epic) | fan-out `fan_out_each` sur le DAG des sous-tickets (`epic_dag.sh`) → chaîne qualité par ticket (sub-run `egapro_implement_ticket.bot`) → squash-merge dans `epic/<N>` → **rebase + gate E2E** → **doc-writer** → **PR finale** → **gate d'acceptation** |
| `Task` / `Bug` | un seul sub-run `egapro_implement_ticket.bot` → `e2e-dev` → `task_handoff` (PR prête sur `alpha`) |

> **Le skill n'orchestre rien lui-même.** Les agents (`code-dev`, `tu-dev`, les 4
> auditors, `functional-validator`, `e2e-dev`, `architect-rework`, `doc-writer`)
> sont des **nœuds iterion**, plus des agents CLI (ils n'ont pas de frontmatter →
> `claude --agent code-dev` échouerait). Le seul entrypoint est le bot iterion.
> Le rôle du skill : pré-check analyse → lancer → surveiller → résoudre la gate.

---

## Step 0 — Valider l'argument

`$ARGUMENTS` doit contenir un numéro d'issue. Sinon → demander lequel.

```bash
ISSUE_N="$(echo "$ARGUMENTS" | awk '{print $1}' | tr -d '#')"
gh issue view "$ISSUE_N" --json number,title,issueType,labels,state \
  --jq '{number, title, issueType: .issueType.name, labels:[.labels[].name], state}'
```

Si `state != OPEN` → avertir et demander confirmation. (Le bot re-vérifie et log un WARN, mais un check ici évite un lancement inutile.)

## Step 1 — Vérifier que l'analyse a été faite

Le bot le vérifie (`check_analyse` → `propose_analyse` → `fail` si absent), mais un pré-check donne une meilleure UX que de lancer pour rien :

| Type | Marqueur attendu |
|---|---|
| `Feature` | `subIssues.totalCount > 0` **et** commentaire `## Analyse PO` sur l'epic |
| `Task` | commentaire `## Analyse architecte` sur l'issue |
| `Bug` | commentaire `## Analyse du bug` sur l'issue |

Si absent → proposer `/analyse $ISSUE_N` et s'arrêter.

## Step 2 — Lancer le bot via le launcher

```bash
bash scripts/orchestration/run_iterion_pipeline.sh implement "$ISSUE_N"
```

Le launcher (`scripts/orchestration/run_iterion_pipeline.sh`) :
- provisionne un **run-worktree** détaché sur la branche pipeline (porte les `.bot` + `scripts/orchestration/*`) ;
- exporte **`ITERION_SKIP_MCP_HEALTH=1`** (tolère le MCP figma HTTP-OAuth cassé — **plus de neutralisation `.mcp.json`**) ;
- lance `iterion run … --run-id egapro-implement-<N>-<ts> --sandbox none --merge-into none --no-interactive` en **background** + un **studio** sur `:4900` ;
- écrit `/tmp/egapro-iterion-implement-<N>.{pid,runid,log}`.

Récupère le `run-id` et le `store` pour la suite :
```bash
RUN_ID=$(cat /tmp/egapro-iterion-implement-${ISSUE_N}.runid)
STORE="/tmp/egapro-iterion-implement-${ISSUE_N}/.iterion"
LOG="/tmp/egapro-iterion-implement-${ISSUE_N}.log"
```

## Step 3 — Surveiller

Lancer l'auto-report dynamique (dashboards adaptatifs) :
```
Skill("loop", args="/report <N>")
```
Cadence : activité récente → 60-270s (cache warm) ; état stable → 1200-1800s ; jamais 300s.
Autres vues : `http://127.0.0.1:4900/runs` (studio), `tail -f $LOG`, `/report <N>`.

À chaque wakeup, **vérifier la condition de transition** — le bot a-t-il atteint une **pause** (gate humaine) ? Le run background exite quand il atteint un nœud `human` (`--no-interactive`). Deux signaux :
```bash
# (a) le process n'est plus vivant ET le run est en pause/failed_resumable
kill -0 "$(cat /tmp/egapro-iterion-implement-${ISSUE_N}.pid)" 2>/dev/null || echo "run terminé ou en pause"
# (b) la PR finale epic/<N> → alpha est ouverte (Feature) → on est à la gate d'acceptation
gh pr list --repo SocialGouv/egapro --base alpha --head "epic/${ISSUE_N}" --state open --json number --jq '.[0].number // ""'
```
- Pas de PR / run encore vivant → re-scheduler (le run continue).
- PR ouverte **ou** run en pause → passer à la gate d'acceptation (Step 4).

Pour un **Task/Bug** : pas de gate d'acceptation. Le run se termine à `task_handoff` (PR prête sur `alpha`, ticket In progress). Afficher le verdict E2E + le lien PR, fin.

## Step 4 — Gate d'acceptation utilisateur (mode epic)

Quand la PR finale est ouverte, le bot est en **pause sur `accept_gate`** (nœud `human`, schéma `{approved, feedback}`). Le rôle du skill : inviter à tester, récupérer la décision, **résoudre la pause via `iterion resume`**.

1. **Présenter + inviter à tester** : lien PR `#<PR>`, résumé de l'epic, et comment tester :
   - Review app : `https://egapro-<branche>-<hash>.ovh.fabrique.social.gouv.fr` (depuis les checks/deployment de la PR).
   - Local : `/open <PR>` recrée un worktree + stack.
2. **Demander** via `AskUserQuestion` : « L'epic #N est implémenté (PR #<PR>, doc + E2E OK). Après test — des changements ? » Options : **« Tout est bon »** / **« Demander des changements »**.
3. **« Tout est bon »** → résoudre la gate en approuvant :
   ```bash
   env -u CLAUDECODE ITERION_SKIP_MCP_HEALTH=1 \
     iterion resume "$RUN_ID" --store-dir "$STORE" --sandbox none --no-interactive \
     --answer approved=true
   ```
   Le run se termine (`done`). Rappeler que c'est l'utilisateur qui passe le ticket `In review`/`Done` et merge `epic/<N> → alpha`. **Fin.**
4. **« Demander des changements »** → récupérer la **description précise** (texte libre), puis résoudre en refusant + feedback :
   ```bash
   env -u CLAUDECODE ITERION_SKIP_MCP_HEALTH=1 \
     iterion resume "$RUN_ID" --store-dir "$STORE" --sandbox none --no-interactive \
     --answer approved=false --answer feedback="<description des changements>"
   ```
   Le bot route vers **`architect_rework` (mode user-feedback)** → crée des tickets Task de fix → `epic_plan` les reprend → re-fan-out → re-gate E2E → doc → met à jour la PR → **re-pause sur `accept_gate`**. Relancer l'auto-report et **boucler jusqu'à « Tout est bon »**.
   - Si `architect_rework` pose une **question** (doute fonctionnel → pause sur `rework_human`) : relayer la question à l'utilisateur, puis `iterion resume "$RUN_ID" --store-dir "$STORE" --no-interactive --answer approved=true --answer feedback="<réponse>"`.

> Le run background étant `--no-interactive`, **chaque resume relance le run jusqu'à la prochaine pause ou la fin** — pas besoin de relancer le launcher. Pour repartir de zéro : `run_iterion_pipeline.sh implement <N> --fresh`.

---

## Règles

- **NE JAMAIS** dupliquer la logique d'orchestration — elle est dans les `.bot` + `scripts/orchestration/`.
- **NE PAS** lancer `claude --agent code-dev` / `epic_loop.sh` (paths morts sur cette branche).
- **NE PAS** poll l'état — utiliser `/report` et le studio.
- Résoudre les gates via `iterion resume … --answer` (jamais éditer le store à la main).
- Avant tout lancement : check **analyse présente** (Step 1) ; sinon proposer `/analyse <N>`.

## Référence

- Launcher : `scripts/orchestration/run_iterion_pipeline.sh`
- Bots : `egapro_implement_agents.bot` (parent), `egapro_implement_ticket.bot` (enfant)
- Plan / convergence : `scripts/orchestration/epic_dag.sh` (signal canonique = PR mergée, `held`)
- Verdicts board : `scripts/orchestration/process_tick_result.sh`
- Fin d'epic : `rebase_epic_branch.sh` · gate E2E (nœud `e2e_dev`) · `run_doc_writer.sh` · `open_epic_final_pr.sh`
- Dashboard : skill `/report`
