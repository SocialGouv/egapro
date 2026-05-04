#!/usr/bin/env bash
# cleanup_terminal_worktrees.sh <epic_N1> [<epic_N2> ...]
#
# Scans worktrees matching egapro-epic<E>-t<N> for the given epics, and
# tears down + removes the worktree if the ticket has been squash-merged
# into the epic integration branch — detected by the absence of the
# ticket's `ticket/<N>-*` branch on origin (GitHub auto-deletes the
# head branch on squash-merge).
#
# Called by epic_loop.sh at the BEGINNING of each tick — before
# dispatch_plan — so that slots get freed dynamically. Important when an
# epic has more tickets than EPIC_MAX_PARALLEL (default 5): without this,
# the 6th ticket can never enter the loop because all slots stay busy
# until the user manually cleans them up.
#
# Why branch presence (not board status): the board transitions
# `In review` and `Done` are user-only by design (cf. code-dev/AGENT.md
# step 10 + set_ticket_status.sh hard rule). The agent's terminus is the
# squash-merge of the validated PR ; that's what frees the worktree.
#
# Idempotent. No-op if no worktree matches or none has been merged yet.

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <epic_N1> [<epic_N2> ...]" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Build a regex from the epic args
EPICS_REGEX=""
for epic in "$@"; do
    [ -n "$EPICS_REGEX" ] && EPICS_REGEX="${EPICS_REGEX}|"
    EPICS_REGEX="${EPICS_REGEX}${epic}"
done

# Refresh remote refs so `git ls-remote` reflects recent merges
(cd "$REPO_ROOT" && git fetch --prune origin >/dev/null 2>&1) || true

# For each worktree matching the given epics, check whether the ticket
# branch is still on origin (= still in flight) or gone (= squash-merged).
while IFS= read -r path; do
    [ -n "$path" ] || continue

    name=$(basename "$path")
    if ! [[ "$name" =~ ^egapro-epic([0-9]+)-t([0-9]+)$ ]]; then
        continue
    fi

    epic="${BASH_REMATCH[1]}"
    ticket="${BASH_REMATCH[2]}"

    # Filter: only care about worktrees whose epic is in the args
    if ! echo "$epic" | grep -qE "^(${EPICS_REGEX})$"; then
        continue
    fi

    if git ls-remote --exit-code --heads origin "ticket/${ticket}-*" >/dev/null 2>&1; then
        # Branch still on origin → ticket still in flight → keep worktree
        :
    else
        echo "[cleanup_terminal_worktrees] $name (ticket #$ticket: branch deleted on origin = squash-merged) → teardown + remove" >&2
        (cd "$path" && bash "$REPO_ROOT/scripts/teardown-worktree.sh" >&2 2>&1) || true
        git worktree remove --force "$path" >&2 2>&1 || true
    fi
done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')
