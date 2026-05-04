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
# | Status                  | Board change           | Labels                                    | Counter / merge       |
# |-------------------------|------------------------|-------------------------------------------|-----------------------|
# | validated               | stays In progress      | clear attempt=N                           | squash-merge into epic/<N> |
# | needs_opus_escalation   | → To Do                | + complexe                                | reset                 |
# | refacto                 | → To Do                | bump attempt=N (1→2→3); +dispatch=escalate at 3 | +1              |
# | rate_limited            | none                   | none (handled by loop driver)             | unchanged             |
# | failed                  | → To Do                | none (technical, not semantic)            | unchanged             |
#
# === HARD RULES ===
# - Never sets a ticket to 'In review' or 'Done' — both transitions are
#   user-only. The agent's terminus is the squash-merge of the validated PR
#   into epic/<N>; the ticket stays at 'In progress' until the human moves it.
# - Never merges into alpha/master. The only merge done by this script is the
#   squash-merge of a validated ticket PR into its `epic/<N>` integration
#   branch — gated by the per-ticket validators (CI green, Sonar green,
#   IA validators OK, bot reviews addressed).

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

N_MERGED=0
N_MERGE_CONFLICT=0
N_MERGE_PENDING=0

jq -c '.results[]' "$RESULT_FILE" | while read -r result; do
    STATUS=$(echo "$result" | jq -r '.status // "unknown"')
    TICKET=$(echo "$result" | jq -r '.ticket // 0')
    PR=$(echo "$result" | jq -r '.pr // ""')
    EPIC=$(echo "$result" | jq -r '.epic // ""')

    case "$STATUS" in
        validated)
            # code-dev has gh-pr-ready'd the PR and returned validated. The
            # ticket stays at 'In progress' (board transitions to In review
            # and Done are user-only). Squash-merge the validated PR into
            # epic/<N> right now — the next dispatch_plan tick can then
            # unlock children that depend on this ticket (parent's branch
            # will be gone after merge).
            #
            # Standalone Task / Bug (no parent epic) : no auto-merge, the
            # PR stays open for human review and merge into alpha.
            clear_attempt_labels "$TICKET"
            invalidate_caches "$TICKET"

            if [ -z "$EPIC" ] || [ -z "$PR" ]; then
                bash "$SCRIPT_DIR/log_event.sh" "$AID" VALIDATED "ticket=$TICKET pr=$PR no-epic-or-pr-no-auto-merge"
                echo "  ✓ ticket #$TICKET validated (PR ready) — no auto-merge (standalone or missing PR)"
                N_VALIDATED=$((N_VALIDATED + 1))
            else
                set +e
                bash "$SCRIPT_DIR/merge_validated_ticket.sh" "$PR" "$EPIC" "$TICKET" >&2
                MERGE_RC=$?
                set -e
                case "$MERGE_RC" in
                    0)
                        bash "$SCRIPT_DIR/log_event.sh" "$AID" MERGED "ticket=$TICKET pr=$PR epic=$EPIC"
                        echo "  ✓ ticket #$TICKET validated + squash-merged into epic/$EPIC (PR #$PR)"
                        N_VALIDATED=$((N_VALIDATED + 1))
                        N_MERGED=$((N_MERGED + 1))
                        ;;
                    2)
                        bash "$SCRIPT_DIR/log_event.sh" "$AID" MERGE_CONFLICT "ticket=$TICKET pr=$PR epic=$EPIC"
                        echo "  ⚠ ticket #$TICKET validated but conflicts with epic/$EPIC (PR #$PR) — set In progress, will retry"
                        N_MERGE_CONFLICT=$((N_MERGE_CONFLICT + 1))
                        ;;
                    3)
                        bash "$SCRIPT_DIR/log_event.sh" "$AID" MERGE_PENDING "ticket=$TICKET pr=$PR epic=$EPIC"
                        echo "  ⏸ ticket #$TICKET validated but mergeability=UNKNOWN — retry next tick"
                        N_MERGE_PENDING=$((N_MERGE_PENDING + 1))
                        ;;
                    *)
                        bash "$SCRIPT_DIR/log_event.sh" "$AID" MERGE_FAILED "ticket=$TICKET pr=$PR epic=$EPIC rc=$MERGE_RC"
                        echo "  ✗ ticket #$TICKET validated but merge_validated_ticket.sh exited $MERGE_RC — manual investigation"
                        N_VALIDATED=$((N_VALIDATED + 1))
                        ;;
                esac
            fi
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
echo "    └─ merged:         $N_MERGED"
echo "    └─ merge conflict: $N_MERGE_CONFLICT"
echo "    └─ merge pending:  $N_MERGE_PENDING"
echo "  Opus escalation:     $N_OPUS"
echo "  Refacto (retried):   $N_REFACTO"
echo "  Escalate to user:    $N_ESCALATE"
echo "  Rate-limited:        $N_RATE_LIMITED"
echo "  Failed:              $N_FAILED"
