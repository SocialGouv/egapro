#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# backfill_ticket_dates.sh [--dry-run] [--force]
#
# One-off (idempotent, re-runnable) backfill of the "Start date" / "End date"
# columns on the EGAPRO V2 board for tickets that already went through the
# pipeline, from durable GitHub data:
#
#   Start date = date of the FIRST commit on the ticket's merged PR
#   End date   = date the PR was merged
#
# Scope: leaf issues only (type Task / Bug) that are on the project AND have a
# merged linked PR. Feature/epic issues are skipped (they are not leaves).
#
# Options:
#   --dry-run   Print what would be written, without touching the board.
#   --force     Overwrite existing values. Default is --if-empty (never clobber
#               a value already set live by the pipeline).
#
# Writes go through set_ticket_date.sh (single write primitive). Uses the local
# `gh` auth, which already has project write access (same as set_ticket_size.sh
# / set_ticket_status.sh).
#
# Usage:
#   backfill_ticket_dates.sh --dry-run     # inspect first
#   backfill_ticket_dates.sh               # apply (if-empty)
#   backfill_ticket_dates.sh --force       # apply, overwriting

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="${EGAPRO_PROJECT_ID:-PVT_kwDOAh0HH84BFsK7}"

DRY_RUN=0
FORCE=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --force)   FORCE=1 ;;
        *) echo "ERROR: unknown argument '$arg'" >&2; exit 2 ;;
    esac
done

IF_EMPTY_FLAG="--if-empty"
[ "$FORCE" = "1" ] && IF_EMPTY_FLAG=""

# 1. Collect leaf ticket numbers (Task / Bug) currently on the project.
echo "Collecting Task/Bug items on the project..." >&2
TICKETS=$(gh api graphql --paginate -f project="$PROJECT_ID" -f query='
query($project:ID!, $endCursor:String) {
  node(id: $project) {
    ... on ProjectV2 {
      items(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          content {
            __typename
            ... on Issue { number issueType { name } }
          }
        }
      }
    }
  }
}' --jq '.data.node.items.nodes[]
          | select(.content.__typename == "Issue")
          | select(.content.issueType.name == "Task" or .content.issueType.name == "Bug")
          | .content.number' | sort -un)

if [ -z "$TICKETS" ]; then
    echo "No Task/Bug items found on the project." >&2
    exit 0
fi

COUNT=0
PROCESSED=0
SKIPPED=0

# 2. For each ticket, resolve its merged PR and compute the two dates.
for N in $TICKETS; do
    COUNT=$((COUNT + 1))

    # Prefer the merged PR whose head branch follows the ticket/<N>-* convention;
    # otherwise fall back to the most recently merged linked PR.
    PR_JSON=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $n) {
      closedByPullRequestsReferences(first: 20, includeClosedPrs: true) {
        nodes {
          number state mergedAt headRefName
          commits(first: 1) { nodes { commit { committedDate } } }
        }
      }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F n="$N" \
      --jq '[.data.repository.issue.closedByPullRequestsReferences.nodes[]
             | select(.state == "MERGED" and .mergedAt != null)]' 2>/dev/null || echo "[]")

    # Pick: ticket/<N>-* branch first, else the latest merged (by mergedAt).
    PICK=$(echo "$PR_JSON" | jq -c --arg t "ticket/${N}-" '
        (map(select(.headRefName | startswith($t))) | sort_by(.mergedAt) | last)
        // (sort_by(.mergedAt) | last)
        // empty')

    if [ -z "$PICK" ] || [ "$PICK" = "null" ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    START_DATE=$(echo "$PICK" | jq -r '.commits.nodes[0].commit.committedDate // ""' | cut -dT -f1)
    END_DATE=$(echo "$PICK" | jq -r '.mergedAt // ""' | cut -dT -f1)
    PR_NUM=$(echo "$PICK" | jq -r '.number')

    if [ -z "$START_DATE" ] && [ -z "$END_DATE" ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    if [ "$DRY_RUN" = "1" ]; then
        echo "[dry-run] #$N (PR #$PR_NUM): start=${START_DATE:-—} end=${END_DATE:-—}"
        continue
    fi

    # shellcheck disable=SC2086
    [ -n "$START_DATE" ] && bash "$SCRIPT_DIR/set_ticket_date.sh" "$N" start $IF_EMPTY_FLAG "$START_DATE" || true
    # shellcheck disable=SC2086
    [ -n "$END_DATE" ] && bash "$SCRIPT_DIR/set_ticket_date.sh" "$N" end $IF_EMPTY_FLAG "$END_DATE" || true
    # Counts tickets with a merged PR that were processed; individual writes may
    # still be no-ops when --if-empty finds a value already set.
    PROCESSED=$((PROCESSED + 1))
done

echo "" >&2
if [ "$DRY_RUN" = "1" ]; then
    echo "Dry-run complete: $COUNT ticket(s) inspected." >&2
else
    echo "Backfill complete: $COUNT inspected, $PROCESSED processed (had merged PR), $SKIPPED skipped (no merged PR)." >&2
fi
