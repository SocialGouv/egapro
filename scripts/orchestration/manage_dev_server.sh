#!/usr/bin/env bash
# manage_dev_server.sh <ensure|stop> <RUN_DIR>
#
# Lifecycle of the local dev stack for /audit-functional, so the skill is
# turnkey (the user doesn't pre-start anything).
#
#   ensure  — bring up docker DB + dev server on :3000 in dev mode, OR reuse an
#             already-running server. Writes a PID file ONLY when this script
#             started the server, so `stop` never kills a server the user owns.
#   stop    — kill the dev server ONLY if this script started it (PID file
#             present). A pre-existing / reused server is left untouched.
#
# Idempotent. Reads/writes:
#   <RUN_DIR>/dev-server.pid   (present ⇔ we started it ⇔ stop will kill it)
#   <RUN_DIR>/dev-server.log   (dev server output, for diagnostics)
#
# Env (defaults shown):
#   AUDIT_DEV_PORT        3000   port to check / serve on
#   AUDIT_DEV_READY_SECS  150    max seconds to wait for the server to answer
#
# Exit codes:
#   0  ensure: server is up (reused or started) — last stdout line is
#      "reused" | "started <pid>"
#      stop: done — "stopped" | "nothing-to-stop"
#   1  ensure: server failed to become ready within AUDIT_DEV_READY_SECS

set -euo pipefail

MODE="${1:-}"
RUN_DIR="${2:-}"
DEV_PORT="${AUDIT_DEV_PORT:-3000}"
READY_SECS="${AUDIT_DEV_READY_SECS:-150}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -z "$MODE" ] || [ -z "$RUN_DIR" ]; then
    echo "Usage: $0 <ensure|stop> <RUN_DIR>" >&2
    exit 2
fi
mkdir -p "$RUN_DIR"
PIDFILE="$RUN_DIR/dev-server.pid"
LOGFILE="$RUN_DIR/dev-server.log"

server_up() { curl -sf -o /dev/null "http://localhost:${DEV_PORT}" 2>/dev/null; }

case "$MODE" in
  ensure)
    # 1. Reuse a server the user (or a previous run) already has on :3000.
    if server_up; then
        echo "WARN: réutilisation du serveur déjà actif sur :${DEV_PORT}." >&2
        echo "      Assure-toi qu'il tourne avec NEXT_PUBLIC_EGAPRO_ENV=dev (bouton [DEV] Remplir)." >&2
        echo "reused"
        exit 0
    fi

    # 2. Bring up the docker DB stack (best-effort — seeding needs :5438).
    (cd "$REPO_ROOT" && docker compose up -d >/dev/null 2>&1) || \
        echo "WARN: 'docker compose up -d' a échoué — vérifie Docker (DB :5438)." >&2

    # 3. Start the dev server in dev mode, detached, surviving this script.
    echo "Démarrage du dev server (NEXT_PUBLIC_EGAPRO_ENV=dev, :${DEV_PORT})…" >&2
    (
        cd "$REPO_ROOT"
        nohup env NEXT_PUBLIC_EGAPRO_ENV=dev pnpm dev:app > "$LOGFILE" 2>&1 &
        echo $! > "$PIDFILE"
    )
    disown 2>/dev/null || true

    # 4. Poll until ready (the first compile can take a while).
    WAITED=0
    while [ "$WAITED" -lt "$READY_SECS" ]; do
        if server_up; then
            echo "started $(cat "$PIDFILE" 2>/dev/null || echo '?')"
            exit 0
        fi
        sleep 3
        WAITED=$((WAITED + 3))
    done

    echo "ERROR: dev server pas prêt après ${READY_SECS}s — voir $LOGFILE" >&2
    # We started it but it never answered: tear our own attempt down so we
    # don't leak a half-started process, then fail.
    "$0" stop "$RUN_DIR" >/dev/null 2>&1 || true
    exit 1
    ;;

  stop)
    if [ "${AUDIT_KEEP_DEV:-0}" = "1" ]; then
        echo "AUDIT_KEEP_DEV=1 — le dev server est laissé tel quel." >&2
        echo "nothing-to-stop"
        exit 0
    fi
    if [ -f "$PIDFILE" ]; then
        PID="$(cat "$PIDFILE" 2>/dev/null || true)"
        if [ -n "$PID" ]; then
            # Kill children first (pnpm → next dev → workers), then the leader.
            pkill -TERM -P "$PID" 2>/dev/null || true
            kill -TERM "$PID" 2>/dev/null || true
        fi
        rm -f "$PIDFILE"
        echo "stopped"
        exit 0
    fi
    # No PID file ⇒ we never started it (reused / user-owned) ⇒ leave it alone.
    echo "nothing-to-stop"
    exit 0
    ;;

  *)
    echo "Usage: $0 <ensure|stop> <RUN_DIR>" >&2
    exit 2
    ;;
esac
