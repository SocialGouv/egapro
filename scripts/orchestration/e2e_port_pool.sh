#!/usr/bin/env bash
# Source this file from an E2E runner. The lock directory must remain in place
# until the runner has stopped its server and docker stack.

e2e_port_in_use() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -ltnH "sport = :$port" 2>/dev/null | grep -q .
    elif command -v nc >/dev/null 2>&1; then
        nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    else
        return 1
    fi
}

reserve_e2e_index() {
    local requested="${E2E_WORKTREE_INDEX:-}"
    local index port candidate busy
    local -a ports candidates=(5 6 7 8 9)

    if [ -n "$requested" ] && [[ ! "$requested" =~ ^[5-9]$ ]]; then
        echo "ERROR: E2E_WORKTREE_INDEX must be between 5 and 9 (got: $requested)" >&2
        return 1
    fi
    if [ -n "$requested" ]; then
        candidates=("$requested")
    fi

    E2E_SLOT_ROOT="${EGAPRO_E2E_SLOT_ROOT:-${TMPDIR:-/tmp}/egapro-e2e-slots}"
    mkdir -p "$E2E_SLOT_ROOT"

    for index in "${candidates[@]}"; do
        candidate="$E2E_SLOT_ROOT/$index"
        # mkdir is atomic across concurrent runner processes.
        if ! mkdir "$candidate" 2>/dev/null; then
            continue
        fi

        port=$((3001 + index))
        ports=("$port" "$((5500 + 10 * index))" "$((9100 + 10 * index))"
               "$((9101 + 10 * index))" "$((1100 + 10 * index))"
               "$((1200 + 10 * index))" "$((3400 + 10 * index))"
               "$((6400 + 10 * index))")
        busy=0
        for port in "${ports[@]}"; do
            if e2e_port_in_use "$port"; then
                busy=1
                break
            fi
        done
        if [ "$busy" -eq 1 ]; then
            rmdir "$candidate"
            continue
        fi

        E2E_SLOT_DIR="$candidate"
        E2E_INDEX="$index"
        E2E_PORT=$((3001 + index))
        return 0
    done

    echo "ERROR: no free E2E worktree index in 5..9 (ports 3006..3010)" >&2
    return 1
}

release_e2e_index() {
    if [ -n "${E2E_SLOT_DIR:-}" ]; then
        rmdir "$E2E_SLOT_DIR"
        E2E_SLOT_DIR=""
    fi
}
