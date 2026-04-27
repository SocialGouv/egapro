#!/usr/bin/env bash
# render_dashboard.sh
#
# Formats the /report dashboard from .claude/state/epic_run/.
# Pure bash, no LLM needed. The /report skill calls this directly.
#
# Displays:
#   - Active agents (non-terminal state), sorted by inactivity (most inactive first)
#   - Each agent's last 4 events
#   - Alerts for agents inactive > INACTIVITY_THRESHOLD_SEC (default 600 = 10 min)
#   - Cross-agent recent events (chronological, last 10)
#
# Env:
#   EGAPRO_STATE_ROOT         — state dir (default: derived from script path)
#   INACTIVITY_THRESHOLD_SEC  — alert threshold in seconds (default: 600 = 10 min)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_DIR="${STATE_ROOT}/agents"
THRESHOLD="${INACTIVITY_THRESHOLD_SEC:-600}"

if [ ! -d "$LOG_DIR" ] || [ -z "$(ls -A "$LOG_DIR" 2>/dev/null)" ]; then
    echo "(Aucun epic en cours — .claude/state/epic_run/agents/ vide)"
    exit 0
fi

NOW_TS=$(date '+%s')

ACTIVE=()
ALERTS=()

for log in "$LOG_DIR"/*.log; do
    [ -f "$log" ] || continue
    AGENT_ID=$(basename "$log" .log)

    # Skip if terminal state in last event
    LAST_LINE=$(tail -n 1 "$log" 2>/dev/null || echo "")
    LAST_EVENT=$(echo "$LAST_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]')

    case "$LAST_EVENT" in
        COMPLETE|STUCK|ESCALATED) continue ;;
    esac

    MTIME=$(stat -c '%Y' "$log")
    INACTIVITY=$((NOW_TS - MTIME))

    ACTIVE+=("${AGENT_ID}|${INACTIVITY}|${log}")

    if [ "$INACTIVITY" -gt "$THRESHOLD" ]; then
        MIN=$((INACTIVITY / 60))
        ALERTS+=("⚠ ${AGENT_ID} : inactif ${MIN} min (seuil $((THRESHOLD / 60)) min)")
    fi
done

echo "═══ ACTIVE AGENTS (${#ACTIVE[@]}) ═══"
echo ""

if [ "${#ACTIVE[@]}" -eq 0 ]; then
    echo "  (aucun agent actif — tous en état terminal ou logs vides)"
    echo ""
else
    # Sort by inactivity descending (most inactive first)
    IFS=$'\n' SORTED=($(printf "%s\n" "${ACTIVE[@]}" | sort -t'|' -k2 -nr))
    unset IFS

    for entry in "${SORTED[@]}"; do
        AGENT_ID=$(echo "$entry" | cut -d'|' -f1)
        INACTIVITY=$(echo "$entry" | cut -d'|' -f2)
        LOG=$(echo "$entry" | cut -d'|' -f3-)

        if [ "$INACTIVITY" -lt 60 ]; then
            AGE="${INACTIVITY}s ago"
        else
            AGE="$((INACTIVITY / 60)) min ago"
        fi

        if [ "$INACTIVITY" -gt "$THRESHOLD" ]; then
            FLAG="⚠ INACTIF"
        else
            FLAG="✓"
        fi

        RETRIES=$(awk '/\[RETRY/ {c++} END {print c+0}' "$LOG")

        printf "%s · %s · %s · retries=%d\n" "$AGENT_ID" "$AGE" "$FLAG" "$RETRIES"
        tail -n 4 "$LOG" | sed 's/^/  /'
        echo ""
    done
fi

# Cross-agent recent events
echo "═══ RECENT EVENTS (cross-agent, last 10) ═══"
{
    for log in "$LOG_DIR"/*.log; do
        [ -f "$log" ] || continue
        AGENT_ID=$(basename "$log" .log)
        awk -v aid="$AGENT_ID" '{print $0 " <" aid ">"}' "$log"
    done
} | sort | tail -n 10 | sed 's/^/  /'
echo ""

if [ ${#ALERTS[@]} -gt 0 ]; then
    echo "═══ ALERTS ═══"
    for alert in "${ALERTS[@]}"; do
        echo "  $alert"
    done
fi
