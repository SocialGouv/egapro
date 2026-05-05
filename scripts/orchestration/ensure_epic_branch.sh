#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# ensure_epic_branch.sh <epic_N>
#
# Idempotent: ensures the integration branch `epic/<N>` exists on origin.
# Created from origin/alpha if missing. Used by epic_loop.sh at startup so
# every ticket PR for the epic targets a single integration branch — no
# more stacked-PR pattern.
#
# Stdout: the branch name (e.g. epic/3349)
# Exit:
#   0  branch ready (created or already existed)
#   1  hard error (cannot resolve origin/alpha, ref creation rejected, etc.)

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <epic_N>" >&2
    exit 2
fi

EPIC="$1"
BRANCH="epic/${EPIC}"

if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    echo "[ensure_epic_branch] $BRANCH already on origin, reusing" >&2
    echo "$BRANCH"
    exit 0
fi

ALPHA_OID=$(git ls-remote --heads origin alpha 2>/dev/null | awk '{print $1}' | head -1 || true)
if [ -z "$ALPHA_OID" ]; then
    echo "[ensure_epic_branch] ERROR: cannot resolve origin/alpha" >&2
    exit 1
fi

RESULT=$(gh api repos/SocialGouv/egapro/git/refs \
    -f "ref=refs/heads/${BRANCH}" \
    -f "sha=${ALPHA_OID}" 2>&1) || {
    if echo "$RESULT" | grep -q "Reference already exists"; then
        echo "[ensure_epic_branch] $BRANCH appeared between check and create (race), reusing" >&2
        echo "$BRANCH"
        exit 0
    fi
    echo "[ensure_epic_branch] ERROR creating $BRANCH on origin:" >&2
    echo "$RESULT" >&2
    exit 1
}

echo "[ensure_epic_branch] created $BRANCH from origin/alpha @ ${ALPHA_OID:0:8}" >&2
echo "$BRANCH"
