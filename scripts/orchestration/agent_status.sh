#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# agent_status.sh <agent-id>
#
# Computes the health status of an agent and prints a single line on stdout:
#
#     STATUS=<healthy|slow|stuck>
#     REASON=<short label>
#     PHASE=<last-event-name>
#     PHASE_AGE_SEC=<int>
#     RETRIES=<int>
#     LIFETIME_SEC=<int>
#
# Decision rules:
#   stuck — at least one of:
#     (a) process dead AND last event ∉ {COMPLETE, STUCK, ESCALATED, ANALYSIS_FAIL}
#     (b) ≥ 3 RETRY events on the same axis (DEV / VALIDATION / FUNCTIONAL / CI / SONAR / BOT)
#     (c) > 20 min in same phase without any progression event between start/ok
#     (d) BOT_WAIT > 15 min without BOT_REPLIED
#     (e) ≥ 3 consecutive CI_FAIL on the same check name
#   slow — log silent for 5–15 min, process alive, no active subprocess
#   healthy — anything else (recent activity OR live process actively shelling out)
#
# Env:
#   EGAPRO_STATE_ROOT — override state dir (default: derived from script path)
#   STUCK_PHASE_SEC   — threshold (c) in seconds (default 1200 = 20 min)
#   STUCK_BOT_SEC     — threshold (d) in seconds (default 900  = 15 min)
#   SLOW_THRESHOLD_SEC — log-silence threshold for "slow" (default 300 = 5 min)

set -euo pipefail

AGENT_ID="${1:?agent-id required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_FILE="${STATE_ROOT}/agents/${AGENT_ID}.log"

STUCK_PHASE_SEC="${STUCK_PHASE_SEC:-1200}"
STUCK_BOT_SEC="${STUCK_BOT_SEC:-900}"
SLOW_THRESHOLD_SEC="${SLOW_THRESHOLD_SEC:-300}"

if [ ! -f "$LOG_FILE" ]; then
    printf "STATUS=stuck\nREASON=no-log\nPHASE=-\nPHASE_AGE_SEC=0\nRETRIES=0\nLIFETIME_SEC=0\n"
    exit 0
fi

NOW=$(date '+%s')
TODAY=$(date '+%Y-%m-%d')

hms_to_epoch() {
    local hms="$1"
    date -d "${TODAY} ${hms}" '+%s' 2>/dev/null \
        || date -j -f "%Y-%m-%d %H:%M:%S" "${TODAY} ${hms}" '+%s' 2>/dev/null \
        || echo 0
}

# Helper: parse "[HH:MM:SS][EVENT] msg" into "<epoch> <event> <msg>".
parsed_log() {
    awk -v today="$TODAY" '
        match($0, /^\[([0-9:]+)\]\[([A-Z_0-9]+)\] ?(.*)$/, m) {
            print m[1], m[2], m[3]
        }
    ' "$LOG_FILE"
}

# First & last event timestamps (for lifetime + phase age)
FIRST_HMS=$(head -1 "$LOG_FILE" | grep -oE '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\]' | tr -d '[]' || echo "")
LAST_LINE=$(tail -1 "$LOG_FILE")
LAST_HMS=$(echo "$LAST_LINE" | grep -oE '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\]' | tr -d '[]' || echo "")
LAST_EVENT=$(echo "$LAST_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]' || echo "")
LAST_MSG=$(echo "$LAST_LINE" | sed -E 's/^\[[^]]+\]\[[^]]+\] ?//')

# Lifetime anchor: prefer the .start file (full epoch, written on first event).
# Fall back to HMS parsing for legacy logs without a .start companion.
START_FILE="${STATE_ROOT}/agents/${AGENT_ID}.start"
if [ -f "$START_FILE" ]; then
    START_EPOCH=$(cat "$START_FILE" 2>/dev/null || echo 0)
else
    START_EPOCH=$(hms_to_epoch "$FIRST_HMS")
fi
[ -z "$START_EPOCH" ] || [ "$START_EPOCH" = "0" ] && START_EPOCH=$NOW
[ "$START_EPOCH" -gt "$NOW" ] && START_EPOCH=$((NOW - 1))

# Log-age = NOW - log file mtime (stable, doesn't depend on HMS round-trip).
file_mtime() {
    stat -c '%Y' "$1" 2>/dev/null || stat -f '%m' "$1" 2>/dev/null || echo 0
}
LAST_EPOCH=$(file_mtime "$LOG_FILE")
[ "$LAST_EPOCH" = "0" ] && LAST_EPOCH=$NOW
[ "$LAST_EPOCH" -gt "$NOW" ] && LAST_EPOCH=$NOW

LIFETIME=$((NOW - START_EPOCH))
LOG_AGE=$((NOW - LAST_EPOCH))

# Retry count
RETRIES=$(awk '/\[RETRY\]/ {c++} END {print c+0}' "$LOG_FILE")

# Process liveness — same logic as render_dashboard.sh
process_alive() {
    case "$AGENT_ID" in
        epic-orchestrator-*)
            local KEY="${AGENT_ID#epic-orchestrator-}"
            pgrep -af "epic_loop.sh.*${KEY}" >/dev/null 2>&1
            ;;
        code-dev-*)
            local TICKET="${AGENT_ID##*-}"
            ps -ef | grep -E "Ticket #${TICKET}([^0-9]|\$)" | grep -v grep >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

