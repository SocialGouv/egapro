---
name: review
description: "Adresse les commentaires de revue sur les PR (humain + bots). Mode auto-détecté selon le type d'issue. Usage: /review [<issue#>|<PR#>]"
---

# /review

Délègue à l'agent **`review-fixer`** dans un worktree dédié pour : lire les commentaires non résolus, appliquer les fixes, valider, push, répondre aux threads. Trois modes auto-détectés :

| Mode | Trigger | Scope du review |
|---|---|---|
| **epic** | Issue type `Feature` | Toutes les sub-task PRs liées à la feature + la PR finale `epic/<N> → alpha`. Les fixes sont appliqués sur la **branche d'intégration `epic/<N>`** (les sub-tasks sont déjà squash-mergées dedans). |
| **task** | Issue type `Task` | La PR du ticket en review. Fixes sur la branche head du PR. |
| **bug** | Issue type `Bug` | La PR du bug en review. Fixes sur la branche head du PR. |
| (no-arg) | Aucun argument, sur une branche de PR | La PR de la branche courante (équivalent task/bug single-PR). |

Globalement le fonctionnement reste identique au précédent `/review` : fetch, fix, re-validate, reply. La nouveauté c'est que le travail réel se passe dans un agent qui tourne en worktree (comme `code-dev` pour `/implement`), pas dans le main context.

---

## Step 0 — Détecter le mode

```bash
ARG_HEAD="$(echo "$ARGUMENTS" | awk '{print $1}')"
case "$ARG_HEAD" in
  '#'[0-9]*|[0-9]*)
    ID="${ARG_HEAD#\#}"
    # ID peut être un issue number ou un PR number — on essaie d'abord issue
    ;;
  https://github.com/*/issues/*)
    ID="$(echo "$ARG_HEAD" | sed -E 's#.*/issues/([0-9]+).*#\1#')"
    ;;
  https://github.com/*/pull/*)
    ID="$(echo "$ARG_HEAD" | sed -E 's#.*/pull/([0-9]+).*#\1#')"
    IS_PR=1
    ;;
  *)
    ID=""
    ;;
esac
```

### Cas A — argument fourni

- Si l'argument est un **numéro d'issue** : `gh issue view <ID> --json number,issueType,labels` → brancher selon `issueType.name` (Feature/Task/Bug).
- Si l'argument est un **numéro de PR** : `gh pr view <ID> --json closingIssuesReferences` → trouver l'issue liée → brancher selon son type.
- Type absent ou ambigu → demander à l'utilisateur quel mode utiliser.

### Cas B — pas d'argument

- Si la branche courante est une PR branch (`gh pr view --json number` réussit) → mode `task` ou `bug` selon l'issue liée à cette PR. PR = la PR courante.
- Sinon : lister les PRs ouvertes avec des reviews non adressées (`gh pr list --state open --json number,title,reviewDecision --jq '.[] | select(.reviewDecision == "REVIEW_REQUIRED" or .reviewDecision == "CHANGES_REQUESTED")'`) et demander laquelle traiter.

---

## Step 1 — Identifier le scope

### Mode `epic`

```bash
EPIC_N="$ID"

# 1. PR finale epic/<N> → alpha (si ouverte)
FINAL_PR=$(gh pr list --head "epic/$EPIC_N" --base alpha --state open --json number --jq '.[0].number // empty')

# 2. Sub-task PRs (open ET closed-merged — les comments restent lisibles sur les closed PRs)
SUBTASK_PRS=$(gh api graphql -f query='{
    repository(owner:"SocialGouv", name:"egapro") {
        issue(number: '$EPIC_N') {
            subIssues(first: 50) {
                nodes {
                    closedByPullRequestsReferences(first: 5) { nodes { number state } }
                }
            }
        }
    }
}' --jq '[.data.repository.issue.subIssues.nodes[].closedByPullRequestsReferences.nodes[].number] | unique')

# 3. Filtrer les PRs avec des unresolved comments
PR_LIST=$(echo "$FINAL_PR $SUBTASK_PRS" | tr ' ' '\n' | sort -u | while read PR; do
    [ -z "$PR" ] && continue
    HAS=$(gh pr view "$PR" --json reviewDecision --jq '.reviewDecision' 2>/dev/null)
    if [ "$HAS" = "REVIEW_REQUIRED" ] || [ "$HAS" = "CHANGES_REQUESTED" ]; then
        echo "$PR"
    fi
done | tr '\n' ' ')

WORKING_BRANCH="epic/$EPIC_N"
```

Si aucune PR n'a de review en attente → afficher `Aucune review non adressée sur l'epic #<N> ; rien à faire.` et exit.

### Mode `task` ou `bug` (single PR)

