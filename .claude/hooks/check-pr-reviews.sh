#!/usr/bin/env bash
# Hook: UserPromptSubmit
# Checks if the current branch has an open PR with pending reviews.
# Runs only once per conversation (creates a temp marker file).

set -euo pipefail

# Must be in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ -z "$BRANCH" || "$BRANCH" == "alpha" ]]; then
  exit 0
fi

# Only run once per session (PPID stays the same within a Claude Code session)
BRANCH_HASH=$(echo "$BRANCH" | md5sum | cut -c1-8)
SESSION_MARKER="/tmp/.claude-pr-check-${BRANCH_HASH}-$PPID"
if [[ -f "$SESSION_MARKER" ]]; then
  exit 0
fi
touch "$SESSION_MARKER"

# Check if there's an open PR for this branch
PR_JSON=$(gh pr view --json number,url,reviewDecision,reviews 2>/dev/null || echo "")
if [[ -z "$PR_JSON" ]]; then
  exit 0
fi

PR_NUMBER=$(echo "$PR_JSON" | jq -r '.number // empty')
if [[ -z "$PR_NUMBER" ]]; then
  exit 0
fi

PR_URL=$(echo "$PR_JSON" | jq -r '.url // empty')
REVIEW_DECISION=$(echo "$PR_JSON" | jq -r '.reviewDecision // "NONE"')

# Count reviews that need attention (CHANGES_REQUESTED or COMMENTED from bots)
# Excludes APPROVED and DISMISSED reviews
PENDING_REVIEWS=$(echo "$PR_JSON" | jq '[.reviews[] | select(.state == "CHANGES_REQUESTED" or .state == "COMMENTED")] | length' 2>/dev/null || echo "0")

if [[ "$REVIEW_DECISION" == "CHANGES_REQUESTED" ]] || [[ "$PENDING_REVIEWS" -gt 0 ]]; then
  echo "WARN: PR #$PR_NUMBER ($PR_URL) has pending reviews."
  echo "  Review decision: $REVIEW_DECISION"
  echo "  Reviews needing attention: $PENDING_REVIEWS"
  echo "  Consider running /review to address them."
fi
