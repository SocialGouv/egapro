---
name: review
description: "Address PR review comments: fetch, fix, re-validate, reply. Usage: /review"
---

# /review

Fetches review comments on the current PR, fixes them, re-validates, and pushes. Works with both human reviewers and review bots.

## Arguments

`$ARGUMENTS` — not typically needed. PR is inferred from the current branch.

---

# Step 0 — Detect state

Fetch the current PR and its reviews. If no open PR on this branch, suggest `/ship` first.

Infer issue number from branch name (`feat/issue-{N}-*`). Announce PR number, review decision, and number of unresolved comments.

---

# Step 1 — Gather context

Run in parallel:
1. Fetch PR comments, reviews, and review status
2. Run structural auditor on the PR diff

---

# Step 2 — Fix

For each unresolved comment:
1. Categorize: code change needed / clarification / style fix / already resolved
2. **Check if already addressed** in a subsequent commit before re-fixing
3. Fix what needs fixing (if ambiguous, ask for clarification)
4. Update tests if the fix changes behavior. Add E2E tests if a page flow was modified.

---

# Step 3 — Re-validate

Run the quality gates and fix loop as defined in `.claude/rules/automation.md`.

---

# Step 4 — Reply and push

- **Never reply to comments automatically** — ask the user first
- Reply via `gh api repos/{owner}/{repo}/pulls/{number}/comments/{id}/replies`
- Push fixes

Ask whether to keep watching for new reviews. Loop back to Step 1 if yes.
