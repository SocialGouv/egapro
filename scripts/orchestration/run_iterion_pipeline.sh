#!/usr/bin/env bash
#
# run_iterion_pipeline.sh <analyse|implement> <issue#> [options]
#
# Canonical launcher for the egapro iterion bots. Replaces the ad-hoc scratchpad
# scripts and the now-dead `claude --agent code-dev` / epic_loop.sh paths (the
# conception/execution agents are iterion nodes, not registrable CLI agents).
#
#   analyse   -> egapro_analyse_agents.bot   (conception: PO / architect / bug-analyst)
#   implement -> egapro_implement_agents.bot (exécution: fan-out epic OR mono-ticket)
#
# Design notes
# ------------
# * A dedicated **run-worktree** detached on the pipeline branch carries the
#   `.bot` files + `scripts/orchestration/*` (absent from alpha / epic/* / ticket/*).
#   The bots' tool commands cd into it via {{vars.egapro_dir}}; the real code
#   work happens in per-sub-run auto-worktrees (subbot `worktree: auto`) and in
#   dedicated worktrees the end-of-epic agents provision themselves.
# * **ITERION_SKIP_MCP_HEALTH=1** makes the project's HTTP-OAuth figma MCP (which
#   fails its startup health-check headless) non-fatal — see iterion --skip-mcp-health.
#   This REPLACES the old `.mcp.json` neutralisation, which risked committing an
#   emptied MCP config. We never mutate `.mcp.json`.
# * `--sandbox none` (host exec, the agents need docker/pnpm/gh) and
#   `--merge-into none` (all real work is pushed to ticket/epic branches by tool
#   commands; the run-worktree must never be auto-merged into the pipeline branch).
#
# Usage
#   run_iterion_pipeline.sh analyse   <issue#>            # foreground, interactive gates
#   run_iterion_pipeline.sh implement <issue#>            # background + studio (default)
#   options: --repo <owner/name>  --fg | --bg  --fresh  --no-studio  --port <P>  --var K=V
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PHASE="${1:-}"
ISSUE="${2:-}"
shift 2 2>/dev/null || true

REPO="${EGAPRO_REPO:-SocialGouv/egapro}"
PIPELINE_BRANCH="${ITERION_PIPELINE_BRANCH:-add-iterion-agent-pipelines}"
STUDIO_PORT="${ITERION_STUDIO_PORT:-}"   # empty → derive per-issue below (avoid concurrent-run clash)
MODE=""        # fg | bg  (empty = auto per phase)
FRESH=0
STUDIO=1
EXTRA_VARS=()  # extra --var K=V forwarded to the bot (e.g. analyse description/extra_context)
# Note: resolving a paused human gate is NOT done here — it is a direct
#   iterion resume <run-id> --store-dir <store> --answer <key>=<val>
# (the launcher prints the exact command). This script only starts fresh runs.

while [ $# -gt 0 ]; do
    case "$1" in
        --repo) REPO="$2"; shift 2 ;;
        --fg) MODE=fg; shift ;;
        --bg) MODE=bg; shift ;;
        --fresh) FRESH=1; shift ;;
        --no-studio) STUDIO=0; shift ;;
        --port) STUDIO_PORT="$2"; shift 2 ;;
        --var) EXTRA_VARS+=(--var "$2"); shift 2 ;;
        *) echo "unknown option: $1" >&2; exit 2 ;;
    esac
done

case "$PHASE" in
    analyse)   BOT="egapro_analyse_agents.bot";   : "${MODE:=bg}" ;;
    implement) BOT="egapro_implement_agents.bot"; : "${MODE:=bg}" ;;
    *) echo "usage: run_iterion_pipeline.sh <analyse|implement> <issue#> [--var K=V ...] [options]" >&2; exit 2 ;;
esac
# implement always needs a real issue; analyse can create from a description
# (empty issue → the bot's mode_gate handles it) — slug the run dir as "new".
if [ "$PHASE" = implement ] && ! [[ "$ISSUE" =~ ^[0-9]+$ ]]; then
    echo "error: implement requires an issue number (got '${ISSUE}')" >&2
    exit 2
fi
SLUG="$ISSUE"; [[ "$SLUG" =~ ^[0-9]+$ ]] || SLUG="new"

# Per-issue studio port (unless pinned via --port / ITERION_STUDIO_PORT) so two
# concurrent runs don't share one studio pointed at the wrong run-dir.
if [ -z "$STUDIO_PORT" ]; then
    if [[ "$ISSUE" =~ ^[0-9]+$ ]]; then STUDIO_PORT=$(( 4900 + ISSUE % 90 )); else STUDIO_PORT=4900; fi
fi

