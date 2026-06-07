#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# audit_run_parallel.sh <RUN_DIR>
#
# Phase 2 of /audit-functional (v2 "DB-bis" model). Fans out N flow-runner CLI
# agents in parallel, one per fixture, each driving its OWN pre-provisioned app
# instance (own port + own cloned DB — see manage_audit_instances.sh). Read-only
# on the codebase: NO worktree, NO branch, NO board mutation. Isolation is
# achieved per-instance (each runner's writes land in a different clone DB), so
# the SAME ProConnect identity can be used by every runner with zero collision.
#
# Each runner writes its findings to:
#   <RUN_DIR>/findings/runner-<i>.jsonl   (one JSON object per path)
# Raw CLI trace (debug): <RUN_DIR>/runner-cli-<i>.log
#
# Inputs (in RUN_DIR):
#   flows.json            (flow-cartographer, phase 1)
#   instances.map.json    (manage_audit_instances.sh, phase 1.5)
#                         { "<fixtureId>": { "db":.., "port":.., "index":.., "pid":.. } }
#
# Env (defaults):
#   AUDIT_MAX_PARALLEL    5     max concurrent runner CLIs (instances are all up already)
#   AUDIT_BUDGET          5     USD max per runner
#   AUDIT_AGENT_TIMEOUT   3600  seconds max per runner
#
# Exit: 0 ok · 1 bad input

set -euo pipefail

TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then TIMEOUT_BIN="gtimeout"; fi

RUN_DIR="${1:-}"
if [ -z "$RUN_DIR" ] || [ ! -d "$RUN_DIR" ]; then
    echo "Usage: $0 <RUN_DIR>" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOWS="$RUN_DIR/flows.json"
MAP="$RUN_DIR/instances.map.json"
FINDINGS_DIR="$RUN_DIR/findings"

MAX_PARALLEL="${AUDIT_MAX_PARALLEL:-5}"
BUDGET="${AUDIT_BUDGET:-5}"
AGENT_TIMEOUT="${AUDIT_AGENT_TIMEOUT:-3600}"
RUN_ID="$(basename "$RUN_DIR")"
AID="audit-orchestrator-${RUN_ID}"

for F in "$FLOWS" "$MAP"; do
    [ -s "$F" ] || { echo "ERROR: missing or empty $F" >&2; exit 1; }
done
command -v claude >/dev/null 2>&1 || { echo "ERROR: claude CLI not found" >&2; exit 1; }
mkdir -p "$FINDINGS_DIR"

# Isolated-browser mcp-config (written by `manage_audit_instances.sh auth`):
# overrides the shared `playwright` server with `--isolated --storage-state` so
# each runner gets its own in-memory Chrome (no SingletonLock contention),
# authenticated. Absent → runners share one Chrome and serialise (degraded).
MCP_CFG="$RUN_DIR/playwright-mcp.json"
MCP_ARGS=()
if [ -s "$MCP_CFG" ]; then
    MCP_ARGS=(--mcp-config "$MCP_CFG")
    bash "$SCRIPT_DIR/log_event.sh" "$AID" BROWSER_ISOLATED "cfg=$MCP_CFG"
else
    bash "$SCRIPT_DIR/log_event.sh" "$AID" BROWSER_SHARED "no isolated mcp-config — runners will serialise on one Chrome"
fi

bash "$SCRIPT_DIR/log_event.sh" "$AID" RUN_START "run=$RUN_ID max_parallel=$MAX_PARALLEL budget=$BUDGET"

