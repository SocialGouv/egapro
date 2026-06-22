#!/usr/bin/env bash
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
  for B in /opt/homebrew/bin/bash /usr/local/bin/bash; do
    [ -x "$B" ] && exec "$B" "$0" "$@"
  done
  echo "Bash 4+ required. Install via 'brew install bash'." >&2
  exit 1
fi
# force_pr_issue_link.sh <pr_number>
#
# Force the formal PR ↔ issue link to register.
#
# GitHub's auto-linker (the one that populates closingIssuesReferences and
# creates the ConnectedEvent so the PR shows up in the issue's Development
# sidebar) only fires when the PR base is the repository's **default branch**.
# Our sub-task PRs target `epic/<N>`, so the `Closes #N` keyword stays in the
# body but no formal link is created at `gh pr create` time.
#
# Workaround: flip the PR base to the default branch, wait, flip it back. The
# linker fires on the default-branch flip, and the link persists across the
# second flip. There is no public GraphQL/REST mutation for the link itself
# (the GitHub web UI's "Link an issue" button uses a private mutation).
#
# The default branch is read dynamically — historically the repo used
# `master` and now uses `alpha`, so hardcoding either one would silently
# break the workaround.
#
# Idempotent: if the link is already in place (closingIssuesReferences not
# empty) this script exits 0 without flipping.
#
# Trade-off: each call triggers ~2 extra CI runs because workflows on
# `pull_request: types: [edited]` (or [synchronize] on some workflows) fire
# on each base change. Call only once per PR, right after `gh pr create`.
#
# Exit:
#   0  link in place (created or already there)
#   1  flip failed to register the link, or `Closes #N` missing from body
#   2  bad usage / cannot read PR

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <pr_number>" >&2
    exit 2
fi

PR="$1"

# Resolve the repo's default branch — auto-linker only fires there.
DEFAULT_BRANCH=$(gh repo view SocialGouv/egapro --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo "")
if [ -z "$DEFAULT_BRANCH" ]; then
    echo "[force_pr_issue_link] ERROR: cannot resolve default branch of repo" >&2
    exit 2
fi

ORIG_BASE=$(gh pr view "$PR" --json baseRefName --jq '.baseRefName' 2>/dev/null || echo "")
if [ -z "$ORIG_BASE" ]; then
    echo "[force_pr_issue_link] ERROR: cannot read base of PR #$PR" >&2
    exit 2
fi

# If already on default branch, the auto-linker fired at creation time
if [ "$ORIG_BASE" = "$DEFAULT_BRANCH" ]; then
    echo "[force_pr_issue_link] PR #$PR base is already $DEFAULT_BRANCH (default) — no flip needed" >&2
    exit 0
fi

# Idempotent check: is the link already in place?
LINKED=$(gh api graphql -f query='
    query($num: Int!) {
        repository(owner: "SocialGouv", name: "egapro") {
            pullRequest(number: $num) {
                closingIssuesReferences(first: 1) { nodes { number } }
            }
        }
    }' -F num="$PR" \
    --jq '.data.repository.pullRequest.closingIssuesReferences.nodes | length' 2>/dev/null || echo "0")

if [ "${LINKED:-0}" -gt 0 ]; then
    echo "[force_pr_issue_link] PR #$PR already has a closingIssuesReferences link, skipping flip" >&2
    exit 0
fi

# Verify the body contains a closing keyword — flip won't help otherwise
BODY=$(gh pr view "$PR" --json body --jq '.body' 2>/dev/null || echo "")
if ! echo "$BODY" | grep -qiE '(close[sd]?|fix(es|ed)?|resolve[sd]?)[[:space:]]+#[0-9]+'; then
    echo "[force_pr_issue_link] ERROR: PR #$PR body does not contain a closing keyword (Closes/Fixes/Resolves #N) — flip won't register a link" >&2
    echo "  Add 'Closes #<issue>' on the first line of the body and re-run." >&2
    exit 1
fi

echo "[force_pr_issue_link] flipping PR #$PR base $ORIG_BASE → $DEFAULT_BRANCH to fire the auto-linker" >&2
gh pr edit "$PR" --base "$DEFAULT_BRANCH" >/dev/null
sleep 3
gh pr edit "$PR" --base "$ORIG_BASE" >/dev/null
sleep 2

# Verify
LINKED=$(gh api graphql -f query='
    query($num: Int!) {
        repository(owner: "SocialGouv", name: "egapro") {
            pullRequest(number: $num) {
                closingIssuesReferences(first: 1) { nodes { number } }
            }
        }
    }' -F num="$PR" \
    --jq '.data.repository.pullRequest.closingIssuesReferences.nodes | length' 2>/dev/null || echo "0")

if [ "${LINKED:-0}" -eq 0 ]; then
    echo "[force_pr_issue_link] ERROR: flip didn't register the link." >&2
    echo "  Common causes : 'Closes #N' not on first line of body, or GitHub didn't see the keyword." >&2
    echo "  Re-check the body, then run: bash $0 $PR" >&2
    exit 1
fi

echo "[force_pr_issue_link] PR #$PR linked successfully (closingIssuesReferences populated, base back on $ORIG_BASE)" >&2
exit 0
