#!/usr/bin/env bash
#
# Tears down a worktree's docker-compose stack and deletes its .env.local.
#
# Usage:  scripts/teardown-worktree.sh
#
# Must be run from the root of the worktree whose stack should be removed.
# Idempotent: no-op if there's no .env.local.

set -euo pipefail

ENV_FILE="packages/app/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "[teardown-worktree] No $ENV_FILE found; nothing to tear down."
  exit 0
fi

if [ ! -f docker-compose.yml ]; then
  echo "[teardown-worktree] docker-compose.yml not found. Run from the worktree root." >&2
  exit 1
fi

echo "[teardown-worktree] Stopping containers + removing volumes..."
docker compose --env-file "$ENV_FILE" down -v --remove-orphans

rm -f "$ENV_FILE"
echo "[teardown-worktree] Done. $ENV_FILE deleted."
