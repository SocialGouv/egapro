---
name: doc
description: "Régénère la documentation utilisateur (`docs/*.md`) à partir de l'état courant du code. Usage : /doc (sur la branche courante) ou /doc <issue#> (sur la branche linkée à un epic / ticket)."
---

# /doc

**Régénération de la documentation utilisateur** du repo. Le skill délègue à l'agent `doc-writer` qui réécrit `docs/features.md`, `docs/architecture.md`, et `docs/parcours-utilisateurs.md` à partir de l'état courant du code.

Le skill est l'entrée **humaine** ; l'entrée orchestrée (en fin d'epic) passe par `scripts/orchestration/run_doc_writer.sh` invoqué directement depuis `epic_loop.sh`.

| Mode d'invocation | Comportement |
|---|---|
| `/doc` sans argument | Tourne sur la branche courante. Compare HEAD vs `origin/alpha`. **Commit local seulement** — l'humain pousse lui-même. |
| `/doc <issue#>` | Tourne sur la branche d'un ticket / epic. Si `<issue#>` est un epic, opère sur `origin/epic/<N>`. Sinon opère sur la branche linkée à l'issue (sidebar Development). **Commit + push** automatique. |

---

## Step 0 — Pré-conditions

Refuser si :

- Le working tree est dirty (`git status --porcelain` non-vide) → demander à l'humain de commit/stash d'abord
- La branche courante est `alpha` ou `master` directement → la doc est régénérée sur les branches feature, pas sur la branche stable

```bash
if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree dirty — commit ou stash d'abord."
    exit 1
fi

CURRENT=$(git branch --show-current)
if [ "$CURRENT" = "alpha" ] || [ "$CURRENT" = "master" ]; then
    echo "Refus : /doc ne tourne pas directement sur $CURRENT. Crée une branche dédiée."
    exit 1
fi
```

---

## Step 1 — Résoudre la branche cible

### Sans argument

Branche cible = branche courante. Base de comparaison = `origin/alpha`.

```bash
git fetch origin alpha --quiet
TARGET_BRANCH=$(git branch --show-current)
BASE_BRANCH=alpha
EPIC_N=null
PUSH_AUTO=false  # commit local, l'humain push lui-même
```

### Avec un argument `<issue#>`

```bash
ISSUE_N="${ARGUMENTS%% *}"; ISSUE_N="${ISSUE_N#\#}"

ISSUE_TYPE=$(gh issue view "$ISSUE_N" --json issueType --jq '.issueType.name')

if [ "$ISSUE_TYPE" = "Feature" ]; then
    # Epic → tourne sur la branche d'intégration
    TARGET_BRANCH="epic/$ISSUE_N"
    BASE_BRANCH=alpha
    EPIC_N="$ISSUE_N"
else
    # Task / Bug → trouver la branche linkée à l'issue
    TARGET_BRANCH=$(gh api graphql -f query='
        query($owner:String!, $repo:String!, $n:Int!) {
          repository(owner:$owner, name:$repo) {
            issue(number:$n) {
              linkedBranches(first:5) { nodes { ref { name } } }
            }
          }
        }' -f owner=SocialGouv -f repo=egapro -F n=$ISSUE_N \
        --jq '.data.repository.issue.linkedBranches.nodes[0].ref.name // empty')

    if [ -z "$TARGET_BRANCH" ]; then
        echo "Aucune branche linkée à l'issue #$ISSUE_N."
        exit 1
    fi

    # Base = parent epic si l'issue est sub-issue d'un epic, sinon alpha
    PARENT=$(gh api graphql -f query='...parent...' --jq '.parent.number // empty')
    if [ -n "$PARENT" ]; then
        BASE_BRANCH="epic/$PARENT"
    else
        BASE_BRANCH=alpha
    fi
    EPIC_N="${PARENT:-null}"
fi

PUSH_AUTO=true
git fetch origin "$TARGET_BRANCH" "$BASE_BRANCH" --quiet
git checkout "$TARGET_BRANCH"
git pull --ff-only origin "$TARGET_BRANCH"
```

---

## Step 2 — Invoquer l'agent `doc-writer`

Inputs à passer à l'agent (via le prompt de subagent) :

- `epic` : `$EPIC_N` (ou `null`)
- `branch` : `$TARGET_BRANCH`
- `base_branch` : `$BASE_BRANCH`
- `mode` : `pipeline` si `PUSH_AUTO=true`, `skill` sinon
- `worktree` : `.` (skill = repo courant ; pas de worktree dédié)

L'agent suit `.claude/agents/doc-writer/AGENT.md` :

1. Calcule le diff `<base>...HEAD`
2. Heuristique no-op : si rien de fonctionnel n'a changé → retour `no_changes`
3. Sinon : régénère from scratch les fichiers `docs/*.md` impactés
4. Commit
5. Push si `mode=pipeline`, sinon laisse le commit local

L'agent retourne un JSON strict (4 cas possibles, voir AGENT.md).

---

## Step 3 — Parser le JSON retourné

| `.status` | Action | Markdown affiché |
|---|---|---|
| `updated` | (mode skill) signaler le commit local non poussé ; (mode pipeline) signaler le push | `## Doc: UPDATED` + liste des fichiers + sha |
| `no_changes` | aucune | `## Doc: NO_CHANGES` + reason |
| `rate_limited` | proposer de retenter dans `retry_in` secondes | `## Doc: RATE_LIMITED` |
| `failed` | propager l'erreur | `## Doc: FAILED` + raison |

Si `notes` est présent dans le JSON, l'afficher tel quel à l'humain (ex : "couverture insuffisante, envisager `docs/api-publique.md`").

En **mode skill** (commit local), terminer le message par :

```
Le commit a été créé localement. Relis le diff (`git show HEAD`) et push avec `git push` quand tu es prêt.
```

---

## Quand utiliser `/doc`

- **Hotfix sur `alpha` direct** : non, refusé par Step 0.
- **Branche feature standalone** (sans epic) : `/doc` (sans arg) — utile après une grosse refacto.
- **Sub-task d'un epic** : `/doc <ticket#>` ou laisse `epic_loop.sh` invoquer `doc-writer` automatiquement à la fin de l'epic. Cumul possible mais redondant.
- **Avant d'ouvrir une PR feature manuelle** : `/doc` → relit le commit doc → push avec le reste.
- **Régénération forcée** : invoquer `/doc <epic#>` après un merge important sur `alpha` pour resynchroniser le wiki dans la foulée.

## Quand NE PAS utiliser `/doc`

- Sur `alpha` ou `master` → refusé
- Quand le diff vs base est uniquement du code de tests / CI / scripts d'orchestration → l'agent retournera `no_changes` de toutes façons, autant ne pas le lancer
- Sur une branche en cours de travail (working tree dirty) → refusé

---

## Référence

- Agent : `.claude/agents/doc-writer/AGENT.md`
- Script orchestration (mode pipeline) : `scripts/orchestration/run_doc_writer.sh`
- Workflow GitHub Action de sync wiki : `.github/workflows/sync-docs-to-wiki.yaml`
- Décision architecturale : voir mémoire `project_doc_system`
