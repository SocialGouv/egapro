#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# open_worktree.sh <pr_number>
#
# Recreate the egapro worktree for a given PR — used after /implement (mode
# epic) has auto-cleaned the worktree (when the ticket transitioned to In
# review or Done) but the user wants to test the PR locally.
#
# Workflow:
# 1. Resolve PR head branch + linked issue from GitHub
# 2. Resolve the issue's parent epic
# 3. Path = ../egapro-epic<EPIC>-t<TICKET>  (same convention as /implement mode epic)
# 4. Pick first free worktree index in [0, EPIC_MAX_PARALLEL[
# 5. git worktree add (or reuse if already present)
# 6. setup-worktree.sh <index>  (pnpm install + docker stack + migrations)
# 7. Print path + dev URLs
#
# Idempotent: if the worktree already exists at the expected path, reuse it.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <pr_number>" >&2
    exit 2
fi

PR="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAX_PARALLEL="${EPIC_MAX_PARALLEL:-5}"

# 1. Resolve PR head branch + closing issue
PR_INFO=$(gh api graphql -f query='
    query($owner:String!, $repo:String!, $n:Int!) {
      repository(owner:$owner, name:$repo) {
        pullRequest(number:$n) {
          headRefName
          state
          closingIssuesReferences(first: 1) { nodes { number } }
        }
      }
    }' -f owner=SocialGouv -f repo=egapro -F n="$PR")

HEAD_BRANCH=$(echo "$PR_INFO" | jq -r '.data.repository.pullRequest.headRefName')
PR_STATE=$(echo "$PR_INFO" | jq -r '.data.repository.pullRequest.state')
TICKET=$(echo "$PR_INFO" | jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes[0].number // empty')

if [ -z "$HEAD_BRANCH" ] || [ "$HEAD_BRANCH" = "null" ]; then
    echo "ERROR: PR #$PR not found" >&2
    exit 1
fi

# Fallback: parse the body for "Closes #N" if closingIssuesReferences is empty
# (e.g. PR targets a non-default branch and the link wasn't established).
if [ -z "$TICKET" ]; then
    BODY=$(gh pr view "$PR" --json body --jq '.body')
    TICKET=$(echo "$BODY" | grep -ioE '(closes|resolves|fixes) #[0-9]+' | head -1 | grep -oE '[0-9]+' | head -1 || true)
fi

if [ -z "$TICKET" ]; then
    echo "ERROR: cannot infer ticket from PR #$PR (no Closes/Resolves/Fixes keyword in body and no closing issue link)" >&2
    exit 1
fi

# 2. Resolve epic parent of the issue
EPIC=$(gh api graphql -f query='
    query($owner:String!, $repo:String!, $n:Int!) {
      repository(owner:$owner, name:$repo) {
        issue(number:$n) {
          parent { number }
        }
      }
    }' -f owner=SocialGouv -f repo=egapro -F n="$TICKET" \
    --jq '.data.repository.issue.parent.number // empty')

if [ -z "$EPIC" ]; then
    echo "ERROR: ticket #$TICKET has no parent epic" >&2
    exit 1
fi

# 3. Compute path
# Mac compat: GNU `realpath -m` (canonicalize a path that may not exist yet)
# is not available on macOS without coreutils. Resolve REPO_ROOT/.. (which
# always exists because REPO_ROOT does) then append the worktree dir name.
WT_PATH="$(cd "${REPO_ROOT}/.." && pwd)/egapro-epic${EPIC}-t${TICKET}"

# 4. Pick free worktree index
declare -A INDEX_BUSY
for i in $(seq 0 $((MAX_PARALLEL - 1))); do
    INDEX_BUSY[$i]=0
done

while IFS= read -r path; do
    [ -n "$path" ] || continue
    case "$(basename "$path")" in egapro-epic*-t*) ;; *) continue ;; esac
    ENV_FILE="$path/packages/app/.env.local"
    [ -f "$ENV_FILE" ] || continue
    PORT_LINE=$(grep '^PORT=' "$ENV_FILE" | head -1 | cut -d= -f2 || true)
    [[ "$PORT_LINE" =~ ^[0-9]+$ ]] || continue
    IDX=$((PORT_LINE - 3001))
    if [ "$IDX" -ge 0 ] && [ "$IDX" -lt "$MAX_PARALLEL" ]; then
        INDEX_BUSY[$IDX]=1
    fi
done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')

INDEX=""
for i in $(seq 0 $((MAX_PARALLEL - 1))); do
    if [ "${INDEX_BUSY[$i]}" = "0" ]; then
        INDEX=$i
        break
    fi
done

if [ -z "$INDEX" ]; then
    echo "ERROR: no free worktree slot ([0, $MAX_PARALLEL[ all busy). Free one with 'git worktree remove' or raise EPIC_MAX_PARALLEL." >&2
    exit 1
fi

# 5. Create or reuse the worktree
echo "[open_worktree] PR #$PR — branch $HEAD_BRANCH — ticket #$TICKET (epic #$EPIC) — index $INDEX" >&2

if [ ! -d "$WT_PATH" ]; then
    (cd "$REPO_ROOT" && git fetch origin "$HEAD_BRANCH") >&2
    (cd "$REPO_ROOT" && git worktree add "$WT_PATH" "$HEAD_BRANCH") >&2 || \
        (cd "$REPO_ROOT" && git worktree add --detach "$WT_PATH" "origin/$HEAD_BRANCH" >&2 && cd "$WT_PATH" && git checkout "$HEAD_BRANCH" >&2)
else
    echo "[open_worktree] reusing existing worktree at $WT_PATH" >&2
    (cd "$WT_PATH" && git fetch origin "$HEAD_BRANCH" && git checkout "$HEAD_BRANCH" && git pull --ff-only origin "$HEAD_BRANCH") >&2 || true
fi

# 6. setup-worktree.sh if not already provisioned
if [ ! -f "$WT_PATH/packages/app/.env.local" ]; then
    (cd "$WT_PATH" && bash "$REPO_ROOT/scripts/setup-worktree.sh" "$INDEX") >&2
else
    echo "[open_worktree] .env.local already present — skipping setup" >&2
fi

# 7. Report
APP_PORT=$((3001 + INDEX))
cat <<EOF

✓ Worktree ready

  Path        : $WT_PATH
  Branch      : $HEAD_BRANCH
  PR          : #$PR (state: $PR_STATE)
  Ticket      : #$TICKET (epic #$EPIC)
  Slot index  : $INDEX
  Dev server  : http://localhost:$APP_PORT  (run via: cd $WT_PATH && pnpm dev:app)

  Maildev    : http://localhost:$((1200 + 10 * INDEX))
  Minio      : http://localhost:$((9100 + 10 * INDEX))  (console: $((9101 + 10 * INDEX)))
  Postgres   : localhost:$((5500 + 10 * INDEX))
EOF