```bash
# Trouver la PR liée à l'issue
PR_LIST=$(gh issue view "$ID" --json closedByPullRequestsReferences \
    --jq '[.closedByPullRequestsReferences.nodes[] | select(.state == "OPEN") | .number] | join(" ")')
# Fallback : chercher par branche linkée
[ -z "$PR_LIST" ] && PR_LIST=$(gh pr list --search "linked:$ID" --json number --jq '.[0].number')

WORKING_BRANCH=$(gh pr view "$PR_LIST" --json headRefName --jq '.headRefName')
```

---

## Step 2 — Worktree

Réutiliser ou créer un worktree sur `WORKING_BRANCH` :

```bash
# Picker un index libre dans [0, EPIC_MAX_PARALLEL[
INDEX=$(...)  # premier libre via lsof sur 3001+
WT_PATH="$(cd "${REPO_ROOT}/.." && pwd)/egapro-review-${ID}"

if [ ! -d "$WT_PATH" ]; then
    git fetch origin "$WORKING_BRANCH"
    git worktree add "$WT_PATH" "origin/$WORKING_BRANCH"
fi

if [ ! -f "$WT_PATH/packages/app/.env.local" ]; then
    (cd "$WT_PATH" && bash scripts/setup-worktree.sh "$INDEX")
fi
```

---

## Step 3 — Déléguer à `review-fixer`

Invoquer l'agent `review-fixer` (`.claude/agents/review-fixer/AGENT.md`) en foreground synchrone avec :

- `mode` : `epic` / `task` / `bug`
- `PR_LIST` : numéros séparés par espaces
- `WORKING_BRANCH` : `epic/<N>` en mode epic, ou la PR head branch en mode task/bug
- `WT_PATH` + `INDEX`

L'agent :
1. Checkout `WORKING_BRANCH` dans le worktree
2. Lit toutes les unresolved comments sur les PRs en scope
3. Catégorise (fix / non-pertinent / question / déjà adressé / ambigu)
4. Pour les ambigus → demande clarification à l'utilisateur
5. Applique les fixes
6. Re-run les 4 quality gates (validator, structural-auditor, rgaa-auditor, security-auditor)
7. Push sur `WORKING_BRANCH`
8. Watch CI sur les PRs en scope jusqu'au vert
9. **Prépare** les replies pour chaque thread mais **ne les poste pas** — gate utilisateur explicite avant de poster
10. Sur approbation utilisateur → poste les replies via `gh api`
11. Vérifie qu'aucun thread n'a été ignoré silencieusement

L'agent retourne un JSON strict :
- `{"status":"validated","prs":[...],"fixes_applied":N,"replies_posted":M}` → tout est réglé
- `{"status":"needs_user","prs":[...],"unposted_replies":N}` → des replies pendantes (l'utilisateur a refusé / demandé à attendre)
- `{"status":"failed","prs":[...],"reason":"..."}` → erreur technique
- `{"status":"watching","prs":[...],"resume_after":<sec>}` → l'utilisateur veut surveiller les nouveaux commentaires

---

## Step 4 — Loop optionnel

Si l'utilisateur souhaite continuer à surveiller les nouveaux commentaires sur les mêmes PRs :

- Boucle : sleep `resume_after` (typiquement 5 min) → re-fetch comments → si nouveau comment depuis le dernier push → re-spawner `review-fixer`
- L'utilisateur peut interrompre (`Ctrl+C` ou `arrêter` en chat) à tout moment

Sinon → exit avec un report court :

```
## Review: <PASS | NEEDS_USER | FAILED>

Mode: <epic|task|bug>
PRs traitées: #N1, #N2, …
Fixes appliqués: K
Replies postées: M
Working branch: <branch>
```

---

## Règles

- **Pas de force-push** sans validation utilisateur explicite (cf. agent `review-fixer`).
- **Pas de transition de statut board** — `/review` ne touche jamais au board. `In review` et `Done` sont user-only.
- **Mode epic** : les fixes vont sur `epic/<N>`, **pas** sur les sub-task branches (qui sont supprimées après squash-merge). Si un sub-task PR est encore OPEN (rare en pratique — la pipeline aurait dû le squash-merger), le pipeline `/implement` reprend la main, pas `/review`.
- **Reply gate** : `review-fixer` **prépare** les replies, l'utilisateur les valide avant de les poster. Cette discipline est conservée du `/review` historique.
- **Git artefact hygiene** — voir `.claude/rules/git-artefact-hygiene.md`. Les replies sont publiques : pas de secret/PII/infra interne.

---

## Référence

- Agent : `.claude/agents/review-fixer/AGENT.md`
- Quality gates : `.claude/agents/{validator,structural-auditor,rgaa-auditor,security-auditor}/AGENT.md`
- Git artefact hygiene : `.claude/rules/git-artefact-hygiene.md`
