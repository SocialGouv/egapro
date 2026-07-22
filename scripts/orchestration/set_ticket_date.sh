#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# set_ticket_date.sh <ticket_number> <start|end> [--if-empty] [YYYY-MM-DD]
#
# Writes a DATE field on the EGAPRO V2 GitHub project board:
#   start -> "Start date"  (implementation start)
#   end   -> "End date"    (PR merge)
#
# Encapsulates the same node-id -> project-item-id resolution as
# set_ticket_status.sh, then writes the DATE field via
# updateProjectV2ItemFieldValue { value: { date: "YYYY-MM-DD" } }.
#
# This is the single write primitive shared by:
#   - set_ticket_status.sh   (stamps Start date on the "In progress" transition)
#   - backfill_ticket_dates.sh (historical backfill, both fields)
#   - .github/workflows/ticket-end-date.yaml (stamps End date on PR merge)
#
# Options:
#   --if-empty   Skip the write if the field already holds a value. Keeps the
#                FIRST value that was ever set (e.g. a re-dispatch that goes
#                To Do -> In progress again does not reset the original start).
#   YYYY-MM-DD   Explicit date (any positional arg matching the pattern).
#                Defaults to today (`date +%F`).
#
# Exit codes: 0 ok / skipped, 1 resolution error, 2 usage error.
#
# Usage:
#   set_ticket_date.sh 123 start                 # Start date = today
#   set_ticket_date.sh 123 start --if-empty      # Start date = today, only if empty
#   set_ticket_date.sh 123 end 2026-07-22        # End date = 2026-07-22
#
# Env:
#   EGAPRO_PROJECT_ID           — override project ID
#   EGAPRO_START_DATE_FIELD_ID  — override Start date field ID
#   EGAPRO_END_DATE_FIELD_ID    — override End date field ID

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ticket_number> <start|end> [--if-empty] [YYYY-MM-DD]" >&2
    exit 2
fi

TICKET="$1"
KIND="$2"
shift 2

IF_EMPTY=0
DATE=""
while [ $# -gt 0 ]; do
    case "$1" in
        --if-empty) IF_EMPTY=1 ;;
        [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) DATE="$1" ;;
        *) echo "ERROR: unknown argument '$1'" >&2; exit 2 ;;
    esac
    shift
done

[ -z "$DATE" ] && DATE="$(date +%F)"

PROJECT_ID="${EGAPRO_PROJECT_ID:-PVT_kwDOAh0HH84BFsK7}"
START_FIELD_ID="${EGAPRO_START_DATE_FIELD_ID:-PVTF_lADOAh0HH84BFsK7zg29ENc}"
END_FIELD_ID="${EGAPRO_END_DATE_FIELD_ID:-PVTF_lADOAh0HH84BFsK7zg29ENg}"

case "$KIND" in
    start|Start) FIELD_ID="$START_FIELD_ID"; FIELD_NAME="Start date" ;;
    end|End)     FIELD_ID="$END_FIELD_ID";   FIELD_NAME="End date" ;;
    *) echo "ERROR: kind must be 'start' or 'end' (got '$KIND')" >&2; exit 2 ;;
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

# 3. Idempotency guard — skip if the field already holds a value.
# Read by field ID (same key the write uses) so an EGAPRO_*_FIELD_ID env
# override stays consistent between the guard and the mutation.
if [ "$IF_EMPTY" = "1" ]; then
    CURRENT=$(gh api graphql -f query='
query($item:ID!) {
  node(id: $item) {
    ... on ProjectV2Item {
      fieldValues(first: 50) {
        nodes {
          __typename
          ... on ProjectV2ItemFieldDateValue {
            field { ... on ProjectV2FieldCommon { id } }
            date
          }
        }
      }
    }
  }
}' -f item="$ITEM_ID" \
      --jq "[.data.node.fieldValues.nodes[] | select(.field.id == \"$FIELD_ID\") | .date] | .[0] // \"\"" \
      2>/dev/null || echo "")
    if [ -n "$CURRENT" ] && [ "$CURRENT" != "null" ]; then
        echo "ticket #$TICKET → $FIELD_NAME already set ($CURRENT), skipping" >&2
        exit 0
    fi
fi

# 4. Write the DATE field
gh api graphql -f query='
mutation($project:ID!, $item:ID!, $field:ID!, $date:Date!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project,
    itemId: $item,
    fieldId: $field,
    value: { date: $date }
  }) { projectV2Item { id } }
}' \
  -f project="$PROJECT_ID" \
  -f item="$ITEM_ID" \
  -f field="$FIELD_ID" \
  -f date="$DATE" \
  --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id' >/dev/null

echo "ticket #$TICKET → $FIELD_NAME = $DATE"
