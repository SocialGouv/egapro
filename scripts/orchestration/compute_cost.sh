#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# compute_cost.sh <agent-id>
#
# Computes the cumulative LLM cost for an agent and prints two lines on stdout:
#
#     COST_USD=<float>
#     COST_KIND=<exact|live|estimate>
#
#   exact    — taken from a final `{"type":"result", "total_cost_usd": ...}`
#              event in the agent's stream-json trace (run finished cleanly)
#   live     — summed from `{"type":"assistant", "message":{"usage": ...}}`
#              events using model rates (run still in flight)
#   estimate — no JSONL trace at all (e.g. PO / architect / bug-analyst that
#              run inside the parent Claude Code session); approximated from
#              elapsed time × per-minute rate of the inferred model
#
# Stateless: every call recomputes from current files.
#
# Resolution order for the JSONL trace:
#   1. tick_*_agent_<TICKET>.json under .claude/state/epic_run/ticks/*/
#      (sums across all ticks — re-dispatched code-devs accumulate)
#   2. Fallback: time × rate of an inferred model
#
# Env:
#   EGAPRO_STATE_ROOT — override state dir (default: derived from script path)

set -euo pipefail

AGENT_ID="${1:?agent-id required (e.g. code-dev-123)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_FILE="${STATE_ROOT}/agents/${AGENT_ID}.log"

# Per-million-token rates (USD). Updated 2026-05.
# Sonnet 4.6 (≤200K context):
sonnet_rate_input=3
sonnet_rate_output=15
sonnet_rate_cache_read='0.30'
sonnet_rate_cache_write='3.75'
# Opus 4.7 (≤200K context):
opus_rate_input=15
opus_rate_output=75
opus_rate_cache_read='1.50'
opus_rate_cache_write='18.75'
# Haiku 4.5 (small fast — included for completeness):
haiku_rate_input=1
haiku_rate_output=5
haiku_rate_cache_read='0.10'
haiku_rate_cache_write='1.25'

# Per-minute approximation when no JSONL is available (PO/architect/bug-analyst).
# Calibrated rough average — refined as we collect data.
sonnet_per_min='0.30'
opus_per_min='2.00'
haiku_per_min='0.10'

# ---- 1. Find the JSONL trace files for this agent ----
# code-dev-<TICKET> → all tick_*_agent_<TICKET>.json across all ticks
TRACE_FILES=()
case "$AGENT_ID" in
    code-dev-*)
        TICKET="${AGENT_ID#code-dev-}"
        # Iterate all tick dirs (one per epic key)
        if [ -d "${STATE_ROOT}/ticks" ]; then
            while IFS= read -r f; do
                TRACE_FILES+=("$f")
            done < <(find "${STATE_ROOT}/ticks" -name "tick_*_agent_${TICKET}.json" 2>/dev/null)
        fi
        ;;
esac

