#!/usr/bin/env bash
# cleanup_terminal_worktrees.sh <epic_N1> [<epic_N2> ...]
#
# Scans worktrees matching egapro-epic<E>-t<N> for the given epics, queries
# each ticket's board status, and tears down + removes the worktree if the
# ticket is in a terminal pipeline state (In review or Done).
#
# Called by epic_loop.sh at the BEGINNING of each tick — before
# dispatch_plan — so that slots get freed dynamically. Important when an
# epic has more tickets than EPIC_MAX_PARALLEL (default 5): without this,
# the 6th ticket can never enter the loop because all slots stay busy
# until the user manually cleans them up.
#
# 'Cleanable' definition: PR is green and bot reviews have been addressed.
# This is exactly what code-dev returning `validated` guarantees, which is
# also what triggers the board transition to 'In review'. So checking the
# board status is enough.
#
# Idempotent. No-op if no worktree matches or none is in terminal state.

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

# For each worktree matching the given epics, check the ticket status
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

    # Query the ticket's board status. Use the bulk GraphQL pattern from
    # rules/github-board.md (snippet 3) to find the project item, then
    # extract the Status single-select value.
    STATUS=$(gh api graphql -f query='
        query($owner:String!, $repo:String!, $n:Int!) {
          repository(owner:$owner, name:$repo) {
            issue(number:$n) {
              projectItems(first: 5) {
                nodes {
                  project { id }
                  fieldValues(first: 10) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field { ... on ProjectV2SingleSelectField { name } }
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }' -f owner=SocialGouv -f repo=egapro -F n="$ticket" \
        --jq '.data.repository.issue.projectItems.nodes[] | select(.project.id == "PVT_kwDOAh0HH84BFsK7") | .fieldValues.nodes[]? | select(.field.name == "Status") | .name' 2>/dev/null | head -1)

    case "$STATUS" in
        "In review"|"Done")
            echo "[cleanup_terminal_worktrees] $name (ticket #$ticket = $STATUS) → teardown + remove" >&2
            (cd "$path" && bash "$REPO_ROOT/scripts/teardown-worktree.sh" >&2 2>&1) || true
            git worktree remove --force "$path" >&2 2>&1 || true
            ;;
        *)
            # In progress / To Do / Backlog → keep the worktree
            :
            ;;
    esac
done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')