# Terminal events: nominal end states. Not a "stuck" signal even if process is gone.
case "$LAST_EVENT" in
    COMPLETE|STUCK|ESCALATED|ANALYSIS_FAIL)
        # If the agent's terminal state is itself an alarm (STUCK / ANALYSIS_FAIL),
        # surface that. COMPLETE / ESCALATED = nominal.
        case "$LAST_EVENT" in
            STUCK|ANALYSIS_FAIL)
                printf "STATUS=stuck\nREASON=terminal-%s\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
                    "$(echo $LAST_EVENT | tr A-Z a-z)" "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
                ;;
            *)
                printf "STATUS=healthy\nREASON=done-%s\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
                    "$(echo $LAST_EVENT | tr A-Z a-z)" "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
                ;;
        esac
        exit 0
        ;;
esac

# Specific stuck signals first (b/c/d/e), so the report surfaces the actual
# cause. Generic "process-gone" is the fallback when no specific pattern matches.

# Rule (b) — ≥ 3 RETRY events on the same axis (parses "axis=<name> attempt=K")
RETRY_AXIS_COUNT=$(awk '
    /\[RETRY\]/ {
        match($0, /axis=([a-zA-Z_-]+)/, m)
        if (m[1] != "") count[m[1]]++
    }
    END {
        max = 0
        for (a in count) if (count[a] > max) { max = count[a]; axis = a }
        print max " " axis
    }
' "$LOG_FILE")
RETRY_MAX=$(echo "$RETRY_AXIS_COUNT" | awk '{print $1}')
RETRY_AXIS=$(echo "$RETRY_AXIS_COUNT" | awk '{print $2}')
if [ "${RETRY_MAX:-0}" -ge 3 ]; then
    printf "STATUS=stuck\nREASON=retry-loop-%s\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
        "$RETRY_AXIS" "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
    exit 0
fi

# Rule (e) — ≥ 3 consecutive CI_FAIL on the same check name
CI_FAIL_STREAK=$(awk '
    /\[CI_(FAIL|OK|WAIT)\]/ {
        if ($0 ~ /\[CI_FAIL\]/) {
            match($0, /failed=([^ ]+)/, m)
            if (m[1] == prev) streak++; else { streak = 1; prev = m[1] }
            if (streak > best) { best = streak; best_check = m[1] }
        } else {
            streak = 0; prev = ""
        }
    }
    END { print (best+0) " " best_check }
' "$LOG_FILE")
CI_STREAK_N=$(echo "$CI_FAIL_STREAK" | awk '{print $1}')
CI_STREAK_CHECK=$(echo "$CI_FAIL_STREAK" | awk '{print $2}')
if [ "${CI_STREAK_N:-0}" -ge 3 ]; then
    printf "STATUS=stuck\nREASON=ci-fail-loop-%s\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
        "$CI_STREAK_CHECK" "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
    exit 0
fi

# Rule (d) — BOT_WAIT > STUCK_BOT_SEC without BOT_REPLIED after
LAST_BOT_WAIT=$(grep '\[BOT_WAIT\]' "$LOG_FILE" | tail -1 | grep -oE '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\]' | tr -d '[]' || echo "")
if [ -n "$LAST_BOT_WAIT" ]; then
    BOT_WAIT_EPOCH=$(hms_to_epoch "$LAST_BOT_WAIT")
    AFTER_BOT=$(awk -v ts="$LAST_BOT_WAIT" '
        $0 ~ "\\["ts"\\]" { found=1; next }
        found && /\[BOT_REPLIED\]/ { print "yes"; exit }
    ' "$LOG_FILE")
    BOT_AGE=$((NOW - BOT_WAIT_EPOCH))
    if [ "$AFTER_BOT" != "yes" ] && [ "$BOT_AGE" -gt "$STUCK_BOT_SEC" ]; then
        printf "STATUS=stuck\nREASON=bot-wait-timeout\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
            "BOT_WAIT" "$BOT_AGE" "$RETRIES" "$LIFETIME"
        exit 0
    fi
fi

# Rule (c) — > STUCK_PHASE_SEC since the last START-style phase event
# Phase-START events: ANALYSIS_START, DEV_START, VALIDATION_START, FUNCTIONAL_START,
# CI_WAIT, SONAR_WAIT, BOT_WAIT
PHASE_START_RE='\[(ANALYSIS_START|DEV_START|VALIDATION_START|FUNCTIONAL_START|CI_WAIT|SONAR_WAIT|BOT_WAIT)\]'
LAST_PHASE_LINE=$(grep -E "$PHASE_START_RE" "$LOG_FILE" | tail -1 || echo "")
if [ -n "$LAST_PHASE_LINE" ]; then
    LAST_PHASE_HMS=$(echo "$LAST_PHASE_LINE" | grep -oE '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\]' | tr -d '[]')
    LAST_PHASE_NAME=$(echo "$LAST_PHASE_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]')
    LAST_PHASE_EPOCH=$(hms_to_epoch "$LAST_PHASE_HMS")
    PHASE_AGE=$((NOW - LAST_PHASE_EPOCH))

    PHASE_OK_NAME="${LAST_PHASE_NAME/_START/_OK}"
    [ "$LAST_PHASE_NAME" = "CI_WAIT" ] && PHASE_OK_NAME="CI_OK"
    [ "$LAST_PHASE_NAME" = "SONAR_WAIT" ] && PHASE_OK_NAME="SONAR_OK"
    [ "$LAST_PHASE_NAME" = "BOT_WAIT" ] && PHASE_OK_NAME="BOT_REPLIED"

    REACHED_OK=$(awk -v ts="$LAST_PHASE_HMS" -v ok="$PHASE_OK_NAME" '
        $0 ~ "\\["ts"\\]" { found=1; next }
        found && $0 ~ "\\["ok"\\]" { print "yes"; exit }
    ' "$LOG_FILE")
    if [ "$REACHED_OK" != "yes" ] && [ "$PHASE_AGE" -gt "$STUCK_PHASE_SEC" ]; then
        printf "STATUS=stuck\nREASON=phase-stalled-%s\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
            "$LAST_PHASE_NAME" "$LAST_PHASE_NAME" "$PHASE_AGE" "$RETRIES" "$LIFETIME"
        exit 0
    fi
fi

# Rule (a) — process dead, no specific pattern matched above
if ! process_alive; then
    printf "STATUS=stuck\nREASON=process-gone\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
        "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
    exit 0
fi

# Slow: log silent > SLOW_THRESHOLD_SEC, process alive
if [ "$LOG_AGE" -gt "$SLOW_THRESHOLD_SEC" ]; then
    printf "STATUS=slow\nREASON=log-silent\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
        "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
    exit 0
fi

printf "STATUS=healthy\nREASON=active\nPHASE=%s\nPHASE_AGE_SEC=%d\nRETRIES=%d\nLIFETIME_SEC=%d\n" \
    "$LAST_EVENT" "$LOG_AGE" "$RETRIES" "$LIFETIME"
