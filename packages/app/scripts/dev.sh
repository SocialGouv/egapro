#!/usr/bin/env sh
#
# Start `next dev` on the port this worktree was assigned.
#
# Next reads `.env.local` itself, but only *after* the HTTP listener is bound,
# so `PORT` declared there never reached the server: every worktree fell back
# to :3000 and fought over it.
#
# Only PORT is extracted, and by parsing rather than sourcing. Sourcing would
# execute the file: a value containing `$(...)` or backticks runs as a command
# at `pnpm dev`, and `set -a` would export every secret in the file to the dev
# server's children. Next loads the rest of `.env.local` on its own, as usual.
#
# An explicit PORT from the caller's environment wins, matching Next's own
# precedence for shell variables over dotenv files.
#
# Usage: pnpm dev  (from packages/app)

set -e

if [ -z "$PORT" ] && [ -f .env.local ]; then
  # First PORT= assignment, comments ignored, surrounding quotes stripped.
  PORT=$(sed -n 's/^[[:space:]]*PORT=//p' .env.local | head -n 1 | tr -d "\"'")
  if [ -n "$PORT" ]; then
    export PORT
  fi
fi

exec next dev --turbo
