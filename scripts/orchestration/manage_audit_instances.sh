#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required." >&2
  exit 1
fi
# manage_audit_instances.sh <clone|start|teardown> <RUN_DIR>
#
# Provisions N isolated (DB clone + app instance) pairs for true-parallel
# /audit-functional execution. Each parallel runner gets its OWN database
# (a fast TEMPLATE clone of the dev DB) AND its OWN app instance on its own
# port pointing at that clone — so N runners can drive the SAME ProConnect
# identity concurrently with zero DB collision (the funnel is bound to the
# session SIREN; isolation is achieved per-DB, not per-SIREN).
#
#   clone     — read flows.json fixtures, CREATE DATABASE audit_<run>_<i>
#               TEMPLATE <egapro>, write instances.map.json
#               { "<fixtureId>": { "db": ..., "port": ..., "index": i } }.
#   start     — launch one `pnpm dev` app instance per clone (own PORT +
#               DATABASE_URL + NEXTAUTH_URL + NEXT_PUBLIC_EGAPRO_ENV=dev),
#               poll readiness, add "pid" to each map entry.
#   teardown  — stop every instance, then DROP every clone DB.
#
# Cloning requires NO active connections to the template DB → the caller must
# stop the cartography dev server (manage_dev_server.sh stop) before `clone`.
#
# Env (defaults):
#   AUDIT_PORT_BASE       3011    first instance port (avoids 3000 + worktree 3001-5)
#   AUDIT_PG_CONTAINER    egapro-db-1   docker container running postgres
#   AUDIT_PG_URL_BASE     postgres://postgres:postgres@localhost:5438
#   AUDIT_TEMPLATE_DB     egapro  source DB to clone
#   AUDIT_DEV_READY_SECS  180     max wait per instance to answer
#
# Exit: 0 ok · 1 bad input / failure

set -euo pipefail

MODE="${1:-}"
RUN_DIR="${2:-}"
# `sweep` is a global orphan cleanup → RUN_DIR is optional for it.
if [ -z "$MODE" ] || { [ "$MODE" != "sweep" ] && [ -z "$RUN_DIR" ]; }; then
    echo "Usage: $0 <clone|start|teardown> <RUN_DIR>   |   $0 sweep" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLOWS="$RUN_DIR/flows.json"
MAP="$RUN_DIR/instances.map.json"

PORT_BASE="${AUDIT_PORT_BASE:-3011}"
PG_CONTAINER="${AUDIT_PG_CONTAINER:-egapro-db-1}"
PG_URL_BASE="${AUDIT_PG_URL_BASE:-postgres://postgres:postgres@localhost:5438}"
TEMPLATE_DB="${AUDIT_TEMPLATE_DB:-egapro}"
READY_SECS="${AUDIT_DEV_READY_SECS:-180}"
SWEEP_PORTS="${AUDIT_SWEEP_PORTS:-16}"
RUN_ID="$([ -n "$RUN_DIR" ] && basename "$RUN_DIR" || echo "sweep")"
AID="audit-orchestrator-${RUN_ID}"

psql_admin() { docker exec -i "$PG_CONTAINER" psql -U postgres -d postgres "$@"; }
port_up() { curl -sf -o /dev/null "http://localhost:$1" 2>/dev/null; }
# SIGKILL whatever LISTENs on a port (lsof → fuser → ss). Audit instances are
# disposable; SIGKILL releases their DB connections instantly (a graceful
# SIGTERM lets `next start` shut down slowly and hold connections for ~30-60s,
# which then blocks DROP DATABASE).
kill_port() {
    local p="$1" pids=""
    # Try ALL tools and union the pids — `command -v lsof` succeeding does NOT
    # mean lsof *finds* the listener (its -sTCP:LISTEN filter can miss a
    # `next-server`, while `ss` sees it). An elif chain stopping at the first
    # *available* tool silently misses such listeners.
    if command -v lsof >/dev/null 2>&1; then
        pids="$pids $(lsof -ti ":$p" -sTCP:LISTEN 2>/dev/null; lsof -ti "tcp:$p" 2>/dev/null)"
    fi
    if command -v ss >/dev/null 2>&1; then
        pids="$pids $(ss -ltnpH "sport = :$p" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2)"
    fi
    if command -v fuser >/dev/null 2>&1; then
        pids="$pids $(fuser "$p/tcp" 2>/dev/null | tr -d ' ')"
    fi
    pids="$(printf '%s\n' $pids | grep -E '^[0-9]+$' | sort -u | tr '\n' ' ')"
    [ -n "${pids// /}" ] && { kill -KILL $pids 2>/dev/null || true; return 0; }
    return 1
}
# Recursively SIGKILL a process and all its descendants. `next start` runs as
# pnpm → (sh) → next-server; killing only the pnpm pid leaves next-server alive,
# holding (and reconnecting) DB connections that block DROP DATABASE.
kill_tree() {
    local p="$1" child
    for child in $(pgrep -P "$p" 2>/dev/null || true); do kill_tree "$child"; done
    kill -KILL "$p" 2>/dev/null || true
}

