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
# .claude/state/epic_run/agents/<agent-id>.log (rolling 200 lines).
#
# Agent-id format: <agent-type>-<ticket>   (e.g. code-dev-123, architect-42)
# Special: epic-orchestrator-<EPICS_KEY>  (e.g. epic-orchestrator-42 or 42_43)
#
# === CALLING DISCIPLINE ===
# Agents log at PHASE TRANSITIONS only — not every Read/grep/MCP call.
# The log feeds /report, which surfaces stuck or inactive agents and
# computes per-agent cost & lifetime.
#
# Mandatory events for every agent:
#   START       — at the beginning, after receiving the prompt
#   COMPLETE    — nominal end (PR ready / verdict posted / issues created)
#   STUCK       — gave up after retries / consecutive failures
#   ESCALATED   — auto-escalation Sonnet → Opus
#
# code-dev specific (with attempt=K when iterating):
#   ANALYSIS_START / ANALYSIS_OK / ANALYSIS_FAIL  (step 1: ticket spec check)
#   DEV_START / DEV_OK                            (step 5: implementation)
#   VALIDATION_START / VALIDATION_OK              (step 6: 4 quality auditors)
#   FUNCTIONAL_START / FUNCTIONAL_OK              (step 9a: functional-validator)
#   CI_WAIT / CI_OK / CI_FAIL                     (step 9b: GitHub Actions)
#   SONAR_WAIT / SONAR_OK / SONAR_FAIL            (step 9c: SonarCloud)
#   BOT_WAIT / BOT_REPLIED                        (step 9d: bot reviews)
#   PR_DRAFT, PR_READY                            (steps 8, 10)
#   RETRY                                         (step 9 retries)
#
# product-owner specific:
#   QA_DONE, BUSINESS_NEED_DRAFTED, ANALYSIS_DRAFTED, AWAITING_VALIDATION,
#   ISSUE_CREATED                                 (mode create)
#   READING_EXISTING, AMENDMENT_PLAN_DRAFTED      (mode enrich)
#
# architect specific:
#   MAPPING, BREAKDOWN_READY                      (mode epic-*)
#   ISSUES_CREATED, ANALYSIS_POSTED               (mode epic-*, task)
#   AWAITING_VALIDATION                           (all modes)
#
# bug-analyst specific:
#   REPRO_LOCAL, REPRO_ENV, REPRO_VISUAL          (sub-strategies)
#   ROOT_CAUSE_FOUND, ANALYSIS_POSTED, AWAITING_VALIDATION
#
# epic-orchestrator specific:
#   TICK_DISPATCH, TICK_AGENTS_DONE, USER_INTERVENTION
#   AGENT_SPAWN, MERGE_FAIL, REBASE_CONFLICT, REBASE_ERROR
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
START_FILE="${LOG_DIR}/${AGENT_ID}.start"
TS=$(date '+%H:%M:%S')

# First event ever for this agent → record full epoch start time.
# This is the authoritative lifetime anchor (the rolling 200-line log can drop
# the original START line on long runs, and HMS-only timestamps lose the date).
if [ ! -f "$START_FILE" ]; then
    date '+%s' > "$START_FILE"
fi

if [ -n "$MSG" ]; then
    LINE="[${TS}][${EVENT_TYPE}] ${MSG}"
else
    LINE="[${TS}][${EVENT_TYPE}]"
fi

echo "$LINE" >> "$LOG_FILE"

# Rolling window: keep last 200 lines (raised from 50 to allow drill-down on
# stuck agents — see /report skill).
if [ "$(wc -l < "$LOG_FILE")" -gt 200 ]; then
    tail -n 200 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

# stderr only — callers may pipe stdout
echo "[log_event] ${AGENT_ID}: ${EVENT_TYPE}" >&2
