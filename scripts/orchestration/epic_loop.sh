#!/usr/bin/env bash
# epic_loop.sh <epic_N1> [<epic_N2> ...]
#
# Bash loop driver for /epic orchestration. Runs in the background, ticking
# every few seconds:
#   1. dispatch_plan.sh computes the JSON plan for this tick.
#   2. For each plan entry, set up the worktree + docker stack, then spawn a
#      `claude` CLI in its own process with --max-budget-usd. Each sub-agent
#      has its own API budget and crash-isolation.
#   3. Wait for all agents in the tick, aggregate their JSON returns into a
#      tick_result file.
#   4. process_tick_result.sh applies the board mutations.
#   5. Sleep, increment, repeat until all tickets terminal or a hard limit.
#
# Exit codes:
#   0  every sub-ticket reached a terminal state (validated / dispatch=escalate)
#   1  technical failure (claude CLI missing, malformed plan, etc.)
#   2  user intervention required (one or more tickets carry dispatch=escalate)
#   3  MAX_TICKS reached without convergence
#
# Hard rule: NEVER merges PRs, NEVER sets a ticket to 'Done'. validated means
# code-dev has set 'In review' and pr ready — the human takes over from there.
#
# Env (defaults shown):
#   EPIC_LOOP_MAX_TICKS       30     (≈ 2-3h max with 5-min ticks)
#   EPIC_LOOP_SLEEP_TICK      5      sleep between consecutive ticks
#   EPIC_LOOP_SLEEP_WAIT      30     sleep when plan empty but tickets in flight
#   EPIC_LOOP_BUDGET_SONNET   10     USD max per Sonnet sub-agent
#   EPIC_LOOP_BUDGET_OPUS     40     USD max per Opus sub-agent
#   EPIC_LOOP_AGENT_TIMEOUT   5400   seconds max per agent (90 min)
#   EPIC_MAX_PARALLEL         5      max concurrent worktrees
#
# Usage:
#   bash scripts/orchestration/epic_loop.sh 42
#   bash scripts/orchestration/epic_loop.sh 42 43
#   nohup bash scripts/orchestration/epic_loop.sh 42 > /tmp/epic_loop_42.log 2>&1 &

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <epic_N1> [<epic_N2> ...]" >&2
    exit 1
fi

EPICS="$*"
EPICS_KEY=$(echo "$EPICS" | tr ' ' '_')
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TICK_DIR="$REPO_ROOT/.claude/state/epic_run/ticks/$EPICS_KEY"
AID="epic-orchestrator-${EPICS_KEY}"

MAX_TICKS="${EPIC_LOOP_MAX_TICKS:-30}"
SLEEP_TICK="${EPIC_LOOP_SLEEP_TICK:-5}"
SLEEP_WAIT="${EPIC_LOOP_SLEEP_WAIT:-30}"
BUDGET_SONNET="${EPIC_LOOP_BUDGET_SONNET:-10}"
BUDGET_OPUS="${EPIC_LOOP_BUDGET_OPUS:-40}"
AGENT_TIMEOUT="${EPIC_LOOP_AGENT_TIMEOUT:-5400}"

mkdir -p "$TICK_DIR"

# Invalidate any stale gh cache from a prior run — the very first tick must
# read fresh board state.
rm -rf /tmp/egapro_gh_cache/ 2>/dev/null || true

bash "$SCRIPT_DIR/log_event.sh" "$AID" START "epics=$EPICS budget_sonnet=$BUDGET_SONNET budget_opus=$BUDGET_OPUS max_ticks=$MAX_TICKS"

# ---- Pre-flight: validate args + move epics to 'In progress' ----
for N in $EPICS; do
    if ! gh issue view "$N" --json labels --jq '[.labels[].name]' 2>/dev/null | grep -qiE '"epic"'; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" ERROR "not_an_epic:$N"
        echo "ERROR: #$N is not an epic" >&2
        exit 1
    fi
    bash "$SCRIPT_DIR/set_ticket_status.sh" "$N" "In progress" >/dev/null 2>&1 || true
