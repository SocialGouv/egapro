#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# set_ticket_status.sh <ticket_number> <status_label>
#
# Moves an issue to the given status on the EGAPRO V2 GitHub project board.
# Encapsulates the 3 GraphQL calls described in .claude/rules/github-board.md
# (snippets 1, 2, 3, 4) into a single command:
#
#   1. Resolve issue node ID (or get it from cache)
#   2. Find or create the project item ID for this issue
#   3. Update the Status single-select field
#
# Status labels are case-insensitive and accept the human-readable names from
# the board: "Backlog", "To Do", "In progress", "In review", "Done".
#
# === HARD RULES ===
# Two transitions are USER-ONLY — agents must never trigger them :
# 1. "Done" — set by the user once they validate the merged work.
# 2. "In review" — set by the user once they decide a PR is ready for their
#    own review. AI's terminus is the JSON `validated` return + the PR being
#    out of draft (`gh pr ready`) ; the ticket stays at `In progress` until
#    the human moves it.
# This script REJECTS both transitions with exit code 3.
#
# Usage:
#   set_ticket_status.sh 123 "In progress"
#   set_ticket_status.sh 123 "In review"
#
# Env:
#   EGAPRO_PROJECT_ID       — override project ID (default: PVT_kwDOAh0HH84BFsK7)
#   EGAPRO_STATUS_FIELD_ID  — override status field ID (default: PVTSSF_lADOAh0HH84BFsK7zg29EI8)

set -euo pipefail

# Resolve script dir to locate sibling scripts (set_ticket_date.sh).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ticket_number> <status_label>" >&2
    echo "  status_label: Backlog | To Do | In progress | In review" >&2
    exit 2
fi

TICKET="$1"
STATUS_RAW="$2"

PROJECT_ID="${EGAPRO_PROJECT_ID:-PVT_kwDOAh0HH84BFsK7}"
STATUS_FIELD_ID="${EGAPRO_STATUS_FIELD_ID:-PVTSSF_lADOAh0HH84BFsK7zg29EI8}"

# Map human-readable label to single-select option ID
# (cf. .claude/rules/github-board.md)
case "$STATUS_RAW" in
    Backlog|backlog)               OPTION_ID="f75ad846" ;;
    "To Do"|"To do"|"to do"|Todo|todo) OPTION_ID="61e4505c" ;;
    "In progress"|"In Progress"|"in progress"|"In-progress") OPTION_ID="47fc9ee4" ;;
    "In review"|"In Review"|"in review"|"In-review")
        echo "REFUSED: AI agents must never set a ticket to 'In review' — that's user-only." >&2
        echo "  AI's terminus is `validated` JSON + `gh pr ready`; ticket #$TICKET stays at 'In progress'." >&2
        exit 3
        ;;
    Done|done)
        echo "REFUSED: AI agents must never set a ticket to 'Done' — that's user-only." >&2
        echo "  Ticket #$TICKET stays at its current status." >&2
        exit 3
        ;;
    *)
        echo "ERROR: unknown status label '$STATUS_RAW'" >&2
        echo "  Accepted (agents): Backlog | To Do | In progress" >&2
        echo "  Accepted (user): + In review | Done" >&2
        exit 2
        ;;
esac

# 1. Resolve issue node ID
NODE_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) { id }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" --jq '.data.repository.issue.id')

if [ -z "$NODE_ID" ] || [ "$NODE_ID" = "null" ]; then
    echo "ERROR: issue #$TICKET not found in SocialGouv/egapro" >&2
    exit 1
fi

# 2. Find existing project item ID, or add the issue to the project
ITEM_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) {
      projectItems(first: 5) {
        nodes { id project { id } }
      }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" \
  --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id" \
  | head -1 || true)

if [ -z "$ITEM_ID" ]; then
    # Not on the project yet — add it
    ITEM_ID=$(gh api graphql -f query='
mutation($project:ID!, $content:ID!) {
  addProjectV2ItemById(input: { projectId: $project, contentId: $content }) {
    item { id }
  }
}' -f project="$PROJECT_ID" -f content="$NODE_ID" --jq '.data.addProjectV2ItemById.item.id')
fi

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
    echo "ERROR: failed to resolve project item for issue #$TICKET" >&2
    exit 1
fi

# 3. Update the Status field
gh api graphql -f query='
mutation($project:ID!, $item:ID!, $field:ID!, $option:String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project,
    itemId: $item,
    fieldId: $field,
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}' \
  -f project="$PROJECT_ID" \
  -f item="$ITEM_ID" \
  -f field="$STATUS_FIELD_ID" \
  -f option="$OPTION_ID" \
  --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id' >/dev/null

echo "ticket #$TICKET → $STATUS_RAW"

# Stamp the Start date on the first "In progress" transition (idempotent).
# This is the single choke point for "implementation started" across every mode
# (/implement task/bug, code-dev, epic_loop), so the board's Start date column
# is populated automatically. Best-effort: never fail the status move on this.
if [ "$OPTION_ID" = "47fc9ee4" ]; then
    bash "$SCRIPT_DIR/set_ticket_date.sh" "$TICKET" start --if-empty >/dev/null 2>&1 || true
fi