RUN_DIR="/tmp/egapro-iterion-${PHASE}-${SLUG}"
STORE="${RUN_DIR}/.iterion"    # default store name so `iterion studio --dir` finds it
LOG="/tmp/egapro-iterion-${PHASE}-${SLUG}.log"
PIDFILE="/tmp/egapro-iterion-${PHASE}-${SLUG}.pid"
RUNIDFILE="/tmp/egapro-iterion-${PHASE}-${SLUG}.runid"
# Explicit, human-referenceable run id (no CLI validation — used as the store
# path) so a paused human gate can be resumed by name:
#   iterion resume <run-id> --store-dir <store> --answer approved=true
RUN_ID="egapro-${PHASE}-${SLUG}-$(date +%Y%m%d-%H%M%S)"

echo "── iterion ${PHASE} #${ISSUE} (${REPO}) ──"

# ── 1. Provision / refresh the run-worktree on the pipeline branch ──────────────
# Base on the LOCAL pipeline-branch HEAD (committed, not necessarily pushed) so a
# local commit is enough to test. The bots' own tool commands fetch origin as they
# need it. Best-effort refresh of the remote-tracking ref for the agents' git ops.
git -C "$REPO_ROOT" fetch --quiet origin "$PIPELINE_BRANCH" 2>/dev/null || true
if ! BASE_REF=$(git -C "$REPO_ROOT" rev-parse --verify --quiet "refs/heads/${PIPELINE_BRANCH}"); then
    echo "  ✗ local branch ${PIPELINE_BRANCH} not found — check it out or set ITERION_PIPELINE_BRANCH" >&2
    exit 1
fi
if git -C "$REPO_ROOT" worktree list --porcelain | grep -qx "worktree $RUN_DIR"; then
    git -C "$RUN_DIR" reset --hard "$BASE_REF" --quiet
    git -C "$RUN_DIR" clean -fdq -e .iterion 2>/dev/null || true
    echo "  run-worktree: $RUN_DIR (refreshed on ${PIPELINE_BRANCH} @ ${BASE_REF:0:9})"
else
    git -C "$REPO_ROOT" worktree add -f --detach "$RUN_DIR" "$BASE_REF" >/dev/null
    echo "  run-worktree: $RUN_DIR (created, detached on ${PIPELINE_BRANCH} @ ${BASE_REF:0:9})"
fi
[ "$FRESH" -eq 1 ] && { rm -rf "$STORE"; echo "  store purged (--fresh)"; }

# ── 2. Sanity: the bot validates ────────────────────────────────────────────────
if ! iterion validate "$RUN_DIR/$BOT" 2>&1 | grep -q 'result: OK'; then
    echo "  ✗ $BOT does not validate — aborting" >&2
    iterion validate "$RUN_DIR/$BOT" 2>&1 | grep -E 'error|E[0-9]|C[0-9]' | head -5 >&2
    exit 1
fi
echo "  ✓ $BOT validates"

# ── 3. Build the run command ────────────────────────────────────────────────────
# env -u CLAUDECODE: strip the parent Claude Code marker so the child claude_code
# backend spawns cleanly. ITERION_SKIP_MCP_HEALTH: tolerate the broken figma MCP.
IT_RUN=(env -u CLAUDECODE ITERION_SKIP_MCP_HEALTH=1
    iterion run "$RUN_DIR/$BOT" --run-id "$RUN_ID"
    --var issue="$ISSUE" --var repo="$REPO" --var egapro_dir="$RUN_DIR"
    "${EXTRA_VARS[@]}"
    --store-dir "$STORE" --sandbox none --merge-into none --log-level info)
echo "$RUN_ID" >"$RUNIDFILE"
echo "  run-id: $RUN_ID"

# ── 4. Optional studio (background mode) ────────────────────────────────────────
start_studio() {
    [ "$STUDIO" -eq 1 ] || return 0
    if curl -fsS "http://127.0.0.1:${STUDIO_PORT}/" >/dev/null 2>&1; then
        echo "  studio already up on :${STUDIO_PORT}"
        return 0
    fi
    env -u CLAUDECODE ITERION_SKIP_MCP_HEALTH=1 \
        nohup iterion studio --dir "$RUN_DIR" --port "$STUDIO_PORT" --no-browser \
        >"/tmp/egapro-iterion-studio.log" 2>&1 &
    echo "  studio launching on http://127.0.0.1:${STUDIO_PORT} (log /tmp/egapro-iterion-studio.log)"
}

# ── 5. Launch ───────────────────────────────────────────────────────────────────
if [ "$MODE" = fg ]; then
    echo "  mode: FOREGROUND (interactive — answer human gates on this terminal)"
    echo
    exec "${IT_RUN[@]}"
else
    start_studio
    echo "  mode: BACKGROUND (--no-interactive; human gates pause the run — resolve in studio)"
    nohup "${IT_RUN[@]}" --no-interactive >"$LOG" 2>&1 &
    PID=$!
    echo "$PID" >"$PIDFILE"
    echo "  launched (pid $PID)"
    echo
    echo "  watch  : http://127.0.0.1:${STUDIO_PORT}/runs   |   tail -f $LOG   |   /report ${ISSUE}"
    echo "  gate   : iterion resume $RUN_ID --store-dir $STORE --answer approved=true   (resolve a human pause)"
    echo "  stop   : kill \$(cat $PIDFILE)"
fi
