#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
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

Cette PR rassemble les commits squashés de chaque sous-ticket validé par la pipeline. Chaque sous-ticket a déjà passé : tests écrits/validés par \`tu-dev\` (TU + intégration), CI verte, validators IA (validator / structural-auditor / rgaa-auditor / security-auditor / functional-validator), Sonar Quality Gate, et réponse aux review bots. La fidélité visuelle vs. Figma a été vérifiée par \`code-dev\` lui-même via le MCP \`figma-dev\`. Une fois la feature intégrée, l'agent \`e2e-dev\` a rejoué la suite E2E (triage de régression) et ajouté la couverture E2E Playwright du parcours (commit \`test(e2e): …\` sur \`${BRANCH}\`) — toute régression E2E détectée est signalée par un commentaire \`e2e-dev:\` sur l'epic. Cette PR est le **point unique de revue humaine** pour l'epic.

## Sous-tickets

${SUB_LINES:-_(aucun sous-ticket trouvé)_}

## Notes

- Branche d'intégration : \`${BRANCH}\` (rebasée régulièrement sur \`alpha\` pendant l'exécution)
- Une fois cette PR mergée dans \`alpha\`, les sous-tickets se fermeront automatiquement à la prochaine release (\`alpha → master\`) via les \`Closes #N\` ci-dessus."

# Conventional-commits prefix so the Semantic PR check passes (alpha base
# requires a `<type>(<scope>): <subject>` shape). We pick `feat(epic)` since
# every epic delivers user-facing changes ; the epic number then disambiguates
# multiple in-flight epics.
PR_TITLE="feat(epic): #${EPIC} — ${EPIC_TITLE}"

PR_URL=$(gh pr create \
    --base alpha \
    --head "$BRANCH" \
    --title "$PR_TITLE" \
    --body "$BODY" 2>&1) || {
    echo "[open_epic_final_pr] ERROR: gh pr create failed:" >&2
    echo "$PR_URL" >&2
    exit 1
}

PR_NUM=$(echo "$PR_URL" | grep -oE 'pull/[0-9]+' | sed 's|pull/||' | head -1 || true)
if [ -z "$PR_NUM" ]; then
    PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$' | tail -1)
fi
if [ -z "$PR_NUM" ]; then
    echo "[open_epic_final_pr] ERROR: cannot parse PR number from output: $PR_URL" >&2
    exit 1
fi

echo "[open_epic_final_pr] opened PR #${PR_NUM} (${BRANCH} → alpha)" >&2
echo "$PR_NUM"
