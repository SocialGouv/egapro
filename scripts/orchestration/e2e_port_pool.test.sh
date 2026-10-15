#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/e2e_port_pool.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
export EGAPRO_E2E_SLOT_ROOT="$TEST_ROOT/slots"

# Exercise two independent runners competing for the same pool.
for runner in first second; do
    (
        source "$SCRIPT_DIR/e2e_port_pool.sh"
        e2e_port_in_use() { return 1; }
        reserve_e2e_index
        printf '%s\n' "$E2E_INDEX" > "$TEST_ROOT/$runner"
        while [ ! -f "$TEST_ROOT/release" ]; do sleep 0.05; done
        release_e2e_index
    ) &
done
wait_until_reserved() {
    local attempt
    for attempt in {1..100}; do
        [ -f "$TEST_ROOT/first" ] && [ -f "$TEST_ROOT/second" ] && return 0
        sleep 0.05
    done
    return 1
}
wait_until_reserved
first="$(cat "$TEST_ROOT/first")"
second="$(cat "$TEST_ROOT/second")"
[ "$first" != "$second" ]
[ "$first" -ge 5 ] && [ "$first" -le 9 ]
[ "$second" -ge 5 ] && [ "$second" -le 9 ]
touch "$TEST_ROOT/release"
wait

# A released slot can be acquired again, and a full pool fails without stealing.
e2e_port_in_use() { return 1; }
reserve_e2e_index
[ "$E2E_INDEX" = 5 ]
release_e2e_index
for index in 5 6 7 8 9; do mkdir "$EGAPRO_E2E_SLOT_ROOT/$index"; done
if reserve_e2e_index 2>/dev/null; then
    echo "full pool was accepted" >&2
    exit 1
fi
for index in 5 6 7 8 9; do rmdir "$EGAPRO_E2E_SLOT_ROOT/$index"; done

# An occupied port is skipped, even when its lock is free.
e2e_port_in_use() { [ "$1" = 3006 ]; }
reserve_e2e_index
[ "$E2E_INDEX" = 6 ]
release_e2e_index

# An override outside the registered Charon range is rejected.
E2E_WORKTREE_INDEX=10
if reserve_e2e_index 2>/dev/null; then
    echo "out-of-range override was accepted" >&2
    exit 1
fi
unset E2E_WORKTREE_INDEX

echo "e2e_port_pool: PASS"
