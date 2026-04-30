#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# create_linked_branch.sh <ticket_number> <base_branch>
#
# Creates a branch officially "linked" to the GitHub issue (i.e. it shows up
# in the issue's sidebar "Development" section). The PR opened later from
# this branch is then auto-linked to the issue too — no need for a manual
# cross-reference comment, no dependency on the "Closes #N" body keyword
# (which only fires when the PR targets the default branch).
#
# Idempotent: if a branch matching `ticket/<N>-*` already exists on origin,
# it is reused and its name is returned. The linkedBranch GraphQL state is
# *not* re-asserted in that case (re-running createLinkedBranch on an existing
# linked ref would fail, and a stale branch from a prior cancelled run is
# already linked).
#
# Stdout: the branch name (e.g. ticket/3313-annotate-indicators-af).
# Stderr: progress + any error.
#
# Usage:
#   create_linked_branch.sh 3313 origin/chore/ai-pipeline
#   create_linked_branch.sh 3313 origin/ticket/3312-post-processing-wiki

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ticket_number> <base_branch>" >&2
    exit 2
fi

TICKET="$1"
BASE="$2"

# 1. Reuse existing branch if any (idempotent across re-runs).
# `head -1` SIGPIPEs upstream `sed`/`awk`, which under `set -o pipefail`
# poisons `set -e`. `|| true` is the cheap fix.
EXISTING=$(git ls-remote --heads origin "ticket/${TICKET}-*" 2>/dev/null \
    | awk '{print $2}' | sed 's|refs/heads/||' | head -1 || true)
if [ -n "$EXISTING" ]; then
    echo "[create_linked_branch] reusing existing branch: $EXISTING" >&2
    echo "$EXISTING"
    exit 0
fi

# 2. Compute the slug from the issue title
TITLE=$(gh issue view "$TICKET" --json title --jq '.title')
# Strip leading prefix like "T0 — " / "T1 - " / "[bug] " (best-effort)
TITLE_TRIMMED=$(echo "$TITLE" | sed -E 's/^(T[0-9]+ *[—–-] *|\[[^]]+\] *)//')
# Slugify: lowercase, ASCII-fold removes accents, non-alphanumeric → '-',
# collapse runs of '-', trim leading/trailing '-', cap at 40 chars.
# Truncation uses bash parameter expansion (not `head -c`) so a SIGPIPE
# from a downstream pipe stage doesn't tank the pipeline under
# `set -o pipefail` for long titles.
# `|| true` swallows failures from any pipe stage (esp. macOS iconv,
# which exits non-zero on some characters even with TRANSLIT) so a single
# slugification quirk doesn't tank `set -o pipefail` and crash silently.
SLUG=$(echo "$TITLE_TRIMMED" \
    | { iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null || cat; } \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
    || true)
SLUG="${SLUG:0:40}"
SLUG="${SLUG%-}"

if [ -z "$SLUG" ]; then
    SLUG="ticket"
fi

NAME="ticket/${TICKET}-${SLUG}"

# 3. Resolve the base branch SHA. Accept either a remote-tracking ref
# (origin/<x>) or a bare branch name (<x>).
BASE_REF="${BASE#origin/}"
OID=$(git ls-remote --heads origin "$BASE_REF" 2>/dev/null | awk '{print $1}' | head -1)
if [ -z "$OID" ]; then
    echo "[create_linked_branch] ERROR: cannot resolve SHA for base $BASE" >&2
    exit 1
fi

# 4. Resolve the issue's GraphQL node ID
ISSUE_ID=$(gh issue view "$TICKET" --json id --jq '.id')
if [ -z "$ISSUE_ID" ]; then
    echo "[create_linked_branch] ERROR: cannot resolve issue node id for #$TICKET" >&2
    exit 1
fi

# 5. Create the linked branch
echo "[create_linked_branch] creating $NAME from $BASE ($OID) linked to issue #$TICKET" >&2
RESULT=$(gh api graphql -f query='
mutation($issueId: ID!, $oid: GitObjectID!, $name: String!) {
    createLinkedBranch(input: { issueId: $issueId, oid: $oid, name: $name }) {
        linkedBranch { ref { name } }
    }
}' -f issueId="$ISSUE_ID" -f oid="$OID" -f name="$NAME" 2>&1)

CREATED_NAME=$(echo "$RESULT" | jq -r '.data.createLinkedBranch.linkedBranch.ref.name // ""' 2>/dev/null || echo "")
if [ -z "$CREATED_NAME" ]; then
    echo "[create_linked_branch] ERROR: createLinkedBranch failed:" >&2
    echo "$RESULT" >&2
    exit 1
fi

echo "[create_linked_branch] linked branch created: $CREATED_NAME" >&2
echo "$CREATED_NAME"
