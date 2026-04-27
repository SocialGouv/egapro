#!/usr/bin/env bash
# process_tick_result.sh <result_file>
#
# Reads a tick result file produced by epic_loop.sh and applies the side
# effects (board status, labels, attempt counter, cache invalidation) for
# each sub-agent return.
#
# Result file format (written by epic_loop.sh):
#   {
#     "tick": 0,
#     "epics": "42",
#     "results": [
#       {"status":"validated","ticket":123,"pr":456},
#       {"status":"refacto","ticket":124,"reason":"..."},
#       {"status":"needs_opus_escalation","ticket":125},
#       {"status":"rate_limited","ticket":126,"retry_in":120},
#       {"status":"failed","ticket":127,"reason":"..."}
#     ]
#   }
#
# Per-status actions:
#
# | Status                  | Board change           | Labels                                    | Counter         |
# |-------------------------|------------------------|-------------------------------------------|-----------------|
# | validated               | none (already In rev.) | clear attempt=N                           | reset           |
# | needs_opus_escalation   | → To Do                | + complexe                                | reset           |
# | refacto                 | → To Do                | bump attempt=N (1→2→3); +dispatch=escalate at 3 | +1              |
# | rate_limited            | none                   | none (handled by loop driver)             | unchanged       |
# | failed                  | → To Do                | none (technical, not semantic)            | unchanged       |
#
# === HARD RULE ===
# This script NEVER merges PRs and NEVER sets a ticket to 'Done'.
# `validated` means code-dev has already moved the ticket to 'In review' and
# the PR is ready — human review takes over from there.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <result_file>" >&2
    exit 2
fi

RESULT_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$RESULT_FILE" ]; then
    echo "ERREUR: result_file introuvable: $RESULT_FILE" >&2
    exit 1
fi

TICK=$(jq -r '.tick' "$RESULT_FILE")
EPICS=$(jq -r '.epics // ""' "$RESULT_FILE")
AID="epic-orchestrator-${EPICS:-unknown}"

# Counters for the summary
N_VALIDATED=0
N_OPUS=0
N_REFACTO=0
N_ESCALATE=0
N_RATE_LIMITED=0
N_FAILED=0

# Helper: drop cached gh data for a given ticket + invalidate the bulk
# `epic_*_full` keys so the next dispatch_plan sees fresh state.
invalidate_caches() {
    local TICKET="$1"
    rm -f /tmp/egapro_gh_cache/epic_*_full.json 2>/dev/null || true
    rm -f "/tmp/egapro_gh_cache/ticket_${TICKET}_labels.json" 2>/dev/null || true
    rm -f "/tmp/egapro_gh_cache/ticket_branch_${TICKET}.json" 2>/dev/null || true
    rm -f "/tmp/egapro_gh_cache/pr_for_${TICKET}.json" 2>/dev/null || true
}

# Helper: read current attempt count from labels (returns 0..3, default 0)
get_attempt() {
    local TICKET="$1"
    local LABELS
    LABELS=$(gh issue view "$TICKET" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || echo "")
    if echo "$LABELS" | grep -qE '(^|,)attempt=3(,|$)'; then echo 3
    elif echo "$LABELS" | grep -qE '(^|,)attempt=2(,|$)'; then echo 2
    elif echo "$LABELS" | grep -qE '(^|,)attempt=1(,|$)'; then echo 1
    else echo 0
    fi
}

# Helper: clear all attempt=N labels from a ticket
clear_attempt_labels() {
    local TICKET="$1"
    for k in 1 2 3; do
        gh issue edit "$TICKET" --remove-label "attempt=$k" >/dev/null 2>&1 || true
    done
}

# Helper: set attempt=N label (clears the others first)
set_attempt_label() {
    local TICKET="$1"
    local N="$2"
    clear_attempt_labels "$TICKET"
    gh issue edit "$TICKET" --add-label "attempt=$N" >/dev/null 2>&1 || true
}

