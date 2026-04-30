#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# log_event.sh <agent-id> <event-type> [message]
#
# Appends a structured event to the agent's log file under
# .claude/state/epic_run/agents/<agent-id>.log (rolling 50 lines).
#
# Agent-id format: <agent-type>-<ticket>   (e.g. code-dev-123, validator-123)
# Special: epic-orchestrator-<EPICS_KEY>  (e.g. epic-orchestrator-42 or 42_43)
#
# === CALLING DISCIPLINE ===
# Agents log at SIGNIFICANT STATE TRANSITIONS only — not every Read/grep/MCP
# call. The log feeds /report, which surfaces stuck or inactive agents.
#
# Mandatory events for every agent:
#   START       — at the beginning, after receiving the prompt
#   COMPLETE    — nominal end (PR ready / In review / verdict PASS / etc.)
#   STUCK       — gave up after retries / consecutive failures
#   ESCALATED   — auto-escalation Sonnet → Opus
#
# Recommended (visibility for /report):
#   PROGRESS    — intermediate milestones, max 2-3 per workflow
#   RETRY       — start of an iteration after validator feedback
#   VERDICT     — validators only (PASS / RETRY / REFACTO)
#
# Specialized (context-dependent):
#   IMPLEMENT_OK, TYPECHECK_OK, TEST_OK             (code-dev)
#   PR_DRAFT, PR_READY                              (code-dev)
#   FUNCTIONAL_PASS, DESIGN_PASS                    (code-dev)
#   TICK_DISPATCH, TICK_DONE, USER_INTERVENTION    (epic-orchestrator)
#   AGENT_SPAWN, MERGE_FAIL, REBASE_FAIL           (epic-orchestrator)
#
# Usage:
#   bash scripts/orchestration/log_event.sh code-dev-123 START "worktree=epic42-t123"
#   bash scripts/orchestration/log_event.sh code-dev-123 PR_READY "pr=456"
#   bash scripts/orchestration/log_event.sh validator-123 VERDICT "PASS"
#
# State layout:
#   <repo_root>/.claude/state/epic_run/agents/<agent-id>.log
#
# Env:
#   EGAPRO_STATE_ROOT — override state dir (default: derived from script path)

set -euo pipefail

AGENT_ID="${1:?agent-id required (e.g. code-dev-123)}"
EVENT_TYPE="${2:?event-type required (e.g. START, COMPLETE)}"
MSG="${3:-}"

# Derive repo root from script location: <repo>/scripts/orchestration/log_event.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_DIR="${STATE_ROOT}/agents"
mkdir -p "$LOG_DIR"

LOG_FILE="${LOG_DIR}/${AGENT_ID}.log"
TS=$(date '+%H:%M:%S')

if [ -n "$MSG" ]; then
    LINE="[${TS}][${EVENT_TYPE}] ${MSG}"
else
    LINE="[${TS}][${EVENT_TYPE}]"
fi

echo "$LINE" >> "$LOG_FILE"

# Rolling window: keep last 50 lines
if [ "$(wc -l < "$LOG_FILE")" -gt 50 ]; then
    tail -n 50 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

# stderr only — callers may pipe stdout
echo "[log_event] ${AGENT_ID}: ${EVENT_TYPE}" >&2
