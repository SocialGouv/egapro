#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# render_dashboard.sh
#
# Renders the /report dashboard from .claude/state/epic_run/.
# Pure bash — composes outputs of agent_status.sh, compute_cost.sh, and
# agent_drilldown.sh. The /report skill calls this directly.
#
# Sections:
#   1. ACTIVE AGENTS table (one row per non-terminal agent):
#        AGENT · TICKET · PHASE · ATTEMPT · AGE · MODEL · EST. $ · STATUS
#   2. AUTO DRILL-DOWN — for every agent flagged 🔴 stuck, dumps the full
#      drill-down output below the table (agent_drilldown.sh)
#   3. RECENT EVENTS (cross-agent, chronological, last 10)
#
# Env:
#   EGAPRO_STATE_ROOT — state dir (default: derived from script path)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_DIR="${STATE_ROOT}/agents"

if [ ! -d "$LOG_DIR" ] || [ -z "$(ls -A "$LOG_DIR" 2>/dev/null)" ]; then
    echo "(Aucun epic en cours — .claude/state/epic_run/agents/ vide)"
    exit 0
fi

# ---- Helpers ----
fmt_age() {
    local sec="$1"
    if [ "$sec" -lt 60 ]; then
        echo "${sec}s"
    elif [ "$sec" -lt 3600 ]; then
        echo "$((sec / 60))m"
    else
        printf "%dh%02dm" $((sec / 3600)) $(( (sec % 3600) / 60 ))
    fi
}

# Parse the latest "attempt=K" tag from the log (the agent's current retry index)
last_attempt() {
    local log="$1"
    awk '
        match($0, /attempt=([0-9]+)/, m) { last = m[1] }
        END { if (last != "") print last; else print "-" }
    ' "$log"
}

# Extract the ticket number from agent-id (everything after the last dash, if numeric).
ticket_of() {
    local id="$1"
    case "$id" in
        epic-orchestrator-*) echo "${id#epic-orchestrator-}" ;;
        po-pending) echo "?" ;;
        *)
            local maybe="${id##*-}"
            [[ "$maybe" =~ ^[0-9]+$ ]] && echo "$maybe" || echo "-"
            ;;
    esac
}

# Infer the model. For code-dev, look up the latest tick JSONL. For others,
# use the agent-type → model convention from CLAUDE.md.
model_of() {
    local id="$1"
    case "$id" in
        code-dev-*)
            local ticket
            ticket=$(ticket_of "$id")
            local f
            f=$(find "${STATE_ROOT}/ticks" -name "tick_*_agent_${ticket}.json" 2>/dev/null | tail -1)
            if [ -n "$f" ] && [ -s "$f" ]; then
                local m
                m=$(grep '"type":"system"' "$f" | head -1 | jq -r '.model // empty' 2>/dev/null || true)
                if [ -n "$m" ]; then
                    case "$m" in
                        *opus*) echo "opus" ;;
                        *haiku*) echo "haiku" ;;
                        *) echo "sonnet" ;;
                    esac
                    return
                fi
            fi
            echo "sonnet"
            ;;
        po-*|architect-*|bug-analyst-*) echo "opus" ;;
        epic-orchestrator-*) echo "-" ;;
        *) echo "?" ;;
    esac
}

# Status icon for the table
status_icon() {
    case "$1" in
        healthy) echo "✓" ;;
        slow)    echo "⚠" ;;
        stuck)   echo "🔴" ;;
        *)       echo "?" ;;
    esac
}

# ---- 1. Build the table rows ----
ROWS=()        # status|agent|ticket|phase|attempt|age|model|cost|reason
STUCK_IDS=()   # agent-ids flagged 🔴 (for drill-down section)

file_mtime() {
    stat -c '%Y' "$1" 2>/dev/null || stat -f '%m' "$1" 2>/dev/null || echo 0
}

NOW_EPOCH=$(date '+%s')
LEGACY_STALE_SEC="${LEGACY_STALE_SEC:-3600}"