# ---- 2. If we have JSONL traces → exact or live cost ----
if [ "${#TRACE_FILES[@]}" -gt 0 ]; then
    TOTAL=0
    KIND="live"
    HAS_RESULT=0

    for f in "${TRACE_FILES[@]}"; do
        [ -s "$f" ] || continue

        # Detect the model from the first system event (subtype=init carries model_id).
        MODEL=$(grep '"type":"system"' "$f" 2>/dev/null \
            | head -1 \
            | jq -r '.model // empty' 2>/dev/null || true)

        # Pick rates by model family. Default to Sonnet if unknown.
        case "$MODEL" in
            *opus*)   I=$opus_rate_input  ; O=$opus_rate_output  ; CR=$opus_rate_cache_read  ; CW=$opus_rate_cache_write ;;
            *haiku*)  I=$haiku_rate_input ; O=$haiku_rate_output ; CR=$haiku_rate_cache_read ; CW=$haiku_rate_cache_write ;;
            *)        I=$sonnet_rate_input; O=$sonnet_rate_output; CR=$sonnet_rate_cache_read; CW=$sonnet_rate_cache_write ;;
        esac

        # Prefer the authoritative `result.total_cost_usd` if present.
        FILE_RESULT=$(grep '"type":"result"' "$f" 2>/dev/null | tail -1 || true)
        if [ -n "$FILE_RESULT" ]; then
            FILE_COST=$(echo "$FILE_RESULT" | jq -r '.total_cost_usd // 0' 2>/dev/null || echo 0)
            TOTAL=$(awk "BEGIN { printf \"%.6f\", ${TOTAL} + ${FILE_COST} }")
            HAS_RESULT=1
            continue
        fi

        # No result event yet → sum from each assistant turn's usage block.
        FILE_COST=$(jq -r --arg i "$I" --arg o "$O" --arg cr "$CR" --arg cw "$CW" '
            select(.type == "assistant") | .message.usage // {} |
            (
                ((.input_tokens // 0)               * ($i  | tonumber) / 1000000) +
                ((.output_tokens // 0)              * ($o  | tonumber) / 1000000) +
                ((.cache_read_input_tokens // 0)    * ($cr | tonumber) / 1000000) +
                ((.cache_creation_input_tokens // 0)* ($cw | tonumber) / 1000000)
            )
        ' "$f" 2>/dev/null | awk '{ s += $1 } END { printf "%.6f", s+0 }')
        TOTAL=$(awk "BEGIN { printf \"%.6f\", ${TOTAL} + ${FILE_COST} }")
    done

    [ "$HAS_RESULT" = "1" ] && KIND="exact"
    printf "COST_USD=%.4f\nCOST_KIND=%s\n" "$TOTAL" "$KIND"
    exit 0
fi

# ---- 3. No JSONL → time-based estimation from the agent's own log ----
if [ ! -f "$LOG_FILE" ]; then
    printf "COST_USD=0.0000\nCOST_KIND=estimate\n"
    exit 0
fi

# Per-min rate by agent-type. PO / architect / bug-analyst are opus by spec.
PER_MIN="$sonnet_per_min"
case "$AGENT_ID" in
    po-*|architect-*|bug-analyst-*) PER_MIN="$opus_per_min" ;;
esac

# Lifetime: first event → last event if last is terminal, else first → now.
# Terminal events freeze cost (the agent isn't burning tokens anymore even if
# the user takes hours to look at the log). Non-terminal: time since start.
# Anchors: <id>.start file (full epoch, written by log_event.sh on first call)
# for the start time, and the log file's mtime for the freeze point.

NOW_EPOCH=$(date '+%s')

LAST_LINE=$(tail -1 "$LOG_FILE" 2>/dev/null || true)
LAST_EVENT=$(echo "$LAST_LINE" | grep -oE '\[[A-Z_0-9]+\]' | head -1 | tr -d '[]' || true)

# Terminal events: agent has stopped. Freeze cost at the log file's last mtime.
case "$LAST_EVENT" in
    COMPLETE|STUCK|ESCALATED|ANALYSIS_FAIL) IS_TERMINAL=1 ;;
    *) IS_TERMINAL=0 ;;
esac

# Start anchor: the .start file (full epoch). Fall back to log mtime if missing.
START_FILE="${STATE_ROOT}/agents/${AGENT_ID}.start"
if [ -f "$START_FILE" ]; then
    START_EPOCH=$(cat "$START_FILE" 2>/dev/null || echo 0)
else
    START_EPOCH=$(stat -c '%Y' "$LOG_FILE" 2>/dev/null || stat -f '%m' "$LOG_FILE" 2>/dev/null || echo 0)
fi
[ -z "$START_EPOCH" ] || [ "$START_EPOCH" = "0" ] && START_EPOCH=$NOW_EPOCH
[ "$START_EPOCH" -gt "$NOW_EPOCH" ] && START_EPOCH=$NOW_EPOCH

if [ "$IS_TERMINAL" = "1" ]; then
    END_EPOCH=$(stat -c '%Y' "$LOG_FILE" 2>/dev/null || stat -f '%m' "$LOG_FILE" 2>/dev/null || echo "$NOW_EPOCH")
else
    END_EPOCH=$NOW_EPOCH
fi
[ "$END_EPOCH" -lt "$START_EPOCH" ] && END_EPOCH=$START_EPOCH

ELAPSED_MIN=$(awk "BEGIN { printf \"%.4f\", (${END_EPOCH} - ${START_EPOCH}) / 60 }")
COST=$(awk "BEGIN { printf \"%.4f\", ${ELAPSED_MIN} * ${PER_MIN} }")

printf "COST_USD=%s\nCOST_KIND=estimate\n" "$COST"