# ---- Spawn one runner per fixture, each bound to its instance's PORT ----
spawn_runner() {
    local IDX="$1" PORT="$2" FIXTURE="$3" PATH_IDS="$4" CLI_LOG="$5"

    local PROMPT="Tu es flow-runner #${IDX} pour un audit fonctionnel /audit-functional (modèle DB-bis).
Suis STRICTEMENT .claude/agents/flow-runner/AGENT.md et les schémas de .claude/rules/audit-functional.md.

Paramètres :
- RUN_DIR : ${RUN_DIR}
- RUNNER_INDEX : ${IDX}  (ta sortie = ${RUN_DIR}/findings/runner-${IDX}.jsonl)
- PORT : ${PORT}  (ton instance d'app DÉDIÉE — base URL http://localhost:${PORT})
- FIXTURE : ${FIXTURE}  (la classe de branche déjà seedée dans LA DB de cette instance)
- PATH_IDS : ${PATH_IDS}

Ton instance http://localhost:${PORT} a sa PROPRE base de données clonée, seedée avec l'état de la classe de branche '${FIXTURE}'. Tu agis sur le SIREN de session (identité ProConnect) — pas besoin de sélectionner une entreprise, le funnel l'utilise automatiquement. Tes écritures restent isolées dans cette DB : tu ne peux pas entrer en collision avec un autre runner.

Lis ${RUN_DIR}/flows.json, sélectionne les paths dont l'id est dans PATH_IDS, exécute-les contre http://localhost:${PORT}, applique les oracles (déterministe d'abord, LLM seulement sur l'ambigu), et écris UNE ligne JSONL par path dans ${RUN_DIR}/findings/runner-${IDX}.jsonl.

DISCIPLINE DE LOGGING (blocking) : bash scripts/orchestration/log_event.sh flow-runner-${IDX} <EVENT> à chaque transition (START, PATH_<id>_OK/FAIL, RUN_DONE).

CONTRAINTES : read-only total (aucun git, aucune modif code, aucune mutation board, aucune création de ticket). Reste sur TON port ${PORT}. Scrub PII/SIREN/secrets dans les evidence. N'invoque AUCUN skill built-in. Ne modifie jamais .claude/settings*.json."

    local TIMEOUT_PREFIX=""
    [ -n "$TIMEOUT_BIN" ] && TIMEOUT_PREFIX="$TIMEOUT_BIN $AGENT_TIMEOUT"
    $TIMEOUT_PREFIX env -u CLAUDECODE claude \
        --agent flow-runner --model sonnet \
        ${MCP_ARGS[@]+"${MCP_ARGS[@]}"} \
        --print --output-format stream-json --verbose \
        --dangerously-skip-permissions --max-budget-usd "$BUDGET" \
        "$PROMPT" > "$CLI_LOG" 2>&1 || true
}

# Pre-load entries (fixture + port) before forking (anti-race discipline).
FIXTURES=(); PORTS=()
while IFS= read -r entry; do
    FIXTURES+=("$(echo "$entry" | jq -r '.key')")
    PORTS+=("$(echo "$entry" | jq -r '.value.port')")
done < <(jq -c 'to_entries[]' "$MAP")

[ "${#FIXTURES[@]}" -gt 0 ] || { echo "ERROR: no instances in $MAP" >&2; exit 1; }
bash "$SCRIPT_DIR/log_event.sh" "$AID" RUN_PLAN "runners=${#FIXTURES[@]}"

IDX=0; PIDS=()
for n in "${!FIXTURES[@]}"; do
    FIXTURE="${FIXTURES[$n]}"; PORT="${PORTS[$n]}"
    PATH_IDS=$(jq -r --arg fx "$FIXTURE" '[.paths[] | select(.fixture==$fx) | .id] | join(" ")' "$FLOWS")
    if [ -z "$PATH_IDS" ]; then
        bash "$SCRIPT_DIR/log_event.sh" "$AID" RUNNER_SKIP "fixture=$FIXTURE reason=no_paths"
        IDX=$((IDX + 1)); continue
    fi
    CLI_LOG="$RUN_DIR/runner-cli-${IDX}.log"
    bash "$SCRIPT_DIR/log_event.sh" "$AID" RUNNER_SPAWN "idx=$IDX fixture=$FIXTURE port=$PORT paths=$(echo "$PATH_IDS" | wc -w | tr -d ' ')"
    spawn_runner "$IDX" "$PORT" "$FIXTURE" "$PATH_IDS" "$CLI_LOG" &
    PIDS+=($!)
    IDX=$((IDX + 1))

    if [ "${#PIDS[@]}" -ge "$MAX_PARALLEL" ]; then
        for pid in "${PIDS[@]}"; do wait "$pid" || true; done
        PIDS=()
    fi
done
for pid in "${PIDS[@]}"; do wait "$pid" || true; done

RUNNER_FILES=$(ls "$FINDINGS_DIR"/runner-*.jsonl 2>/dev/null | wc -l | tr -d ' ')
TOTAL_LINES=0
[ "$RUNNER_FILES" -gt 0 ] && TOTAL_LINES=$(cat "$FINDINGS_DIR"/runner-*.jsonl 2>/dev/null | grep -c '' || echo 0)
bash "$SCRIPT_DIR/log_event.sh" "$AID" RUN_OK "runner_files=$RUNNER_FILES path_results=$TOTAL_LINES"
echo "DONE: $RUNNER_FILES runner file(s), $TOTAL_LINES path result(s) → $FINDINGS_DIR"
exit 0