# DROP a clone DB robustly: terminate backends, then wait until the connection
# count actually reaches 0 (postgres keeps a DB "in use" for a moment after a
# client disconnects) before dropping. Returns 0 on success.
drop_db() {
    local db="$1" i n
    for i in $(seq 1 15); do
        psql_admin -tAc "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db}' AND pid<>pg_backend_pid();" >/dev/null 2>&1 || true
        n="$(psql_admin -tAc "SELECT count(*) FROM pg_stat_activity WHERE datname='${db}';" 2>/dev/null | tr -d ' ')"
        if [ "${n:-1}" -eq 0 ] && psql_admin -c "DROP DATABASE IF EXISTS ${db};" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    psql_admin -c "DROP DATABASE IF EXISTS ${db};" >/dev/null 2>&1
}

case "$MODE" in
  clone)
    [ -s "$FLOWS" ] || { echo "ERROR: missing $FLOWS" >&2; exit 1; }
    # Sanitised, length-bounded prefix for valid postgres identifiers.
    SAN="$(printf '%s' "$RUN_ID" | tr -c 'a-zA-Z0-9' '_' | cut -c1-48)"
    # Drop stray connections to the template (TEMPLATE clone needs none).
    psql_admin -tAc "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${TEMPLATE_DB}' AND pid<>pg_backend_pid();" >/dev/null 2>&1 || true

    FIXTURES=()
    while IFS= read -r fx; do [ -n "$fx" ] && FIXTURES+=("$fx"); done < <(jq -r '.fixtures[].id' "$FLOWS")
    [ "${#FIXTURES[@]}" -gt 0 ] || { echo "ERROR: no fixtures in $FLOWS" >&2; exit 1; }

    echo '{}' > "$MAP"
    idx=0
    for fx in "${FIXTURES[@]}"; do
        db="audit_${SAN}_${idx}"
        port=$((PORT_BASE + idx))
        psql_admin -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${db};" -c "CREATE DATABASE ${db} TEMPLATE ${TEMPLATE_DB};" >/dev/null
        jq --arg fx "$fx" --arg db "$db" --argjson port "$port" --argjson idx "$idx" \
           '.[$fx]={db:$db,port:$port,index:$idx}' "$MAP" > "$MAP.tmp" && mv "$MAP.tmp" "$MAP"
        bash "$SCRIPT_DIR/log_event.sh" "$AID" DB_CLONE "fixture=$fx db=$db port=$port"
        echo "  cloned $db (fixture=$fx, port=$port)"
        idx=$((idx + 1))
    done
    echo "DONE clone: ${#FIXTURES[@]} DB(s) → $MAP"
    ;;

  start)
    [ -s "$MAP" ] || { echo "ERROR: missing $MAP (run 'clone' first)" >&2; exit 1; }
    APP_DIR="$REPO_ROOT/packages/app"

    # N concurrent instances must run `next start` (read-only on the prebuilt
    # .next), NOT `next dev`: two `pnpm dev` from the same dir race on the copy
    # presteps + .next. So build ONCE (NEXT_PUBLIC_EGAPRO_ENV=dev baked in so the
    # [DEV] Remplir button ships), then every instance serves that build with
    # its own runtime DATABASE_URL / NEXTAUTH_URL / PORT.
    if [ "${AUDIT_FORCE_BUILD:-0}" = "1" ] || [ ! -f "$APP_DIR/.next/BUILD_ID" ]; then
        echo "Building app once for next start (NEXT_PUBLIC_EGAPRO_ENV=dev)… ~1-3 min"
        bash "$SCRIPT_DIR/log_event.sh" "$AID" BUILD_START ""
        if ! ( cd "$APP_DIR" && NEXT_PUBLIC_EGAPRO_ENV=dev pnpm build ) > "$RUN_DIR/build.log" 2>&1; then
            echo "ERROR: build failed (see $RUN_DIR/build.log)" >&2
            bash "$SCRIPT_DIR/log_event.sh" "$AID" BUILD_FAIL ""
            exit 1
        fi
        bash "$SCRIPT_DIR/log_event.sh" "$AID" BUILD_OK ""
    fi

    # Launch every instance (next start), then poll all of them for readiness.
    PORTS=()
    while IFS= read -r entry; do
        fx="$(echo "$entry" | jq -r '.key')"
        db="$(echo "$entry" | jq -r '.value.db')"
        port="$(echo "$entry" | jq -r '.value.port')"
        log="$RUN_DIR/instance-${port}.log"
        # Defensive: clear any stale listener on this port so the instance can
        # bind (a leftover process → EADDRINUSE → instance serves the wrong/no
        # DB and every route 500s).
        kill_port "$port" && sleep 1 || true
        (
            cd "$APP_DIR"
            DATABASE_URL="${PG_URL_BASE}/${db}" \
            NEXTAUTH_URL="http://localhost:${port}" \
            PORT="$port" \
              nohup pnpm start > "$log" 2>&1 &
            echo $! > "$RUN_DIR/instance-${port}.pid"
        )
        pid="$(cat "$RUN_DIR/instance-${port}.pid")"
        jq --arg fx "$fx" --argjson pid "$pid" '.[$fx].pid=$pid' "$MAP" > "$MAP.tmp" && mv "$MAP.tmp" "$MAP"
        bash "$SCRIPT_DIR/log_event.sh" "$AID" INSTANCE_SPAWN "fixture=$fx db=$db port=$port pid=$pid"
        PORTS+=("$port")
    done < <(jq -c 'to_entries[]' "$MAP")
    disown -a 2>/dev/null || true

    # Poll readiness for every instance.
    for port in "${PORTS[@]}"; do
        waited=0; ok=0
        while [ "$waited" -lt "$READY_SECS" ]; do
            if port_up "$port"; then ok=1; break; fi
            sleep 3; waited=$((waited + 3))
        done
        if [ "$ok" = "1" ]; then
            echo "  ready :$port"
            bash "$SCRIPT_DIR/log_event.sh" "$AID" INSTANCE_READY "port=$port waited=${waited}s"
        else
            echo "  TIMEOUT :$port (see $RUN_DIR/instance-${port}.log)" >&2
            bash "$SCRIPT_DIR/log_event.sh" "$AID" INSTANCE_TIMEOUT "port=$port"
        fi
    done
    echo "DONE start: instances on $(jq -r '[.[].port]|join(", ")' "$MAP")"
    ;;

  teardown)
    [ -s "$MAP" ] || { echo "nothing to tear down (no $MAP)"; exit 0; }
    # Stop instances first — SIGKILL the whole pnpm→next-server tree AND whatever
    # LISTENs on the port, so no backend lingers to reconnect and block DROP.
    while IFS= read -r entry; do
        port="$(echo "$entry" | jq -r '.value.port')"
        pid="$(echo "$entry" | jq -r '.value.pid // empty')"
        kill_port "$port" || true
        [ -n "$pid" ] && kill_tree "$pid"
        rm -f "$RUN_DIR/instance-${port}.pid"
    done < <(jq -c 'to_entries[]' "$MAP")
    # …then drop the clone DBs (drop_db waits until each DB has 0 connections).
    FAILED=()
    while IFS= read -r db; do
        [ -z "$db" ] && continue
        drop_db "$db" || FAILED+=("$db")
    done < <(jq -r '.[].db' "$MAP")
    bash "$SCRIPT_DIR/log_event.sh" "$AID" INSTANCES_TEARDOWN "count=$(jq 'length' "$MAP") failed=${#FAILED[@]}"
    if [ "${#FAILED[@]}" -gt 0 ]; then
        echo "WARN: could not drop: ${FAILED[*]} — drop manually with: docker exec ${PG_CONTAINER} psql -U postgres -d postgres -c 'DROP DATABASE <db>;'" >&2
    fi
    echo "DONE teardown: stopped instances + dropped clone DBs"
    ;;

  sweep)
    # Defensive orphan cleanup — safety net for an aborted/crashed run where
    # `teardown` never executed. Kills whatever LISTENs on the audit port range
    # and DROPs every `audit_*` clone DB. Safe to run before each provisioning
    # (clean slate) and as manual recovery. Does NOT touch the source DB nor
    # ports outside the audit range. Run when no audit run is in flight.
    killed=0
    for i in $(seq 0 $((SWEEP_PORTS - 1))); do
        if kill_port $((PORT_BASE + i)); then killed=$((killed + 1)); fi
    done
    [ "$killed" -gt 0 ] && sleep 3   # let killed servers release their backends
    dropped=0; failed=0
    while IFS= read -r db; do
        [ -z "$db" ] && continue
        ok=0
        for attempt in 1 2 3 4 5 6; do
            if drop_db "$db"; then ok=1; break; fi
            sleep 2
        done
        if [ "$ok" = "1" ]; then dropped=$((dropped + 1)); else failed=$((failed + 1)); fi
    done < <(psql_admin -tAc "SELECT datname FROM pg_database WHERE datname ~ '^audit_';" 2>/dev/null || true)
    bash "$SCRIPT_DIR/log_event.sh" "$AID" SWEEP "killed_ports=$killed dropped_dbs=$dropped failed=$failed"
    echo "DONE sweep: killed $killed audit port(s) + dropped $dropped audit_* DB(s)$([ "$failed" -gt 0 ] && echo " ($failed still stuck — retry sweep)")"
    ;;

  auth)
    # Extract a storageState from the logged-in @playwright/mcp profile and
    # write an mcp-config that makes each runner launch its OWN isolated browser
    # (`--isolated --storage-state`), authenticated, with no shared-profile lock
    # contention. next-devtools etc. stay (non-strict --mcp-config override).
    AUTHFILE="$RUN_DIR/auth.json"
    if ! node "$REPO_ROOT/packages/app/scripts/audit-extract-auth.mjs" "$AUTHFILE"; then
        echo "ERROR: browser auth extraction failed — runners will share one Chrome (serialised)." >&2
        exit 1
    fi
    # the npx-cached binary is a symlink → match -type l too (avoids re-resolving
    # @playwright/mcp@latest over the network on every runner spawn).
    PW_BIN="$(find "$HOME/.npm/_npx" \( -type f -o -type l \) -path '*/.bin/playwright-mcp' 2>/dev/null | head -1)"
    COMMON_ARGS='["--browser","chromium","--headless","--isolated","--storage-state",$sf,"--output-dir","/tmp/playwright-mcp"]'
    if [ -n "$PW_BIN" ]; then
        jq -n --arg cmd "$PW_BIN" --arg sf "$AUTHFILE" \
          "{mcpServers:{playwright:{type:\"stdio\",command:\$cmd,args:$COMMON_ARGS}}}" > "$RUN_DIR/playwright-mcp.json"
    else
        jq -n --arg sf "$AUTHFILE" \
          "{mcpServers:{playwright:{type:\"stdio\",command:\"npx\",args:([\"-y\",\"@playwright/mcp@latest\"]+$COMMON_ARGS)}}}" > "$RUN_DIR/playwright-mcp.json"
    fi
    bash "$SCRIPT_DIR/log_event.sh" "$AID" AUTH_READY "authfile=$AUTHFILE"
    echo "DONE auth: $AUTHFILE + $RUN_DIR/playwright-mcp.json (isolated browser per runner)"
    ;;

  *)
    echo "Usage: $0 <clone|start|teardown|auth> <RUN_DIR>   |   $0 sweep" >&2
    exit 1
    ;;
esac
