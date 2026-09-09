#!/usr/bin/env bash

set -uo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MIGRATE="$SCRIPT_DIR/../migrate.sh"

failures=0

expect_success() {
  local description=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'ok - %s\n' "$description"
  else
    printf 'not ok - %s\n' "$description"
    failures=$((failures + 1))
  fi
}

expect_failure() {
  local description=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'not ok - %s\n' "$description"
    failures=$((failures + 1))
  else
    printf 'ok - %s\n' "$description"
  fi
}

expect_success "help is available" "$MIGRATE" help
expect_failure "a command is required" "$MIGRATE"
expect_failure "unknown commands are rejected" "$MIGRATE" unknown
expect_failure "export requires all mandatory options" "$MIGRATE" export --format custom
expect_failure "verify requires a snapshot" "$MIGRATE" verify
expect_failure "target commands require a service" "$MIGRATE" dry-run --snapshot missing

exit "$failures"