for log in "$LOG_DIR"/*.log; do
    [ -f "$log" ] || continue
    AID=$(basename "$log" .log)

    # Skip nominal terminal agents to keep the dashboard focused on what's "in flight".
    LAST_LINE=$(tail -n 1 "$log" 2>/dev/null || echo "")
    LAST_EVENT=$(echo "$LAST_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]' || echo "")
    case "$LAST_EVENT" in
        COMPLETE|ESCALATED) continue ;;
    esac

    # Skip legacy / abandoned agents: log mtime > LEGACY_STALE_SEC AND no .start file
    # (predates the .start convention) AND no live process. These pollute the
    # dashboard with phantom "stuck" rows from previous runs.
    LOG_MTIME=$(file_mtime "$log")
    LOG_AGE=$((NOW_EPOCH - LOG_MTIME))
    if [ ! -f "${LOG_DIR}/${AID}.start" ] && [ "$LOG_AGE" -gt "$LEGACY_STALE_SEC" ]; then
        continue
    fi

    # Status
    STATUS_OUT=$(EGAPRO_STATE_ROOT="$STATE_ROOT" bash "$SCRIPT_DIR/agent_status.sh" "$AID" 2>/dev/null || echo "")
    STATUS=$(echo "$STATUS_OUT" | grep '^STATUS=' | cut -d= -f2)
    REASON=$(echo "$STATUS_OUT" | grep '^REASON=' | cut -d= -f2)
    PHASE=$(echo "$STATUS_OUT" | grep '^PHASE=' | cut -d= -f2)
    LIFETIME_SEC=$(echo "$STATUS_OUT" | grep '^LIFETIME_SEC=' | cut -d= -f2)

    # Cost
    COST_OUT=$(EGAPRO_STATE_ROOT="$STATE_ROOT" bash "$SCRIPT_DIR/compute_cost.sh" "$AID" 2>/dev/null || echo "")
    COST_USD=$(echo "$COST_OUT" | grep '^COST_USD=' | cut -d= -f2)
    COST_KIND=$(echo "$COST_OUT" | grep '^COST_KIND=' | cut -d= -f2)
    case "$COST_KIND" in
        exact)    COST_DISPLAY=$(printf "\$%.2f" "$COST_USD") ;;
        live)     COST_DISPLAY=$(printf "\$%.2f*" "$COST_USD") ;;   # live (still running)
        estimate) COST_DISPLAY=$(printf "~\$%.2f" "$COST_USD") ;;   # rough estimate
        *)        COST_DISPLAY="-" ;;
    esac

    TICKET=$(ticket_of "$AID")
    MODEL=$(model_of "$AID")
    ATTEMPT=$(last_attempt "$log")
    AGE=$(fmt_age "${LIFETIME_SEC:-0}")
    ICON=$(status_icon "${STATUS:-?}")

    ROWS+=("${STATUS}|${ICON}|${AID}|${TICKET}|${PHASE}|${ATTEMPT}|${AGE}|${MODEL}|${COST_DISPLAY}|${REASON}")
    [ "$STATUS" = "stuck" ] && STUCK_IDS+=("$AID")
done

# Sort: stuck first, then slow, then healthy. Within each, longest-lived first.
# Each row: STATUS|ICON|AID|TICKET|PHASE|ATTEMPT|AGE|MODEL|COST|REASON
# Strip STATUS from the output (first field) so the rendering loop's column
# indices line up with ICON|AID|TICKET|...
IFS=$'\n' SORTED=($(printf "%s\n" "${ROWS[@]}" | awk -F'|' '
    BEGIN { OFS="|" }
    {
        rank = ($1 == "stuck") ? 0 : ($1 == "slow") ? 1 : 2
        rest = $2
        for (i = 3; i <= NF; i++) rest = rest "|" $i
        print rank "|" rest
    }
' | sort -t'|' -k1,1n | cut -d'|' -f2-))
unset IFS

# ---- Render table ----
echo "═══ ACTIVE AGENTS (${#ROWS[@]}) ═══"
echo ""

if [ "${#ROWS[@]}" -eq 0 ]; then
    echo "  (aucun agent actif — tous en état terminal)"
    echo ""
else
    # Header
    printf "  %-2s %-22s %-7s %-18s %-8s %-6s %-7s %-8s %s\n" \
        "" "AGENT" "TICKET" "PHASE" "ATTEMPT" "AGE" "MODEL" "EST. $" "REASON"
    printf "  %-2s %-22s %-7s %-18s %-8s %-6s %-7s %-8s %s\n" \
        "──" "──────────────────────" "───────" "──────────────────" "────────" "──────" "───────" "────────" "──────"

    for entry in "${SORTED[@]}"; do
        ICON=$(echo "$entry" | cut -d'|' -f1)
        AID=$(echo "$entry" | cut -d'|' -f2)
        TICKET=$(echo "$entry" | cut -d'|' -f3)
        PHASE=$(echo "$entry" | cut -d'|' -f4)
        ATTEMPT=$(echo "$entry" | cut -d'|' -f5)
        AGE=$(echo "$entry" | cut -d'|' -f6)
        MODEL=$(echo "$entry" | cut -d'|' -f7)
        COST=$(echo "$entry" | cut -d'|' -f8)
        REASON=$(echo "$entry" | cut -d'|' -f9-)
        printf "  %-2s %-22s %-7s %-18s %-8s %-6s %-7s %-8s %s\n" \
            "$ICON" "$AID" "$TICKET" "$PHASE" "$ATTEMPT" "$AGE" "$MODEL" "$COST" "$REASON"
    done
    echo ""
    echo "  Légende : ✓ healthy  ⚠ slow (silent log)  🔴 stuck"
    echo "           \$X.XX exact  \$X.XX* live  ~\$X.XX estimate"
    echo ""
fi

# ---- 2. Auto drill-down for stuck agents ----
if [ "${#STUCK_IDS[@]}" -gt 0 ]; then
    echo "═══ DRILL-DOWN (${#STUCK_IDS[@]} agent(s) stuck) ═══"
    echo ""
    for sid in "${STUCK_IDS[@]}"; do
        EGAPRO_STATE_ROOT="$STATE_ROOT" bash "$SCRIPT_DIR/agent_drilldown.sh" "$sid"
        echo ""
    done
fi

# ---- 3. Cross-agent recent events ----
echo "═══ RECENT EVENTS (cross-agent, last 10) ═══"
{
    for log in "$LOG_DIR"/*.log; do
        [ -f "$log" ] || continue
        AID=$(basename "$log" .log)
        awk -v aid="$AID" '{print $0 " <" aid ">"}' "$log"
    done
} | sort | tail -n 10 | sed 's/^/  /'
echo ""
