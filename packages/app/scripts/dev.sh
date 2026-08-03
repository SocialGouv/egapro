#!/usr/bin/env sh
#
# Start `next dev` with the worktree's generated environment loaded.
#
# Next reads `.env.local` itself, but only *after* the HTTP listener is bound,
# so `PORT` declared there never reached the server: every worktree fell back
# to :3000 and fought over it. Sourcing the file first — the same `set -a`
# idiom scripts/setup-worktree.sh already uses for drizzle-kit — makes a
# worktree honour the port it was assigned, which is also what NEXTAUTH_URL
# is generated against.
#
# Usage: pnpm dev  (from packages/app)

set -e

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

exec next dev --turbo