done

# ---- Helper: ensure worktree exists at the expected path + setup docker stack ----
# Args: TICKET INDEX EPIC BASE_BRANCH
# Idempotent — re-runs are a no-op if the worktree and .env.local are already in place.
ensure_worktree() {
    local TICKET="$1"
    local INDEX="$2"
    local EPIC="$3"
    local BASE="$4"
    local WT_PATH="${REPO_ROOT}/../egapro-epic${EPIC}-t${TICKET}"
    local TID_AID="code-dev-${TICKET}"

    if [ ! -d "$WT_PATH" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" WORKTREE_CREATE "path=$WT_PATH base=$BASE"
        # Refresh remote so the base branch is up-to-date
        (cd "$REPO_ROOT" && git fetch origin "${BASE#origin/}" 2>/dev/null || true)
        # Detached worktree — code-dev will create the ticket branch itself (step 4 of AGENT.md)
        (cd "$REPO_ROOT" && git worktree add --detach "$WT_PATH" "$BASE" 2>&1) \
            || { bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" WORKTREE_FAIL "git worktree add failed"; return 1; }
    fi

    if [ ! -f "$WT_PATH/packages/app/.env.local" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" STACK_SETUP "running setup-worktree.sh $INDEX (pnpm install + docker compose + migrations, ~1-3 min)"
        # Use the main-repo's setup-worktree.sh (resolved via $REPO_ROOT) so
        # the bootstrap works even if the worktree's checked-out branch does
        # not yet contain the orchestration infrastructure scripts.
        (cd "$WT_PATH" && bash "$REPO_ROOT/scripts/setup-worktree.sh" "$INDEX" 2>&1) \
            || { bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" STACK_FAIL "setup-worktree.sh failed (index=$INDEX)"; return 1; }
        bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" STACK_READY "wt=$WT_PATH index=$INDEX"
    fi

    echo "$WT_PATH"
}

# ---- Helper: spawn one sub-agent in its own claude CLI process ----
# Output JSON written to AGENT_LOG. Blocking. Args:
#   TICKET AGENT MODEL INDEX EPIC BASE_BRANCH WT_PATH AGENT_LOG
spawn_agent() {
    local TICKET="$1"
    local AGENT="$2"
    local MODEL="$3"
    local INDEX="$4"
    local EPIC="$5"
    local BASE="$6"
    local WT_PATH="$7"
    local AGENT_LOG="$8"

    local BUDGET="$BUDGET_SONNET"
    [ "$MODEL" = "opus" ] && BUDGET="$BUDGET_OPUS"

    local PORT=$((3001 + INDEX))

    local PROMPT="Ticket #${TICKET} à traiter (epic parent #${EPIC}).
Worktree: ${WT_PATH}
Worktree index: ${INDEX} (dev server port = ${PORT})
Base branch: ${BASE}  (remote-tracking ref, déjà fetchée par l'orchestrateur)

Suivre STRICTEMENT le workflow de .claude/agents/code-dev/AGENT.md.

L'orchestrateur a déjà :
- créé le worktree en mode --detach sur ${BASE}
- lancé setup-worktree.sh ${INDEX} (pnpm install + stack docker + .env.local + migrations OK)
- passé le ticket #${TICKET} en \"In progress\" sur le board

Toi : depuis le worktree, créer la branche ticket/${TICKET}-<slug> à partir de
${BASE} (remote-tracking ref, donc \`git checkout -b ticket/${TICKET}-<slug> ${BASE}\`,
**pas besoin de re-fetch**), implémenter, créer la PR draft, faire les 4 + 2
validators internes, itérer sur les RETRY, retourner le verdict final JSON.

Format de retour OBLIGATOIRE — un seul de :
  {\"status\":\"validated\",\"ticket\":${TICKET},\"pr\":<P>}
  {\"status\":\"refacto\",\"ticket\":${TICKET},\"reason\":\"...\"}
  {\"status\":\"needs_opus_escalation\",\"ticket\":${TICKET}}
  {\"status\":\"rate_limited\",\"ticket\":${TICKET},\"retry_in\":<sec>}
  {\"status\":\"failed\",\"ticket\":${TICKET},\"reason\":\"...\"}

Ton dernier message DOIT être uniquement ce JSON (rien d'autre, pas de prose)."

    cd "$REPO_ROOT"
    timeout "$AGENT_TIMEOUT" claude \
        --agent "$AGENT" \
        --model "$MODEL" \
        --print \
        --output-format json \
        --allow-dangerously-skip-permissions \
        --max-budget-usd "$BUDGET" \
        "$PROMPT" \
        > "$AGENT_LOG" 2>&1 || true
}

# ---- Main loop ----
TICK=0
while [ $TICK -lt $MAX_TICKS ]; do
    PLAN_FILE="$TICK_DIR/tick_${TICK}_plan.json"
    RESULT_FILE="$TICK_DIR/tick_${TICK}_result.json"

    # 1. Compute the plan
    bash "$SCRIPT_DIR/dispatch_plan.sh" $EPICS > "$PLAN_FILE"

    # 2. Detect manual user holds
    ESCALATE_TICKETS=$(gh issue list --label "dispatch=escalate" --state open --json number --jq '[.[].number] | @csv' 2>/dev/null | tr -d '"' || echo "")
    if [ -n "$ESCALATE_TICKETS" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" USER_INTERVENTION "tickets_to_escalate=$ESCALATE_TICKETS"
        echo "USER_INTERVENTION: tickets needing manual intervention: $ESCALATE_TICKETS" >&2
        exit 2
    fi

    # 3. Empty plan: either everything is done, or in flight (waiting for a parent merge)
    PLAN_LEN=$(jq 'length' "$PLAN_FILE")
    if [ "$PLAN_LEN" -eq 0 ]; then
        # Are there any non-terminal tickets left?
        NON_DONE=$(bash "$SCRIPT_DIR/epic_state.sh" $EPICS 2>/dev/null | grep -cE '\| (Todo|To Do|In progress|In review) ' || true)
        if [ "${NON_DONE:-0}" -eq 0 ]; then
            break  # all terminal, exit loop
        fi
        bash "$SCRIPT_DIR/log_event.sh" "$AID" WAIT "non_done=$NON_DONE plan_empty"
        sleep "$SLEEP_WAIT"
        TICK=$((TICK + 1))
        continue
    fi

    bash "$SCRIPT_DIR/log_event.sh" "$AID" TICK_DISPATCH "tick=$TICK plan_len=$PLAN_LEN"

    # 4. For each plan entry, ensure worktree + spawn the agent in parallel
    declare -A AGENT_FILES=()
    PIDS=()
    while IFS= read -r entry; do
        TICKET=$(echo "$entry" | jq -r '.ticket')
        AGENT=$(echo "$entry" | jq -r '.agent')
        MODEL=$(echo "$entry" | jq -r '.model')
        INDEX=$(echo "$entry" | jq -r '.index')
        EPIC=$(echo "$entry" | jq -r '.epic')
        BASE=$(echo "$entry" | jq -r '.base_branch')

        # Set ticket 'In progress' on the board (idempotent)
        bash "$SCRIPT_DIR/set_ticket_status.sh" "$TICKET" "In progress" >/dev/null 2>&1 || true

        # Provision worktree + docker stack (no-op if already done)
        WT_PATH=$(ensure_worktree "$TICKET" "$INDEX" "$EPIC" "$BASE")
        if [ -z "$WT_PATH" ] || [ ! -d "$WT_PATH" ]; then
            bash "$SCRIPT_DIR/log_event.sh" "$AID" WORKTREE_FAIL "ticket=$TICKET index=$INDEX"
            continue
        fi

        AGENT_LOG="$TICK_DIR/tick_${TICK}_agent_${TICKET}.json"
        AGENT_FILES[$TICKET]="$AGENT_LOG"

        bash "$SCRIPT_DIR/log_event.sh" "$AID" AGENT_SPAWN "ticket=$TICKET agent=$AGENT model=$MODEL index=$INDEX budget=$([ "$MODEL" = "opus" ] && echo "$BUDGET_OPUS" || echo "$BUDGET_SONNET")"

        spawn_agent "$TICKET" "$AGENT" "$MODEL" "$INDEX" "$EPIC" "$BASE" "$WT_PATH" "$AGENT_LOG" &
        PIDS+=($!)
    done < <(jq -c '.[]' "$PLAN_FILE")

    # 5. Wait for all spawned agents
    for pid in "${PIDS[@]}"; do
        wait "$pid" || true
    done

    bash "$SCRIPT_DIR/log_event.sh" "$AID" TICK_AGENTS_DONE "tick=$TICK count=${#PIDS[@]}"

    # 6. Aggregate sub-agent JSON returns into the tick_result file
    {
        echo "{"
        echo "  \"tick\": $TICK,"
        echo "  \"epics\": \"$EPICS_KEY\","
        echo "  \"results\": ["
        FIRST=1
        for ticket in "${!AGENT_FILES[@]}"; do
            file="${AGENT_FILES[$ticket]}"

            # The claude CLI emits a wrapper {result, is_error, ...}. Extract .result
            # and try to parse it as the strict JSON contract.
            RESULT_TEXT=""
            CLI_ERROR="false"
            if [ -s "$file" ]; then
                if jq -e '.result' "$file" >/dev/null 2>&1; then
                    RESULT_TEXT=$(jq -r '.result // ""' "$file")
                    CLI_ERROR=$(jq -r '.is_error // false' "$file")
                else
                    RESULT_TEXT=$(head -c 500 "$file")
                    CLI_ERROR="true"
                fi
            else
                RESULT_TEXT="(empty output — claude CLI killed or budget exhausted)"
                CLI_ERROR="true"
            fi

            if echo "$RESULT_TEXT" | jq -e '.status' >/dev/null 2>&1; then
                RESULT_JSON="$RESULT_TEXT"
            else
                ESCAPED=$(echo "$RESULT_TEXT" | jq -Rs '.' | head -c 500)
                RESULT_JSON=$(jq -nc \
                    --argjson ticket "$ticket" \
                    --arg reason "non-JSON return from agent (cli_error=$CLI_ERROR): $ESCAPED" \
                    '{status:"failed", ticket:$ticket, reason:$reason}')
            fi

            [ "$FIRST" = "0" ] && echo ","
            echo -n "    $RESULT_JSON"
            FIRST=0
        done
        echo ""
        echo "  ]"
        echo "}"
    } > "$RESULT_FILE"

    # 7. Apply board mutations
    bash "$SCRIPT_DIR/process_tick_result.sh" "$RESULT_FILE"

    # 8. Sleep and tick
    sleep "$SLEEP_TICK"
    TICK=$((TICK + 1))
done

if [ $TICK -ge $MAX_TICKS ]; then
    bash "$SCRIPT_DIR/log_event.sh" "$AID" MAX_TICKS_REACHED "ticks=$TICK"
    echo "ERROR: max ticks atteint ($MAX_TICKS) sans terminer" >&2
    exit 3
fi

# ---- Done: every sub-ticket is terminal (validated/In review or escalated) ----
# Unlike leviathan, we do NOT auto-archive epics. The user owns the
# Done transition after PR merges.
bash "$SCRIPT_DIR/log_event.sh" "$AID" COMPLETE "all_terminal ticks=$TICK"
echo "DONE: epics=$EPICS terminated in $TICK ticks (review PRs and merge manually)"
exit 0
