---
name: review-pr
description: Review the current PR, fetch comments, run code review agent, apply fixes
---

# /review-pr

Review the pull request for the current branch. Combines GitHub PR comments with automated code review.

## Instructions

### Step 1 — Detect PR and gather context (parallel)

Launch 2 parallel agents:

**Agent 1 — PR metadata + comments:**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url
gh pr view --json comments,reviews,reviewDecision
```
Then fetch inline review comments:
```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

**Agent 2 — Code review (delegate to `code-reviewer` agent):**
Get the diff and changed files:
```bash
git diff origin/master...HEAD --name-only
git diff origin/master...HEAD
```
Run the code review against the 21-point checklist in `.claude/agents/code-reviewer/AGENT.md`.
This checklist covers all rules from `.claude/rules/` and `block-bad-patterns.sh`.

### Step 2 — Analyze findings

Merge the two sources:
1. **Human reviewer comments** — categorize each as: code change, clarification, style fix, or resolved
2. **Code-reviewer agent findings** — ERROR and WARN items from the automated checklist

For each comment, check if it was already addressed in a subsequent commit.

### Step 3 — Apply fixes

For each **unresolved** issue (human comments + agent errors):
1. Read the referenced file
2. Apply the fix following project conventions (see `CLAUDE.md` and `.claude/rules/`)
3. If the fix is ambiguous, list options and ask for clarification

### Step 4 — Quality gates (parallel agents)

Launch **5 parallel agents** (all mandatory per automation rules):

1. **Validation: typecheck** — `pnpm typecheck`
2. **Validation: tests** — `pnpm test`
3. **Validation: lint+format** — `pnpm lint:check && pnpm format:check`
4. **RGAA audit** — delegate to `rgaa-auditor` agent on all changed `.tsx` files (skip if no `.tsx` in diff)
5. **Security audit** — delegate to `security-auditor` agent on all changed `.ts/.tsx` in `server/`, `routers/`, or tRPC (skip if no server files in diff)

### Step 5 — Report

```
## PR Review: #{number} — {title}

### Human Review Comments
| Status | Author | File | Comment | Action |
|---|---|---|---|---|
| Fixed | @reviewer | file.tsx:42 | "Add label" | Added label |
| Already resolved | @reviewer | ... | ... | Fixed in abc123 |
| Needs clarification | @reviewer | ... | ... | Asked user |

### Automated Code Review (21-point checklist): [PASS | NEEDS WORK | MINOR]
[Agent findings here]

### RGAA Audit: [PASS | NEEDS WORK | MINOR | SKIPPED — no .tsx files]
[RGAA findings here]

### Security Audit: [SECURE | VULNERABLE | SKIPPED — no server files]
[Security findings here]

### Validation: [PASS | FAIL]
[Validation results here]
```

### Step 6 — Reply to comments (user-driven)

**NEVER** reply to PR comments automatically. After Step 5, ask with `AskUserQuestion`:

> "Do you want me to reply to the resolved PR comments on GitHub?"

- If yes → reply to each resolved comment:
  ```bash
  gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="Fixed in latest commit."
  ```
- If no → do nothing, just keep the local report.
