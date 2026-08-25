#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# wait_for_bot_reviews.sh <pr_number>
#
# Wait until the review bots have finished commenting on a PR, then report
# how many threads landed after the last push.
#
# Two timings make a naive "poll once and read" wrong:
#
#   1. Bots (revu-bot in particular) post several minutes AFTER the CI turns
#      green — typically 5 to 10, sometimes more depending on Actions load and
#      diff size. Reading immediately gets you nothing.
#   2. They then post their comments one at a time over seconds to tens of
#      seconds, one per file or section. Exiting on the first comment gets you
#      an incomplete summary and misses the detailed feedback.
#
# So: wait for the first comment (bounded), then wait for the count to stay
# stable for a debounce window before declaring the burst over.
#
# Counts reviews + inline review comments + issue comments, all filtered to
# "created after the last push", which is the only definition that survives a
# fix-and-repush cycle.
#
# Exit codes
#   0  the burst is over — stdout is the comment count (may be 0 on timeout)
#   1  usage error / gh failure
#
# Env (overridable)
#   BOT_WAIT_MAX       seconds to wait for the FIRST comment   (default 900)
#   BOT_DEBOUNCE       seconds of a stable count = burst over  (default 120)
#   BOT_POLL_INTERVAL  seconds between probes                  (default 30)
#   BOT_REPO           owner/repo                              (default SocialGouv/egapro)

set -euo pipefail

PR="${1:-}"
[ -n "$PR" ] || { echo "usage: wait_for_bot_reviews.sh <pr_number>" >&2; exit 1; }

WAIT_MAX="${BOT_WAIT_MAX:-900}"
DEBOUNCE="${BOT_DEBOUNCE:-120}"
INTERVAL="${BOT_POLL_INTERVAL:-30}"
REPO="${BOT_REPO:-SocialGouv/egapro}"

LAST_PUSH=$(gh pr view "$PR" --repo "$REPO" --json commits --jq '.commits[-1].committedDate')
[ -n "$LAST_PUSH" ] || { echo "cannot read last push date for PR #$PR" >&2; exit 1; }

count_after_last_push() {
  local n=0 endpoint
  for endpoint in "pulls/$PR/reviews" "pulls/$PR/comments" "issues/$PR/comments"; do
    n=$(( n + $(gh api "repos/$REPO/$endpoint" --paginate \
        --jq "[.[] | select((.submitted_at // .created_at) > \"$LAST_PUSH\")] | length" \
        | awk '{s+=$1} END {print s+0}') ))
  done
  echo "$n"
}

# Phase 1 — bounded wait for the first comment.
elapsed=0
count=0
while [ "$elapsed" -lt "$WAIT_MAX" ]; do
  count=$(count_after_last_push)
  [ "$count" -gt 0 ] && break
  sleep "$INTERVAL"
  elapsed=$(( elapsed + INTERVAL ))
done

if [ "$count" -eq 0 ]; then
  echo "0"   # timed out: assume no bot is going to comment
  exit 0
fi

# Phase 2 — debounce until the count stops moving.
stable=0
while [ "$stable" -lt "$DEBOUNCE" ]; do
  sleep "$INTERVAL"
  new=$(count_after_last_push)
  if [ "$new" -eq "$count" ]; then
    stable=$(( stable + INTERVAL ))
  else
    count="$new"
    stable=0
  fi
done

echo "$count"