jq -c '.results[]' "$RESULT_FILE" | while read -r result; do
    STATUS=$(echo "$result" | jq -r '.status // "unknown"')
    TICKET=$(echo "$result" | jq -r '.ticket // 0')
    PR=$(echo "$result" | jq -r '.pr // ""')

    case "$STATUS" in
        validated)
            # code-dev has set 'In review' and pr ready. Just reset attempt counter.
            clear_attempt_labels "$TICKET"
            invalidate_caches "$TICKET"
            # Cross-reference the PR on the ticket (GitHub's native auto-link
            # via Closes #N doesn't fire when the PR base isn't the default
            # branch — typical of our stacked PR / transition-base runs).
            if [ -n "$PR" ] && [ "$PR" != "null" ]; then
                bash "$SCRIPT_DIR/link_pr_to_ticket.sh" "$TICKET" "$PR" || true
            fi
            bash "$SCRIPT_DIR/log_event.sh" "$AID" VALIDATED "ticket=$TICKET pr=$PR"
            echo "  ✓ ticket #$TICKET validated (In review, PR ready)"
            N_VALIDATED=$((N_VALIDATED + 1))
            ;;

        needs_opus_escalation)
            gh issue edit "$TICKET" --add-label "complexe" >/dev/null 2>&1 || true
            clear_attempt_labels "$TICKET"
            bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "To Do" >/dev/null
            invalidate_caches "$TICKET"
            bash "$SCRIPT_DIR/log_event.sh" "$AID" ESCALATE_OPUS "ticket=$TICKET"
            echo "  → ticket #$TICKET escalated to Opus (label complexe, set To Do)"
            N_OPUS=$((N_OPUS + 1))
            ;;

        refacto)
            REASON=$(echo "$result" | jq -r '.reason // "unknown"')
            CURRENT=$(get_attempt "$TICKET")
            NEXT=$((CURRENT + 1))
            if [ "$NEXT" -ge 3 ]; then
                # Third consecutive refacto → human escalation
                set_attempt_label "$TICKET" 3
                gh issue edit "$TICKET" --add-label "dispatch=escalate" >/dev/null 2>&1 || true
                bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "To Do" >/dev/null
                invalidate_caches "$TICKET"
                bash "$SCRIPT_DIR/log_event.sh" "$AID" ESCALATE_USER "ticket=$TICKET attempts=$NEXT reason=$REASON"
                echo "  ⚠ ticket #$TICKET escalated to user (3 consecutive refacto, dispatch=escalate set)"
                N_ESCALATE=$((N_ESCALATE + 1))
            else
                set_attempt_label "$TICKET" "$NEXT"
                bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "To Do" >/dev/null
                invalidate_caches "$TICKET"
                bash "$SCRIPT_DIR/log_event.sh" "$AID" REFACTO "ticket=$TICKET attempts=$NEXT reason=$REASON"
                echo "  → ticket #$TICKET refacto (attempt $NEXT/3, set To Do for next tick)"
                N_REFACTO=$((N_REFACTO + 1))
            fi
            ;;

        rate_limited)
            RETRY_IN=$(echo "$result" | jq -r '.retry_in // 120')
            bash "$SCRIPT_DIR/log_event.sh" "$AID" RATE_LIMITED "ticket=$TICKET retry_in=${RETRY_IN}s"
            echo "  ⏸ ticket #$TICKET rate-limited (loop driver will back off)"
            N_RATE_LIMITED=$((N_RATE_LIMITED + 1))
            # Board status is left as-is (typically still In progress).
            ;;

        failed)
            REASON=$(echo "$result" | jq -r '.reason // "unknown"')
            bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "To Do" >/dev/null
            invalidate_caches "$TICKET"
            bash "$SCRIPT_DIR/log_event.sh" "$AID" FAILED "ticket=$TICKET reason=$REASON"
            echo "  → ticket #$TICKET failed ($REASON), set To Do for retry"
            N_FAILED=$((N_FAILED + 1))
            ;;

        *)
            echo "  ? ticket #$TICKET status=$STATUS (non géré)"
            bash "$SCRIPT_DIR/log_event.sh" "$AID" UNKNOWN_STATUS "ticket=$TICKET status=$STATUS"
            ;;
    esac
done

# Summary
echo ""
echo "=== Tick #$TICK process resume ==="
echo "  Validated:           $N_VALIDATED"
echo "  Opus escalation:     $N_OPUS"
echo "  Refacto (retried):   $N_REFACTO"
echo "  Escalate to user:    $N_ESCALATE"
echo "  Rate-limited:        $N_RATE_LIMITED"
echo "  Failed:              $N_FAILED"
