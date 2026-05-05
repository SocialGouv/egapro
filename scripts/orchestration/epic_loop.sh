#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# epic_loop.sh <epic_N1> [<epic_N2> ...]
#
# Bash loop driver for /implement (mode epic) orchestration. Runs in the background, ticking
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

# ---- Mac compat ----
# `declare -A` (associative arrays) needs bash 4+. macOS ships bash 3.2 by
# default; auto re-exec via Homebrew bash if available, otherwise instruct.
# (Note: this guard fires before `set -e` only if placed at the top, so the
# script's main logic is the bash 4+ block that follows.)

# `timeout` is GNU coreutils. Linux distros ship it as `timeout`; macOS users
# get it via `brew install coreutils` which installs it as `gtimeout`. If
# neither is present, run claude without a hard timeout — the loop's per-tick
# aggregation will still catch pathological cases.
TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then
    TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_BIN="gtimeout"
fi

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

# ---- Pre-flight: validate args + bootstrap epic integration branches ----
# Each epic gets a dedicated `epic/<N>` integration branch (created from
# origin/alpha). Ticket PRs target this branch ; process_tick_result.sh
# squash-merges validated tickets into it ; a final PR `epic/<N> → alpha`
# is opened at the end for human review.
for N in $EPICS; do
    EPIC_LBL=$(gh issue view "$N" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || echo "")
    if ! echo "$EPIC_LBL" | grep -qiE '(^|,)epic(,|$)'; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" ERROR "not_an_epic:$N"
        echo "ERROR: #$N is not an epic" >&2
        exit 1
    fi

    # Ensure the integration branch exists on origin (idempotent)
    if ! bash "$SCRIPT_DIR/ensure_epic_branch.sh" "$N" >/dev/null; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" ERROR "ensure_epic_branch_failed:$N"
        echo "ERROR: cannot ensure epic/$N integration branch" >&2
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

    # CAREFUL: the function's stdout is captured by the caller via $(...).
    # Sub-commands here must NOT write to stdout — redirect their output to
    # stderr (>&2 2>&1) so the only thing reaching the caller is the final
    # `echo "$WT_PATH"`. The redirected output still lands in the loop log
    # file (since epic_loop.sh is launched with `nohup ... > LOG 2>&1`).
    if [ ! -d "$WT_PATH" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" WORKTREE_CREATE "path=$WT_PATH base=$BASE"
        # Refresh remote so the base branch is up-to-date
        (cd "$REPO_ROOT" && git fetch origin "${BASE#origin/}") >&2 2>&1 || true
        # Detached worktree — code-dev will create the ticket branch itself (step 4 of AGENT.md)
        (cd "$REPO_ROOT" && git worktree add --detach "$WT_PATH" "$BASE") >&2 2>&1 \
            || { bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" WORKTREE_FAIL "git worktree add failed"; return 1; }
    fi

    if [ ! -f "$WT_PATH/packages/app/.env.local" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$TID_AID" STACK_SETUP "running setup-worktree.sh $INDEX (pnpm install + docker compose + migrations, ~1-3 min)"
        # Use the main-repo's setup-worktree.sh (resolved via $REPO_ROOT) so
        # the bootstrap works even if the worktree's checked-out branch does
        # not yet contain the orchestration infrastructure scripts.
        (cd "$WT_PATH" && bash "$REPO_ROOT/scripts/setup-worktree.sh" "$INDEX") >&2 2>&1 \
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
    local BRANCH="$9"

    local BUDGET="$BUDGET_SONNET"
    [ "$MODEL" = "opus" ] && BUDGET="$BUDGET_OPUS"

    local PORT=$((3001 + INDEX))

    local PROMPT="Ticket #${TICKET} à traiter (epic parent #${EPIC}).
Worktree: ${WT_PATH}
Worktree index: ${INDEX} (dev server port = ${PORT})
Base branch: ${BASE}  (remote-tracking ref, déjà fetchée par l'orchestrateur)
Working branch: ${BRANCH}  (déjà créée et linkée à l'issue via createLinkedBranch — pousse tes commits dessus)

Suivre STRICTEMENT le workflow de .claude/agents/code-dev/AGENT.md.

L'orchestrateur a déjà :
- créé le worktree en mode --detach sur ${BASE}
- lancé setup-worktree.sh ${INDEX} (pnpm install + stack docker + .env.local + migrations OK)
- passé le ticket #${TICKET} en \"In progress\" sur le board
- **créé la branche ${BRANCH}** sur GitHub, officiellement linkée à l'issue #${TICKET} (la PR que tu ouvriras y apparaîtra automatiquement dans la sidebar Development — pas besoin de comment cross-ref)

Toi : depuis le worktree, fetch et checkout la branche existante :
\`\`\`bash
cd ${WT_PATH}
git fetch origin ${BRANCH}
git checkout ${BRANCH}
\`\`\`
Puis implémenter, push tes commits sur ${BRANCH}, créer la PR draft (\`gh pr create --base ${BASE#origin/} --head ${BRANCH}\`), faire les 4 + 2 validators internes, itérer sur les RETRY, retourner le verdict final JSON.

**Ne crée PAS une autre branche** (pas de \`checkout -b\`). La branche ${BRANCH} est déjà créée et linkée — utilise-la telle quelle.

REGLES STRICTES (appliquer sans exception) :
- **N'invoque AUCUN skill built-in** (fewer-permission-prompts, update-config,
  claude-api, schedule, loop, etc.). Si une de ces skills semble utile, ignore-la
  et reste concentré sur le ticket.
- **Ne modifie JAMAIS .claude/settings.json ni .claude/settings.local.json**.
  Ces fichiers sont user-managed. Si tu rencontres un permission-denied, retourne
  \`failed\` avec la raison, ne tente pas de patcher la config.
- **Pas d'auto-mémoire** : ne crée pas et ne modifie pas les fichiers sous
  ~/.claude/projects/.../memory/ ni MEMORY.md.
- **Reste dans le scope du ticket** : seuls les fichiers listés dans la section
  \"Fichiers impactés\" du ticket peuvent être modifiés.

Format de retour OBLIGATOIRE — un seul de :
  {\"status\":\"validated\",\"ticket\":${TICKET},\"pr\":<P>}
  {\"status\":\"refacto\",\"ticket\":${TICKET},\"reason\":\"...\"}
  {\"status\":\"needs_opus_escalation\",\"ticket\":${TICKET}}
  {\"status\":\"rate_limited\",\"ticket\":${TICKET},\"retry_in\":<sec>}
  {\"status\":\"failed\",\"ticket\":${TICKET},\"reason\":\"...\"}

Ton dernier message DOIT être uniquement ce JSON (rien d'autre, pas de prose)."

    # Start the claude CLI from inside the worktree, NOT the main repo.
    # If the sub-agent forgets to `cd` and runs git/gh commands directly,
    # those land in the worktree where they belong (creating ticket/<N>
    # branch in the worktree's HEAD) instead of polluting the main repo.
    cd "$WT_PATH"
    # NOTE: --dangerously-skip-permissions, NOT --allow-dangerously-skip-permissions.
    # The latter only makes the flag *available* for an interactive session;
    # in --print mode it has no effect, so the sub-agent hits unresolved
    # permission prompts on every gh / bash / pnpm call and aborts.
    # TIMEOUT_BIN may be empty on hosts without timeout/gtimeout — unquoted
    # word-split lets it disappear cleanly.
    local TIMEOUT_PREFIX=""
    [ -n "$TIMEOUT_BIN" ] && TIMEOUT_PREFIX="$TIMEOUT_BIN $AGENT_TIMEOUT"
    $TIMEOUT_PREFIX claude \
        --agent "$AGENT" \
        --model "$MODEL" \
        --print \
        --output-format json \
        --dangerously-skip-permissions \
        --max-budget-usd "$BUDGET" \
        "$PROMPT" \
        > "$AGENT_LOG" 2>&1 || true
}

# ---- Main loop ----
TICK=0
while [ $TICK -lt $MAX_TICKS ]; do
    PLAN_FILE="$TICK_DIR/tick_${TICK}_plan.json"
    RESULT_FILE="$TICK_DIR/tick_${TICK}_result.json"

    # 0. Free up worktree slots whose ticket has reached a terminal pipeline
    # state (In review or Done). Critical for epics with > EPIC_MAX_PARALLEL
    # tickets — without this, slots stay busy until manual cleanup and the
    # remaining tickets can never be dispatched.
    bash "$SCRIPT_DIR/cleanup_terminal_worktrees.sh" $EPICS >/dev/null 2>&1 || true

    # 0bis. Rebase each epic/<N> on origin/alpha so the integration branch
    # stays current. Skipped on the very first tick (epic branch was just
    # created from a fresh origin/alpha by ensure_epic_branch.sh, no rebase
    # needed).
    if [ "$TICK" -gt 0 ]; then
        for N in $EPICS; do
            set +e
            bash "$SCRIPT_DIR/rebase_epic_branch.sh" "$N" >/dev/null
            REBASE_RC=$?
            set -e
            if [ "$REBASE_RC" = "2" ]; then
                bash "$SCRIPT_DIR/log_event.sh" "$AID" REBASE_CONFLICT "epic=$N"
                echo "REBASE CONFLICT on epic/$N — escalating, halting orchestration" >&2
                exit 2
            elif [ "$REBASE_RC" != "0" ]; then
                bash "$SCRIPT_DIR/log_event.sh" "$AID" REBASE_ERROR "epic=$N rc=$REBASE_RC"
                echo "REBASE ERROR on epic/$N (rc=$REBASE_RC) — halting orchestration" >&2
                exit 1
            fi
        done
    fi

    # 1. Compute the plan
    bash "$SCRIPT_DIR/dispatch_plan.sh" $EPICS > "$PLAN_FILE"

    # 2. Detect manual user holds
    ESCALATE_TICKETS=$(gh issue list --label "dispatch=escalate" --state open --json number --jq '[.[].number] | @csv' 2>/dev/null | tr -d '"' || echo "")
    if [ -n "$ESCALATE_TICKETS" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" USER_INTERVENTION "tickets_to_escalate=$ESCALATE_TICKETS"
        echo "USER_INTERVENTION: tickets needing manual intervention: $ESCALATE_TICKETS" >&2
        exit 2
    fi

    # 3. Empty plan: either everything is done, or in flight / blocked
    # waiting for a parent squash-merge.
    #
    # Authoritative signal: a sub-ticket is "done from the AI side" when
    # its `ticket/<N>-*` branch is gone from origin (squash-merged into
    # epic/<N> by process_tick_result.sh ; GitHub auto-deletes the branch).
    # The board status is decorative (humans own In review/Done transitions).
    PLAN_LEN=$(jq 'length' "$PLAN_FILE")
    if [ "$PLAN_LEN" -eq 0 ]; then
        # Refresh remote refs so `git ls-remote` reflects recent merges
        (cd "$REPO_ROOT" && git fetch --prune origin >/dev/null 2>&1) || true

        REMAINING=0
        for N in $EPICS; do
            SUB_NUMBERS=$(gh api graphql -f query="{
                repository(owner:\"SocialGouv\", name:\"egapro\") {
                    issue(number:${N}) { subIssues(first:50) { nodes { number } } }
                }
            }" --jq '[.data.repository.issue.subIssues.nodes[].number] | @csv' 2>/dev/null | tr -d '"' | tr ',' ' ' || echo "")
            for SUB in $SUB_NUMBERS; do
                [ -z "$SUB" ] && continue
                if git ls-remote --exit-code --heads origin "ticket/${SUB}-*" >/dev/null 2>&1; then
                    REMAINING=$((REMAINING + 1))
                fi
            done
        done

        if [ "$REMAINING" -eq 0 ]; then
            break  # every sub-task squash-merged, exit loop with success
        fi
        bash "$SCRIPT_DIR/log_event.sh" "$AID" WAIT "remaining_branches=$REMAINING plan_empty"
        sleep "$SLEEP_WAIT"
        TICK=$((TICK + 1))
        continue
    fi

    bash "$SCRIPT_DIR/log_event.sh" "$AID" TICK_DISPATCH "tick=$TICK plan_len=$PLAN_LEN"

    # 4. For each plan entry, ensure worktree + spawn the agent in parallel
    #
    # IMPORTANT: pre-load all plan entries into an array BEFORE forking any
    # sub-shell. Mixing `< <(jq ...)` (process substitution) with `&` inside
    # the loop body breaks subtly: the backgrounded sub-shell inherits the
    # process substitution's pipe FD, and the main shell's subsequent
    # `read entry` for the next line starves out — only the first plan
    # entry would be dispatched per tick.
    declare -A AGENT_FILES=()
    declare -A AGENT_EPIC=()
    PIDS=()
    PLAN_ENTRIES=()
    while IFS= read -r entry; do
        PLAN_ENTRIES+=("$entry")
    done < <(jq -c '.[]' "$PLAN_FILE")

    for entry in "${PLAN_ENTRIES[@]}"; do
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

        # Create (or reuse) a branch linked to the issue. The PR opened from
        # this branch will then be auto-attached in the issue's "Development"
        # sidebar — no manual cross-ref comment needed.
        BRANCH=$(bash "$SCRIPT_DIR/create_linked_branch.sh" "$TICKET" "$BASE" 2>/dev/null)
        if [ -z "$BRANCH" ]; then
            bash "$SCRIPT_DIR/log_event.sh" "$AID" LINKED_BRANCH_FAIL "ticket=$TICKET base=$BASE"
            continue
        fi

        AGENT_LOG="$TICK_DIR/tick_${TICK}_agent_${TICKET}.json"
        AGENT_FILES[$TICKET]="$AGENT_LOG"
        AGENT_EPIC[$TICKET]="$EPIC"

        bash "$SCRIPT_DIR/log_event.sh" "$AID" AGENT_SPAWN "ticket=$TICKET agent=$AGENT model=$MODEL index=$INDEX branch=$BRANCH budget=$([ "$MODEL" = "opus" ] && echo "$BUDGET_OPUS" || echo "$BUDGET_SONNET")"

        spawn_agent "$TICKET" "$AGENT" "$MODEL" "$INDEX" "$EPIC" "$BASE" "$WT_PATH" "$AGENT_LOG" "$BRANCH" &
        PIDS+=($!)
    done

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

            TICKET_EPIC="${AGENT_EPIC[$ticket]:-}"
            # Tolerant verdict extraction:
            # 1) Pure JSON (the strict contract).
            # 2) JSON inside a ```json ... ``` markdown fence — common when the
            #    sub-agent ignores "no prose" and adds a summary section.
            # 3) The first {...} object in the text containing a `"status"` key.
            # Otherwise fall through to a `failed` result with the raw output.
            RAW_VERDICT=""
            if echo "$RESULT_TEXT" | jq -e '.status' >/dev/null 2>&1; then
                RAW_VERDICT="$RESULT_TEXT"
            else
                FENCED=$(echo "$RESULT_TEXT" | awk '
                    /^```(json)?[[:space:]]*$/ { if (in_block) exit; in_block=1; next }
                    in_block { print }
                ')
                if [ -n "$FENCED" ] && echo "$FENCED" | jq -e '.status' >/dev/null 2>&1; then
                    RAW_VERDICT="$FENCED"
                else
                    EXTRACTED=$(echo "$RESULT_TEXT" | grep -oE '\{[^{}]*"status"[^{}]*\}' | head -1 || true)
                    if [ -n "$EXTRACTED" ] && echo "$EXTRACTED" | jq -e '.status' >/dev/null 2>&1; then
                        RAW_VERDICT="$EXTRACTED"
                    fi
                fi
            fi
            if [ -n "$RAW_VERDICT" ]; then
                RESULT_JSON=$(echo "$RAW_VERDICT" | jq -c --argjson epic "${TICKET_EPIC:-0}" '. + {epic: $epic}')
            else
                ESCAPED=$(echo "$RESULT_TEXT" | jq -Rs '.' | head -c 500 || true)
                RESULT_JSON=$(jq -nc \
                    --argjson ticket "$ticket" \
                    --argjson epic "${TICKET_EPIC:-0}" \
                    --arg reason "non-JSON return from agent (cli_error=$CLI_ERROR): $ESCAPED" \
                    '{status:"failed", ticket:$ticket, epic:$epic, reason:$reason}')
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

# ---- Done: every sub-ticket squash-merged into epic/<N> ----
# Open the final integration PR `epic/<N> → alpha` for each epic in scope
# (idempotent — reuses an existing open PR if any).
for N in $EPICS; do
    set +e
    FINAL_PR=$(bash "$SCRIPT_DIR/open_epic_final_pr.sh" "$N" 2>/dev/null)
    OPEN_RC=$?
    set -e
    if [ "$OPEN_RC" = "0" ] && [ -n "$FINAL_PR" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" FINAL_PR_OPEN "epic=$N pr=$FINAL_PR"
        echo "DONE epic=$N: integration PR #$FINAL_PR opened (epic/$N → alpha) — review + merge manually"
    else
        bash "$SCRIPT_DIR/log_event.sh" "$AID" FINAL_PR_FAIL "epic=$N rc=$OPEN_RC"
        echo "WARN epic=$N: open_epic_final_pr.sh exited $OPEN_RC — open the PR manually" >&2
    fi
done

bash "$SCRIPT_DIR/log_event.sh" "$AID" COMPLETE "all_terminal ticks=$TICK"
echo "DONE: epics=$EPICS terminated in $TICK ticks"
exit 0
