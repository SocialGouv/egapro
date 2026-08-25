#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# check_review_replies.sh <pr_number>
#
# Report which inline review threads posted after the last push have NOT yet
# received a reply from the PR author.
#
# Why this exists: concluding "not relevant" and moving on without saying so
# is invisible. The bot raises the same point on the next PR, and the human
# reviewing this one has no idea what the agent made of the suggestion. An
# explicit reply — even a one-line "not applicable because X" — is what makes
# the decision traceable.
#
# Prints one line per unreplied thread: <comment_id> <path>:<line> <author>
# so the caller can reply in-thread with:
#   gh api -X POST repos/<repo>/pulls/<pr>/comments -f in_reply_to=<comment_id> -f body=…
#
# Exit codes
#   0  every thread has a reply (no output)
#   2  at least one thread is unreplied (listed on stdout)
#   1  usage error / gh failure
#
# Env (overridable)
#   BOT_REPO  owner/repo  (default SocialGouv/egapro)

set -euo pipefail

PR="${1:-}"
[ -n "$PR" ] || { echo "usage: check_review_replies.sh <pr_number>" >&2; exit 1; }
REPO="${BOT_REPO:-SocialGouv/egapro}"

AUTHOR=$(gh api user --jq '.login')
LAST_PUSH=$(gh pr view "$PR" --repo "$REPO" --json commits --jq '.commits[-1].committedDate')
[ -n "$LAST_PUSH" ] || { echo "cannot read last push date for PR #$PR" >&2; exit 1; }

# A thread is "replied" when the author posted a comment whose in_reply_to_id
# points into it. Root comments carry no in_reply_to_id; replies do.
UNREPLIED=$(gh api "repos/$REPO/pulls/$PR/comments" --paginate --jq "
  [ .[] | select(.created_at > \"$LAST_PUSH\") ] as \$recent
  | ( [ \$recent[] | select(.user.login == \"$AUTHOR\") | .in_reply_to_id | select(. != null) ] ) as \$answered
  | \$recent
  | map(. as \$c
        | select(\$c.user.login != \"$AUTHOR\")
        | select((\$answered | index(\$c.in_reply_to_id // \$c.id)) == null))
  | map(\"\(.id) \(.path):\(.line // .original_line // 0) \(.user.login)\")
  | .[]
")

if [ -n "$UNREPLIED" ]; then
  echo "$UNREPLIED"
  exit 2
fi
exit 0
