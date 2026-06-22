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
# If a worktree is already on `epic/<N>` (the main worktree on `/implement`
# epic mode is, by design), the rebase happens **in-place** in that worktree.
# Otherwise, it operates inside a dedicated temp worktree at
# /tmp/egapro-rebase-epic<N> reused across calls. Git refuses to check out
# the same branch in two worktrees, so we must reuse rather than create.
# In-place rebase requires the worktree to be clean — if dirty, the script
# refuses (exit 1) rather than silently losing the user's edits.
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

(cd "$REPO_ROOT" && git fetch --quiet origin alpha "$BRANCH") >&2 || {
    echo "[rebase_epic_branch] ERROR: git fetch origin alpha $BRANCH failed" >&2
    exit 1
}

# Detect if any worktree (including main) already has `epic/<N>` checked out.
# Git refuses to check out the same branch in two worktrees, so we must reuse
# the existing one. The main worktree being on epic/<N> is the expected state
# under `/implement` mode epic (since the related fix to that skill).
EXISTING_WT=$(git -C "$REPO_ROOT" worktree list --porcelain 2>/dev/null \
    | awk -v b="refs/heads/${BRANCH}" '
        /^worktree / { wt = $2 }
        /^branch / && $2 == b { print wt; exit }
    ')

if [ -n "$EXISTING_WT" ]; then
    # `-uno` (or --untracked-files=no) : we tolerate untracked files in the
    # main worktree (e.g. `scripts/package.json` artifacts created by tooling
    # outside of git's tracking) — they don't risk being lost by the rebase.
    # Only reject if there are real tracked-but-uncommitted edits.
    if [ -n "$(git -C "$EXISTING_WT" status --porcelain -uno)" ]; then
        echo "[rebase_epic_branch] ERROR: worktree at $EXISTING_WT is on $BRANCH but has tracked-uncommitted edits — refuse to rebase (would lose them)" >&2
        exit 1
    fi
    WT="$EXISTING_WT"
    echo "[rebase_epic_branch] in-place rebase in existing worktree at $WT" >&2
else
    WT="/tmp/egapro-rebase-epic${EPIC}"
    if [ ! -d "$WT" ]; then
        git -C "$REPO_ROOT" worktree add --force "$WT" "origin/${BRANCH}" >&2 || {
            echo "[rebase_epic_branch] ERROR: cannot add worktree at $WT" >&2
            exit 1
        }
    fi
fi

cd "$WT"

git fetch --quiet origin "$BRANCH" >&2 || true
# Already on $BRANCH if reusing an existing worktree — checkout is a no-op then.
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    git checkout "$BRANCH" >&2 2>/dev/null || true
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
