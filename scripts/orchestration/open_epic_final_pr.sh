#!/usr/bin/env bash
# open_epic_final_pr.sh <epic_N>
#
# Opens (or reuses, if already open) the integration PR `epic/<N> → alpha`
# at the end of an epic. Body lists every sub-ticket with `Closes #N` so they
# auto-close on the eventual `alpha → master` release.
#
# Called by epic_loop.sh once every sub-ticket is in a terminal state
# (validated + squash-merged into epic/<N>).
#
# Stdout: the PR number
# Exit 0 on success (created or reused), 1 on hard error.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <epic_N>" >&2
    exit 2
fi

EPIC="$1"
BRANCH="epic/${EPIC}"

EXISTING=$(gh pr list --head "$BRANCH" --base alpha --state open --json number --jq '.[0].number // empty' 2>/dev/null || echo "")
if [ -n "$EXISTING" ]; then
    echo "[open_epic_final_pr] PR #${EXISTING} already open for $BRANCH → alpha, reusing" >&2
    echo "$EXISTING"
    exit 0
fi

if ! git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    echo "[open_epic_final_pr] ERROR: $BRANCH does not exist on origin" >&2
    exit 1
fi

EPIC_TITLE=$(gh issue view "$EPIC" --json title --jq '.title' 2>/dev/null)
if [ -z "$EPIC_TITLE" ]; then
    echo "[open_epic_final_pr] ERROR: cannot read epic #${EPIC} title" >&2
    exit 1
fi

SUB_LINES=$(gh api graphql -f query="{
    repository(owner: \"SocialGouv\", name: \"egapro\") {
        issue(number: ${EPIC}) {
            subIssues(first: 50) {
                nodes { number title }
            }
        }
    }
}" --jq '.data.repository.issue.subIssues.nodes[] | "- Closes #\(.number) — \(.title)"' 2>/dev/null || echo "")

BODY="Intégration finale de l'epic #${EPIC} — **${EPIC_TITLE}**.

Cette PR rassemble les commits squashés de chaque sous-ticket validé par la pipeline. Chaque sous-ticket a déjà passé : CI verte, validators IA (validator / structural-auditor / rgaa-auditor / security-auditor / functional-validator / design-validator), Sonar Quality Gate, et réponse aux review bots. Cette PR est le **point unique de revue humaine** pour l'epic.

## Sous-tickets

${SUB_LINES:-_(aucun sous-ticket trouvé)_}

## Notes

- Branche d'intégration : \`${BRANCH}\` (rebasée régulièrement sur \`alpha\` pendant l'exécution)
- Une fois cette PR mergée dans \`alpha\`, les sous-tickets se fermeront automatiquement à la prochaine release (\`alpha → master\`) via les \`Closes #N\` ci-dessus."

PR_URL=$(gh pr create \
    --base alpha \
    --head "$BRANCH" \
    --title "Epic #${EPIC} — ${EPIC_TITLE}" \
    --body "$BODY" 2>&1) || {
    echo "[open_epic_final_pr] ERROR: gh pr create failed:" >&2
    echo "$PR_URL" >&2
    exit 1
}

PR_NUM=$(echo "$PR_URL" | grep -oE 'pull/[0-9]+' | sed 's|pull/||' | head -1)
if [ -z "$PR_NUM" ]; then
    PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$' | tail -1)
fi
if [ -z "$PR_NUM" ]; then
    echo "[open_epic_final_pr] ERROR: cannot parse PR number from output: $PR_URL" >&2
    exit 1
fi

echo "[open_epic_final_pr] opened PR #${PR_NUM} (${BRANCH} → alpha)" >&2
echo "$PR_NUM"
