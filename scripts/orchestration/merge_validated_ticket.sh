#!/usr/bin/env bash
# merge_validated_ticket.sh <pr_number> <epic_N> <ticket_N>
#
# Squash-merges a validated ticket PR into the integration branch `epic/<N>`
# via `gh pr merge --squash`. Branch auto-deletion is handled by repo-level
# settings.
#
# Called by process_tick_result.sh on `status=validated`. The repo's branch
# protection MUST allow the gh-authenticated user to merge into epic/* (no
# review approval required, CI green is enough — code-dev step 9b already
# enforces all-checks-green before returning validated).
#
# Exit codes:
#   0  merged successfully
#   1  hard error (PR base ≠ epic/<N>, network, gh permission)
#   2  PR conflicts with epic/<N> — caller should bump attempt counter and
#      re-dispatch code-dev to rebase. The script also comments on the PR
#      and resets the ticket to In progress.
#   3  GitHub still computing mergeability — caller should retry next tick

set -euo pipefail

if [ $# -lt 3 ]; then
    echo "Usage: $0 <pr_number> <epic_N> <ticket_N>" >&2
    exit 2
fi

PR="$1"
EPIC="$2"
TICKET="$3"
BRANCH="epic/${EPIC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PR_BASE=$(gh pr view "$PR" --json baseRefName --jq '.baseRefName' 2>/dev/null || echo "")
if [ -z "$PR_BASE" ]; then
    echo "[merge_validated_ticket] ERROR: cannot read base of PR #$PR" >&2
    exit 1
fi
if [ "$PR_BASE" != "$BRANCH" ]; then
    echo "[merge_validated_ticket] ERROR: PR #$PR base is '$PR_BASE', expected '$BRANCH' — refusing merge (wrong epic? stale PR base?)" >&2
    exit 1
fi

MERGEABLE=$(gh pr view "$PR" --json mergeable --jq '.mergeable' 2>/dev/null || echo "")
case "$MERGEABLE" in
    MERGEABLE) ;;
    CONFLICTING)
        echo "[merge_validated_ticket] PR #$PR conflicts with $BRANCH — comment + reset ticket" >&2
        gh pr comment "$PR" --body "**process_tick_result : conflit avec \`${BRANCH}\`**

Le ticket a été validé techniquement (CI verte, validators IA OK, Sonar OK), mais la squash-merge dans \`${BRANCH}\` est impossible à cause d'un conflit avec une PR mergée juste avant. Le ticket repasse en \`In progress\` pour un nouveau dispatch \`code-dev\` qui doit rebaser sur \`${BRANCH}\` :

\`\`\`bash
git fetch origin ${BRANCH}
git rebase origin/${BRANCH}
# résoudre les conflits
git push --force-with-lease
\`\`\`

Une fois la PR à nouveau verte, le pipeline retentera le squash-merge automatiquement." >/dev/null 2>&1 || true
        bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "In progress" >/dev/null 2>&1 || true
        exit 2
        ;;
    UNKNOWN|"")
        # GitHub computes mergeability asynchronously — for large diffs it can
        # take 10-30s to settle. Poll up to 6 times with a 5s pause (~30s total)
        # before giving up and asking the caller to retry next tick.
        ATTEMPTS=0
        while [ "$ATTEMPTS" -lt 6 ]; do
            sleep 5
            ATTEMPTS=$((ATTEMPTS + 1))
            MERGEABLE=$(gh pr view "$PR" --json mergeable --jq '.mergeable' 2>/dev/null || echo "")
            case "$MERGEABLE" in
                MERGEABLE) break ;;
                CONFLICTING)
                    echo "[merge_validated_ticket] PR #$PR conflicts with $BRANCH (detected after $ATTEMPTS poll(s)) — comment + reset ticket" >&2
                    gh pr comment "$PR" --body "**process_tick_result : conflit avec \`${BRANCH}\`**

Le ticket a été validé techniquement mais la squash-merge dans \`${BRANCH}\` est impossible à cause d'un conflit. Le ticket repasse en \`In progress\` pour un nouveau dispatch \`code-dev\` qui doit rebaser sur \`${BRANCH}\` :

\`\`\`bash
git fetch origin ${BRANCH}
git rebase origin/${BRANCH}
# résoudre les conflits
git push --force-with-lease
\`\`\`" >/dev/null 2>&1 || true
                    bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "In progress" >/dev/null 2>&1 || true
                    exit 2
                    ;;
            esac
        done
        if [ "$MERGEABLE" != "MERGEABLE" ]; then
            echo "[merge_validated_ticket] PR #$PR mergeability=$MERGEABLE after $ATTEMPTS retries (~30s) — postponing to next tick" >&2
            exit 3
        fi
        ;;
    *)
        echo "[merge_validated_ticket] PR #$PR unknown mergeable state '$MERGEABLE'" >&2
        exit 1
        ;;
esac

echo "[merge_validated_ticket] squash-merging PR #$PR into $BRANCH" >&2
if ! gh pr merge "$PR" --squash 2>&1; then
    echo "[merge_validated_ticket] ERROR: gh pr merge --squash failed for PR #$PR" >&2
    exit 1
fi

echo "[merge_validated_ticket] PR #$PR merged into $BRANCH (branch auto-deleted by repo settings)"
exit 0
