#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# set_ticket_size.sh <ticket_number> <XS|S|M|L|XL>
#
# Sets the t-shirt complexity of an issue on the EGAPRO V2 project board.
# Writes BOTH fields in one shot:
#   - Size     (single-select XS/S/M/L/XL) — human-readable
#   - Estimate (number, Fibonacci points)  — summed by /velocity
#
# Mapping (cf. .claude/rules/complexity-estimation.md):
#   XS=1  S=2  M=3  L=5  XL=8
#
# Idempotent: re-running with a different size overwrites both fields.
# Adds the issue to the project first if it isn't a project item yet.
#
# Only LEAF tickets (Task / Bug) get sized — never the epic (Feature),
# whose load is the sum of its children. This script does not enforce the
# issue type; the caller (architect / bug-analyst) is responsible for only
# sizing leaves (see complexity-estimation.md "Périmètre").
#
# Usage:
#   set_ticket_size.sh 123 M
#   set_ticket_size.sh 123 XL
#
# Env (overridable, defaults from .claude/rules/github-board.md):
#   EGAPRO_PROJECT_ID         — project ID
#   EGAPRO_SIZE_FIELD_ID      — Size single-select field ID
#   EGAPRO_ESTIMATE_FIELD_ID  — Estimate number field ID

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ticket_number> <XS|S|M|L|XL>" >&2
    exit 2
fi

TICKET="$1"
SIZE_RAW="$2"

PROJECT_ID="${EGAPRO_PROJECT_ID:-PVT_kwDOAh0HH84BFsK7}"
SIZE_FIELD_ID="${EGAPRO_SIZE_FIELD_ID:-PVTSSF_lADOAh0HH84BFsK7zg29ENU}"
ESTIMATE_FIELD_ID="${EGAPRO_ESTIMATE_FIELD_ID:-PVTF_lADOAh0HH84BFsK7zg29ENY}"

# Map t-shirt size -> (single-select option ID, Fibonacci points)
case "$(echo "$SIZE_RAW" | tr '[:lower:]' '[:upper:]')" in
    XS) OPTION_ID="6c6483d2"; POINTS=1 ;;
    S)  OPTION_ID="f784b110"; POINTS=2 ;;
    M)  OPTION_ID="7515a9f1"; POINTS=3 ;;
    L)  OPTION_ID="817d0097"; POINTS=5 ;;
    XL) OPTION_ID="db339eb2"; POINTS=8 ;;
    *)
        echo "ERROR: unknown size '$SIZE_RAW' — expected one of XS S M L XL" >&2
        exit 2
        ;;
esac

# 1. Resolve issue node ID
NODE_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) { id }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" \
  --jq '.data.repository.issue.id')

if [ -z "$NODE_ID" ] || [ "$NODE_ID" = "null" ]; then
    echo "ERROR: issue #$TICKET not found" >&2
    exit 1
fi

# 2. Find the project item ID (or add the issue to the project)
ITEM_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) {
      projectItems(first: 10) { nodes { id project { id } } }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" \
  --jq ".data.repository.issue.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id" | head -1)

if [ -z "$ITEM_ID" ]; then
    ITEM_ID=$(gh api graphql -f query='
mutation($project:ID!, $content:ID!) {
  addProjectV2ItemById(input: { projectId: $project, contentId: $content }) {
    item { id }
  }
}' -f project="$PROJECT_ID" -f content="$NODE_ID" \
      --jq '.data.addProjectV2ItemById.item.id')
fi

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
    echo "ERROR: could not resolve/create project item for #$TICKET" >&2
    exit 1
fi

# 3a. Set Size (single-select)
gh api graphql -f query='
mutation($project:ID!, $item:ID!, $field:ID!, $option:String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project, itemId: $item, fieldId: $field,
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}' -f project="$PROJECT_ID" -f item="$ITEM_ID" \
   -f field="$SIZE_FIELD_ID" -f option="$OPTION_ID" >/dev/null

# 3b. Set Estimate (number) — Fibonacci points
gh api graphql -f query='
mutation($project:ID!, $item:ID!, $field:ID!, $points:Float!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project, itemId: $item, fieldId: $field,
    value: { number: $points }
  }) { projectV2Item { id } }
}' -f project="$PROJECT_ID" -f item="$ITEM_ID" \
   -f field="$ESTIMATE_FIELD_ID" -F points="$POINTS" >/dev/null

echo "✓ #$TICKET sized $(echo "$SIZE_RAW" | tr '[:lower:]' '[:upper:]') ($POINTS pts)"
