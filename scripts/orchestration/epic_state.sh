#!/usr/bin/env bash
# epic_state.sh <epic_N1> [<epic_N2> ...]
#
# Compact status dump for one or more epics. Replaces N individual
# `gh issue view` calls that flood the orchestrator's context.
#
# Output format (one line per sub-ticket):
#   #N | STATUS       | LABELS              | LAST_EVENT      | AGE   | retries=K | PR
#
# Example:
#   === EPIC #42 ===
#   #123 | In progress  | code,frontend       | PR_DRAFT        | 2m    | retries=0 | PR#456
#   #124 | To Do        | code,complexe       | -               | -     | retries=0 | -
#   #125 | In review    | code                | COMPLETE        | 56m   | retries=1 | PR#458
#
# A single GraphQL query per epic fetches sub-issues + their labels + their
# board status (via projectItems.fieldValues). Cache key `epic_${N}_full`
# (TTL 300s) is shared with dispatch_plan.sh — one refresh feeds both scripts.
#
# Env:
#   EGAPRO_STATE_ROOT — state dir (default: derived from script path)

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <epic_N1> [<epic_N2> ...]" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_DIR="${STATE_ROOT}/agents"
NOW_TS=$(date '+%s')

for EPIC_N in "$@"; do
    echo "=== EPIC #${EPIC_N} ==="

    # Get epic node ID (cache 1h, never changes)
    EPIC_ID=$("$SCRIPT_DIR/cache_gh.sh" "epic_${EPIC_N}_id" 3600 -- gh issue view "$EPIC_N" --json id --jq '.id' 2>/dev/null || echo "")
    if [ -z "$EPIC_ID" ]; then
        echo "  ERREUR: epic #${EPIC_N} introuvable"
        continue
    fi

    # Bulk query: sub-issues + labels + project board status (cache 300s)
    SUB_ISSUES=$("$SCRIPT_DIR/cache_gh.sh" "epic_${EPIC_N}_full" 300 -- gh api graphql -f query="{
        node(id: \"${EPIC_ID}\") {
            ... on Issue {
                subIssues(first: 50) {
                    nodes {
                        number
                        state
                        labels(first: 5) { nodes { name } }
                        projectItems(first: 1) {
                            nodes {
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
            }
        }
    }" --jq '.data.node.subIssues.nodes')

    if [ -z "$SUB_ISSUES" ] || [ "$SUB_ISSUES" = "null" ]; then
        echo "  (aucune sub-issue)"
        continue
    fi

    echo "$SUB_ISSUES" | jq -c '.[]' | while read -r issue; do
        N=$(echo "$issue" | jq -r '.number')
        LABELS=$(echo "$issue" | jq -r '[.labels.nodes[].name] | join(",")')

        STATUS=$(echo "$issue" | jq -r '.projectItems.nodes[0].fieldValues.nodes[]? | select(.field.name == "Status") | .name' 2>/dev/null | head -1)
        [ -z "$STATUS" ] || [ "$STATUS" = "null" ] && STATUS="-"

        # Latest log event across all agents on this ticket
        LAST_EVENT="-"
        AGE="-"
        RETRIES=0
        LATEST_LOG=""
        LATEST_MTIME=0

        if [ -d "$LOG_DIR" ]; then
            for log in "$LOG_DIR"/*-${N}.log; do
                [ -f "$log" ] || continue
                MTIME=$(stat -c '%Y' "$log")
                if [ "$MTIME" -gt "$LATEST_MTIME" ]; then
                    LATEST_MTIME=$MTIME
                    LATEST_LOG=$log
                fi
                R=$(awk '/\[RETRY/ {c++} END {print c+0}' "$log")
                RETRIES=$((RETRIES + R))
            done
        fi

        if [ -n "$LATEST_LOG" ]; then
            LAST_LINE=$(tail -n 1 "$LATEST_LOG")
            LAST_EVENT=$(echo "$LAST_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]')
            [ -z "$LAST_EVENT" ] && LAST_EVENT="-"
            AGE_SEC=$((NOW_TS - LATEST_MTIME))
            if [ "$AGE_SEC" -lt 60 ]; then
                AGE="${AGE_SEC}s"
            else
                AGE="$((AGE_SEC / 60))m"
            fi
        fi

        # Linked PR (cache per ticket 60s) — looks for "Resolves #N" in PR body
        PR=$("$SCRIPT_DIR/cache_gh.sh" "pr_for_${N}" 60 -- gh pr list --search "\"Resolves #${N}\"" --state all --limit 1 --json number --jq '.[0].number // ""' 2>/dev/null || echo "")
        [ -z "$PR" ] && PR="-" || PR="PR#${PR}"

        printf "  #%-5s | %-12s | %-19s | %-16s | %-5s | retries=%s | %s\n" \
            "$N" "$STATUS" "${LABELS:0:19}" "$LAST_EVENT" "$AGE" "$RETRIES" "$PR"
    done
done
