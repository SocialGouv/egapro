#!/usr/bin/env bash
# link_pr_to_ticket.sh <ticket_number> <pr_number>
#
# Posts a cross-reference comment on the ticket pointing to the PR. Idempotent:
# skips if a comment already mentions the PR.
#
# Why: GitHub's automatic linking via the "Closes #N" body keyword only
# populates `closingIssuesReferences` when the PR targets the default branch
# (alpha) or a descendant. For our orchestrated runs the PR may target
# `chore/ai-pipeline` (transition phase) or a parent `ticket/*` branch
# (stacked PR pattern) — in both cases the link is not established and the
# UI shows no relation between the issue and the PR.
#
# A simple GitHub comment creates a permanent cross-reference: it appears in
# both the issue's timeline and the PR's "References" section. Not as
# polished as the native link, but reliable across all base-branch shapes.
#
# Usage:
#   link_pr_to_ticket.sh 3312 3326
#
# Exits 0 on success or no-op (idempotent skip), non-zero on hard failure.

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ticket_number> <pr_number>" >&2
    exit 2
fi

TICKET="$1"
PR="$2"

# Idempotence: skip if a comment already mentions this exact PR
EXISTING=$(gh issue view "$TICKET" --json comments \
    --jq "[.comments[] | select(.body | test(\"PR #${PR}([^0-9]|$)\"))] | length" 2>/dev/null || echo "0")
if [ "$EXISTING" -gt 0 ]; then
    echo "[link_pr_to_ticket] cross-ref already present for PR #${PR} on issue #${TICKET} ($EXISTING match) — skipping" >&2
    exit 0
fi

gh issue comment "$TICKET" --body "Linked PR: #${PR}

(Cross-reference posted by orchestrator. GitHub's native auto-link via \`Closes #N\` only fires when the PR targets the default branch; this comment makes the relation visible in the issue timeline regardless of the PR's base.)" >/dev/null

echo "[link_pr_to_ticket] cross-ref posted: issue #${TICKET} ↔ PR #${PR}" >&2
