#!/usr/bin/env bash
# refresh_pr_link.sh <pr_number> [<pr_number> ...]
#
# Re-emits a PR's body unchanged to force GitHub to re-parse the
# `Closes #N` / `Resolves #N` / `Fixes #N` keywords.
#
# Why this is needed: GitHub evaluates closing-issue keywords at push and
# create time, NOT when a PR's base branch is later changed. Stacked PRs
# whose base is auto-retargeted to the default branch (e.g. after a parent
# stacked PR is merged) keep their `closingIssuesReferences` empty until
# the body is touched again.
#
# Symptom: the issue's "Development" sidebar still shows the linked branch
# but not the PR itself even though the PR now targets `alpha` and
# contains `Closes #N`.
#
# Run this on each affected PR after merging an upstream parent PR.
#
# Usage:
#   refresh_pr_link.sh 3342 3343
#
# Idempotent — re-running it just re-edits with the same body.

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <pr_number> [<pr_number> ...]" >&2
    exit 2
fi

for PR in "$@"; do
    BODY=$(gh pr view "$PR" --json body --jq '.body')
    if [ -z "$BODY" ]; then
        echo "[refresh_pr_link] PR #$PR has empty body, skipping" >&2
        continue
    fi
    echo "$BODY" | gh pr edit "$PR" --body-file - >/dev/null
    # Verify
    sleep 1
    LINKED=$(gh api graphql -f query="
    {
      repository(owner: \"SocialGouv\", name: \"egapro\") {
        pullRequest(number: $PR) {
          closingIssuesReferences(first: 5) { nodes { number } }
        }
      }
    }" --jq '[.data.repository.pullRequest.closingIssuesReferences.nodes[].number] | join(",")')
    if [ -n "$LINKED" ]; then
        echo "[refresh_pr_link] PR #$PR ↔ issue(s) #$LINKED ✓"
    else
        echo "[refresh_pr_link] PR #$PR — no closing issue reference detected (body may not contain Closes/Resolves/Fixes #N, or PR targets a non-default branch)" >&2
    fi
done
