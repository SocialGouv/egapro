#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# agent_drilldown.sh <agent-id>
#
# Dumps everything we can cheaply gather about a stuck agent — meant to be
# called by render_dashboard.sh when an agent is flagged 🔴.
#
# Sections:
#   1. Status summary (from agent_status.sh)
#   2. Last 20 events from the agent's log
#   3. Active shell command (process tree introspection)
#   4. git status of the agent's worktree (code-dev only)
#   5. Last failed CI run (code-dev only, gh + jq)
#   6. Last bot/human comment on the PR (code-dev only)
#
# Pure bash — no LLM. Reads from local files + gh + git only.
#
# Env:
#   EGAPRO_STATE_ROOT — override state dir

set -euo pipefail

AGENT_ID="${1:?agent-id required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

STATE_ROOT="${EGAPRO_STATE_ROOT:-${REPO_ROOT}/.claude/state/epic_run}"
LOG_FILE="${STATE_ROOT}/agents/${AGENT_ID}.log"

echo "═══ DRILL-DOWN: ${AGENT_ID} ═══"
echo ""

# 1. Status summary
echo "▸ Status"
if STATUS_OUT=$(EGAPRO_STATE_ROOT="$STATE_ROOT" bash "$SCRIPT_DIR/agent_status.sh" "$AGENT_ID" 2>/dev/null); then
    echo "$STATUS_OUT" | sed 's/^/  /'
else
    echo "  (agent_status.sh failed)"
fi
echo ""

# 2. Last 20 events
echo "▸ Last 20 events"
if [ -f "$LOG_FILE" ]; then
    tail -n 20 "$LOG_FILE" | sed 's/^/  /'
else
    echo "  (no log file)"
fi
echo ""

# 3. Active shell command at process-tree level
echo "▸ Active shell command"
case "$AGENT_ID" in
    code-dev-*)
        TICKET="${AGENT_ID##*-}"
        CLAUDE_PID=$(ps -eo pid,cmd 2>/dev/null \
            | awk -v t="Ticket #${TICKET}" '$0 ~ t && $0 !~ /timeout/ && $0 !~ /grep/ && $0 !~ /awk/ {print $1; exit}')
        if [ -n "$CLAUDE_PID" ]; then
            CURRENT="$CLAUDE_PID"
            LAST_CMD=""
            DEPTH=0
            while [ "$DEPTH" -lt 20 ]; do
                CHILD=$(pgrep -P "$CURRENT" 2>/dev/null | head -1)
                [ -z "$CHILD" ] && break
                CURRENT="$CHILD"
                LAST_CMD=$(ps -p "$CURRENT" -o cmd= 2>/dev/null | head -1)
                DEPTH=$((DEPTH + 1))
            done
            if [ -n "$LAST_CMD" ]; then
                echo "  $LAST_CMD" | head -c 200
                echo ""
            else
                echo "  (claude process alive, no shell subprocess — likely thinking)"
            fi
        else
            echo "  (no live claude process for this ticket)"
        fi
        ;;
    *)
        echo "  (drill-down for active shell only meaningful for code-dev)"
        ;;
esac
echo ""

# 4 + 5 + 6: code-dev specific GitHub state
case "$AGENT_ID" in
    code-dev-*)
        TICKET="${AGENT_ID##*-}"

        # 4. git status of the worktree (find by branch convention)
        echo "▸ Worktree git status"
        # Look for any worktree whose branch ref starts with ticket/<TICKET>-
        WT_PATH=$(git -C "$REPO_ROOT" worktree list 2>/dev/null \
            | awk -v t="ticket/${TICKET}-" '$3 ~ "\\["t {print $1; exit}' || true)
        if [ -n "$WT_PATH" ] && [ -d "$WT_PATH" ]; then
            echo "  worktree: $WT_PATH"
            git -C "$WT_PATH" status --short 2>/dev/null | head -20 | sed 's/^/  /'
            LAST_COMMIT=$(git -C "$WT_PATH" log -1 --oneline 2>/dev/null | head -c 100 || true)
            [ -n "$LAST_COMMIT" ] && echo "  last commit: $LAST_COMMIT"
        else
            echo "  (no live worktree for ticket #${TICKET})"
        fi
        echo ""

        # 5 + 6 require the PR number
        PR_INFO=$(gh pr list --state all --limit 100 --json number,state,headRefName,statusCheckRollup 2>/dev/null \
            | jq -r --arg t "ticket/${TICKET}-" '
                .[] | select(.headRefName | startswith($t)) |
                "\(.number)|\(.state)"' \
            | head -1)
        if [ -n "$PR_INFO" ]; then
            PR_NUM=$(echo "$PR_INFO" | cut -d'|' -f1)
            PR_STATE=$(echo "$PR_INFO" | cut -d'|' -f2)

            # 5. Last failed CI run
            echo "▸ Last failed CI check on PR #${PR_NUM} (${PR_STATE})"
            FAILED_CHECK=$(gh pr view "$PR_NUM" --json statusCheckRollup 2>/dev/null \
                | jq -r '.statusCheckRollup[] | select(.conclusion == "FAILURE" or .conclusion == "TIMED_OUT" or .conclusion == "CANCELLED") | "\(.name)|\(.detailsUrl)"' \
                | head -1 || true)
            if [ -n "$FAILED_CHECK" ]; then
                CHECK_NAME=$(echo "$FAILED_CHECK" | cut -d'|' -f1)
                CHECK_URL=$(echo "$FAILED_CHECK" | cut -d'|' -f2)
                echo "  failed check: $CHECK_NAME"
                echo "  details: $CHECK_URL"
                # Try to extract the run id from the URL and dump 30 lines of failed log
                RUN_ID=$(echo "$CHECK_URL" | grep -oE '/runs/[0-9]+' | grep -oE '[0-9]+' | head -1 || true)
                if [ -n "$RUN_ID" ]; then
                    echo "  --- last 30 lines of failed log ---"
                    gh run view "$RUN_ID" --log-failed 2>/dev/null | tail -n 30 | sed 's/^/  /' || echo "  (gh run view failed)"
                fi
            else
                echo "  (no failed checks)"
            fi
            echo ""

            # 6. Last comment on PR (any author)
            echo "▸ Last comment on PR #${PR_NUM}"
            LAST_COMMENT=$(gh api "repos/SocialGouv/egapro/issues/${PR_NUM}/comments" 2>/dev/null \
                | jq -r '. | sort_by(.created_at) | last | "\(.user.login) at \(.created_at):\n\(.body)"' \
                | head -c 500 || true)
            if [ -n "$LAST_COMMENT" ] && [ "$LAST_COMMENT" != "null" ]; then
                echo "$LAST_COMMENT" | sed 's/^/  /'
            else
                echo "  (no comments yet)"
            fi
            echo ""
        else
            echo "▸ PR state"
            echo "  (no PR found for ticket #${TICKET})"
            echo ""
        fi
        ;;
esac
