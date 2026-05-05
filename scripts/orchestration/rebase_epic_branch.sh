#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# rebase_epic_branch.sh <epic_N>
#
# Rebases epic/<N> onto origin/alpha to keep the integration branch fresh as
# unrelated PRs land on alpha during the epic's execution. Force-with-lease
# pushes the rebased branch.
#
# Operates inside a dedicated temp worktree at /tmp/egapro-rebase-epic<N> so
# the main repo's working tree stays untouched. The temp worktree is reused
# across calls.
#
# Called by epic_loop.sh between ticks (in NEW-mode epics only).
#
# Exit codes:
#   0  rebase clean (or no-op: already up-to-date)
#   1  hard error (cannot fetch, push rejected, worktree creation failed)
#   2  rebase conflict — aborted, comment posted on the epic, label
#      `dispatch=escalate` applied. Caller should halt this epic.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <epic_N>" >&2
    exit 2
fi

EPIC="$1"
BRANCH="epic/${EPIC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WT="/tmp/egapro-rebase-epic${EPIC}"

(cd "$REPO_ROOT" && git fetch --quiet origin alpha "$BRANCH") >&2 || {
    echo "[rebase_epic_branch] ERROR: git fetch origin alpha $BRANCH failed" >&2
    exit 1
}

if [ ! -d "$WT" ]; then
    git -C "$REPO_ROOT" worktree add --force "$WT" "origin/${BRANCH}" >&2 || {
        echo "[rebase_epic_branch] ERROR: cannot add worktree at $WT" >&2
        exit 1
    }
fi

cd "$WT"

git fetch --quiet origin "$BRANCH" >&2 || true
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    git checkout "$BRANCH" >&2
else
    git checkout -b "$BRANCH" "origin/${BRANCH}" >&2
fi
git reset --hard "origin/${BRANCH}" >&2

ALPHA_OID=$(git rev-parse "origin/alpha")
BASE_OID=$(git merge-base "origin/alpha" HEAD)
if [ "$BASE_OID" = "$ALPHA_OID" ]; then
    echo "[rebase_epic_branch] $BRANCH already up-to-date with origin/alpha" >&2
    exit 0
fi

echo "[rebase_epic_branch] rebasing $BRANCH onto origin/alpha (current base ${BASE_OID:0:8} → ${ALPHA_OID:0:8})" >&2

if git rebase "origin/alpha" >&2; then
    if ! git push --force-with-lease origin "$BRANCH" >&2; then
        echo "[rebase_epic_branch] ERROR: push --force-with-lease rejected — remote $BRANCH moved during rebase" >&2
        exit 1
    fi
    echo "[rebase_epic_branch] $BRANCH rebased + pushed" >&2
    exit 0
fi

echo "[rebase_epic_branch] CONFLICT during rebase of $BRANCH on origin/alpha" >&2
git rebase --abort >&2 || true

gh issue comment "$EPIC" --body "**rebase_epic_branch : conflit \`${BRANCH}\` ↔ \`origin/alpha\`**

Le rebase automatique de la branche d'intégration a échoué. Le pipeline est arrêté pour cet epic (label \`dispatch=escalate\` posé) jusqu'à résolution manuelle :

\`\`\`bash
git fetch origin alpha
git checkout ${BRANCH}
git rebase origin/alpha
# résoudre les conflits
git rebase --continue
git push --force-with-lease origin ${BRANCH}
gh issue edit ${EPIC} --remove-label dispatch=escalate
\`\`\`

Tant que le label reste posé, \`epic_loop.sh\` exitera en code 2 sans dispatcher de nouveaux tickets sur cet epic." >/dev/null 2>&1 || true

gh issue edit "$EPIC" --add-label "dispatch=escalate" >/dev/null 2>&1 || true

exit 2
