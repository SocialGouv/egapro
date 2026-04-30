#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# cache_gh.sh <key> <ttl_sec> -- <command>
#
# TTL-based cache wrapper for any command (typically `gh`).
# Returns cached output if cache file is younger than TTL, otherwise runs the
# command, stores the output, and returns it.
#
# Used to dampen GitHub API rate limits during /epic orchestration: the same
# `gh issue view <epic> ...` is called by both dispatch_plan.sh and the loop
# driver, sometimes several times per tick. With TTL=300s on the bulk
# sub-issues query, the API cost drops by ~20×.
#
# Usage:
#   cache_gh.sh epic_42_full 300 -- gh api graphql -f query='...' --jq '...'
#   cache_gh.sh ticket_123_labels 30 -- gh issue view 123 --json labels --jq '[.labels[].name]'
#
# The cache key is opaque — choose stable, human-readable names. Cache lives in
# /tmp/egapro_gh_cache/ and is wiped on reboot.
#
# Cache invalidation: callers (typically process_tick_result.sh) `rm` specific
# files when they know the cached value is stale (after a status change, label
# add/remove, etc.).

set -euo pipefail

if [ $# -lt 4 ]; then
    echo "Usage: $0 <key> <ttl_sec> -- <command>..." >&2
    exit 2
fi

KEY="$1"
TTL="$2"
SEP="$3"
shift 3

if [ "$SEP" != "--" ]; then
    echo "ERROR: missing -- separator (got '$SEP')" >&2
    exit 2
fi

CACHE_DIR="${EGAPRO_GH_CACHE_DIR:-/tmp/egapro_gh_cache}"
mkdir -p "$CACHE_DIR"

CACHE_FILE="${CACHE_DIR}/${KEY}.json"

# Cache hit?
if [ -f "$CACHE_FILE" ]; then
    MTIME=$(stat -c '%Y' "$CACHE_FILE" 2>/dev/null || echo 0)
    NOW=$(date +%s)
    AGE=$((NOW - MTIME))
    if [ "$AGE" -lt "$TTL" ]; then
        cat "$CACHE_FILE"
        exit 0
    fi
fi

# Cache miss: run the command, store the output (only if exit 0)
TMP_FILE=$(mktemp "${CACHE_FILE}.XXXXXX")
if "$@" > "$TMP_FILE" 2>/dev/null; then
    mv "$TMP_FILE" "$CACHE_FILE"
    cat "$CACHE_FILE"
else
    EXIT_CODE=$?
    rm -f "$TMP_FILE"
    # Don't poison the cache on failure; surface the error to caller
    exit "$EXIT_CODE"
fi
