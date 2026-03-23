---
name: review-pr
description: Review the current PR, fetch comments, run code review agent, apply fixes
---

# /review-pr

Review the pull request for the current branch.

## Instructions

### Step 1 — Gather context (2 parallel agents)

**Agent 1 — PR metadata + comments:**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url
gh pr view --json comments,reviews,reviewDecision
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

**Agent 2 — Code review:**
Get the diff (`git diff origin/master...HEAD`) and delegate to `.claude/agents/structural-auditor/AGENT.md`.

### Step 2 — Analyze findings

Merge the two sources:
1. **Human reviewer comments** — categorize each as: code change, clarification, style fix, or resolved
2. **Structural auditor findings** — ERROR and WARN items from the automated checklist

For each comment, check if it was already addressed in a subsequent commit.

### Step 3 — Apply fixes

For each **unresolved** issue (human comments + agent errors):
1. Read the referenced file
2. Apply the fix following project conventions
3. If ambiguous, ask for clarification

### Step 4 — Quality gates (4 parallel agents)

1. **Validator** — delegate to `.claude/agents/validator/AGENT.md`
2. **Structural auditor** — delegate to `.claude/agents/structural-auditor/AGENT.md` on all changed files
3. **RGAA auditor** — delegate to `.claude/agents/rgaa-auditor/AGENT.md` on changed `.tsx` files (skip if none)
4. **Security auditor** — delegate to `.claude/agents/security-auditor/AGENT.md` on changed server files (skip if none)

### Step 5 — Report

```
## PR Review: #{number} — {title}

### Human Review Comments
| Status | Author | File | Comment | Action |
|---|---|---|---|---|

### Structural Audit: [PASS | NEEDS WORK | MINOR]
[structural-auditor findings]

### RGAA: [PASS | NEEDS WORK | SKIPPED]
### Security: [SECURE | VULNERABLE | SKIPPED]
### Validation: [PASS | FAIL]
```

### Step 6 — Reply to comments (user-driven)

**NEVER** reply automatically. Ask with `AskUserQuestion`:

> "Do you want me to reply to the resolved PR comments on GitHub?"

If yes → `gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="Fixed in latest commit."`
If no → do nothing.
