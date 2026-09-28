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
#                Fails CLOSED: if the current value cannot be read, the script
#                aborts instead of writing. set_ticket_status.sh re-stamps the
#                Start date on every 'In progress' transition, so writing on an
#                unverified read would silently reset the original date.
#   YYYY-MM-DD   Explicit date (any positional arg matching the pattern).
#                Defaults to today (`date +%F`).
#
# Exit codes: 0 ok / skipped, 1 resolution or permission error, 2 usage error.
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

# 2. Find existing project item ID, or add the issue to the project.
# Careful: a token without `organization_projects` does NOT make this query
# fail — projectItems simply returns an EMPTY list. "Not on the board yet" and
# "no read access to the board" are therefore indistinguishable here, and the
# missing scope only surfaces on the addProjectV2ItemById below (403). The
# guard here still catches genuine API/network errors.
if ! ITEMS=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) {
      projectItems(first: 5) {
        nodes { id project { id } }
      }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" \
  --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id"); then
    echo "ERROR: cannot read the project items of issue #$TICKET (gh error above)." >&2
    echo "  Aborting rather than falling through to addProjectV2ItemById, which" >&2
    echo "  would add the issue to the board as a side effect of an API failure." >&2
    exit 1
fi

ITEM_COUNT=$(printf '%s' "$ITEMS" | grep -c . || true)
ITEM_ID=$(printf '%s\n' "$ITEMS" | head -1)

if [ "${ITEM_COUNT:-0}" -gt 1 ]; then
    echo "WARNING: issue #$TICKET has $ITEM_COUNT items on project $PROJECT_ID (duplicates?) — using $ITEM_ID" >&2
fi

if [ -z "$ITEM_ID" ]; then
    if ! ITEM_ID=$(gh api graphql -f query='
mutation($project:ID!, $content:ID!) {
  addProjectV2ItemById(input: { projectId: $project, contentId: $content }) {
    item { id }
  }
}' -f project="$PROJECT_ID" -f content="$NODE_ID" --jq '.data.addProjectV2ItemById.item.id'); then
        echo "ERROR: cannot add issue #$TICKET to project $PROJECT_ID." >&2
        echo "  If gh reported 'Resource not accessible by integration', the token has" >&2
        echo "  no 'organization_projects' access — and the empty projectItems read above" >&2
        echo "  was a symptom of that same missing scope, not proof that the issue is" >&2
        echo "  absent from the board. See the PREREQUISITES header of" >&2
        echo "  .github/workflows/ticket-end-date.yaml." >&2
        exit 1
    fi
fi

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
    echo "ERROR: failed to resolve project item for issue #$TICKET" >&2
    exit 1
fi

# 3. Idempotency guard — skip if the field already holds a value.
# Read by field ID (same key the write uses) so an EGAPRO_*_FIELD_ID env
# override stays consistent between the guard and the mutation.
if [ "$IF_EMPTY" = "1" ]; then
    # Fail closed. Writing on a failed read would defeat the whole point of the
    # flag: set_ticket_status.sh calls `start --if-empty` on every 'In progress'
    # transition, so one transient read error would be enough to overwrite the
    # original Start date with today's, leaving no trace in the data.
    if ! CURRENT=$(gh api graphql -f query='
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
      --jq "[.data.node.fieldValues.nodes[] | select(.field.id == \"$FIELD_ID\") | .date] | .[0] // \"\""); then
        echo "ERROR: cannot read the current $FIELD_NAME of ticket #$TICKET." >&2
        echo "  --if-empty exists to keep the FIRST value ever set, so writing on an" >&2
        echo "  unverified read would clobber it. Aborting instead of writing blind." >&2
        echo "  See the PREREQUISITES header of .github/workflows/ticket-end-date.yaml." >&2
        exit 1
    fi

    if [ -n "$CURRENT" ] && [ "$CURRENT" != "null" ]; then
        echo "ticket #$TICKET → $FIELD_NAME already set ($CURRENT), skipping" >&2
        exit 0
    fi
fi

# 4. Write the DATE field
if ! gh api graphql -f query='
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
  --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id' >/dev/null; then
    echo "ERROR: cannot write $FIELD_NAME on ticket #$TICKET (gh error above)." >&2
    echo "  If it reads 'Resource not accessible by integration', the token has no" >&2
    echo "  'organization_projects: write' on the EGAPRO V2 board. Locally, check" >&2
    echo "  that 'gh auth status' lists the 'project' scope; in CI the token comes" >&2
    echo "  from token-bureau — see the PREREQUISITES header of" >&2
    echo "  .github/workflows/ticket-end-date.yaml." >&2
    exit 1
fi

echo "ticket #$TICKET → $FIELD_NAME = $DATE"
