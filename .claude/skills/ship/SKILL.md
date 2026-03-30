---
name: ship
description: "Ship validated code: create PR (single/split), watch reviews, wrap up. Usage: /ship"
---

# /ship

Ships validated code to GitHub. Creates PR, watches reviews, and wraps up. Run after `/implement` has validated the code.

## Arguments

`$ARGUMENTS` — optional: not typically needed (state is inferred from branch/PR).

---

# Step 0 — Detect state

Run this **before anything else** to figure out where we are:

```bash
BRANCH=$(git branch --show-current)
gh pr view --json number,title,url,reviewDecision,comments,reviews 2>/dev/null
git diff origin/master...HEAD --name-only
git log --oneline --reverse origin/master..HEAD
```

Also try to infer the issue number from the branch name (e.g. `feat/issue-{N}-*`).

### Routing

| State | Action |
|---|---|
| Changes exist + no open PR | **Phase 1** — create PR |
| Open PR + unresolved review comments | **Phase 2** — review |
| Open PR + no unresolved comments | **Phase 3** — done |
| No changes + no PR | Nothing to ship. Suggest `/implement` first. |

**Always announce** which phase was detected:
> "Branch `feat/issue-42-...`, open PR #87, 3 unresolved comments. Starting at **Phase 2 — Review**."

---

# Phase 1 — PR

## 1.1 — Analyze

```bash
git log --oneline --reverse origin/master..HEAD
git diff origin/master..HEAD --stat
```

## 1.2 — Ask strategy

Ask with `AskUserQuestion`:
> "Ship as:"
> 1. **Single PR**
> 2. **Split** into multiple PRs
> 3. **Skip** for now

### Single PR

```bash
git push -u origin {branch}
gh pr create --base master --title "<from issue>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

Closes #{N}

## Quality gates
- [x] Typecheck / Tests / Lint
- [x] Structural / RGAA / Security audit

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Split PRs

1. Read each commit's diff, group by **logical concern**
2. Each group: self-contained, single purpose, respects dependency order
3. If only one group -> fall back to single PR
4. Present plan as table, **ask confirmation** via `AskUserQuestion`
5. For each group in order:
   - Branch: `split/{original-branch}/{short-name}` (first from `origin/master`, rest from previous)
   - Cherry-pick commits (resolve conflicts or ask user)
   - Verify green via `.claude/agents/validator/AGENT.md`
   - Push + create PR
6. Cross-link all PRs (update each body with ordered list)
7. Return to original branch

### Skip

Continue without PR.

-> Continue to **Phase 2**.

---

# Phase 2 — Review

## 2.1 — Ask

Ask with `AskUserQuestion`:
> "PR ready: {PR_URL}. Watch for reviews?"

If no -> **Phase 3**.

## 2.2 — Gather context (2 parallel agents)

**Agent 1 — PR comments:**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url,comments,reviews,reviewDecision
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

**Agent 2 — Code review:**
Delegate diff to `.claude/agents/structural-auditor/AGENT.md`.

## 2.3 — Analyze

1. **Human comments** -> categorize: code change, clarification, style fix, resolved
2. **Auditor findings** -> ERROR and WARN items
3. Check if already addressed in subsequent commits

No unresolved comments -> **Phase 3**.

## 2.4 — Fix

For each unresolved issue:
1. Read the file
2. Apply fix following project conventions
3. If ambiguous, ask for clarification

## 2.5 — Re-validate

Re-run validation (4 agents + fix loop) as described in `/implement` Phase 2.

## 2.6 — Reply (user-driven)

**NEVER** reply automatically. Ask with `AskUserQuestion`:
> "Reply to resolved comments on GitHub?"

If yes: `gh api .../comments/{id}/replies -f body="Fixed in latest commit."`

## 2.7 — Push

```bash
git push
```

## 2.8 — Loop

Ask with `AskUserQuestion`:
> "Keep watching for new reviews?"

If yes -> back to 2.2. If no -> **Phase 3**.

---

# Phase 3 — Done

## 3.1 — Wrap up

**NEVER** take GitHub actions automatically. Ask with `AskUserQuestion`:
> "Shipped. Anything else?"

Options:
- **Close sub-issues**
- **Comment on parent issue**
- **Nothing**

## 3.2 — Final report

```
## #{N}: {title} — SHIPPED

### Tasks
| # | Task | Status |
|---|---|---|
| 1 | #{task_number} {title} | DONE |

### Quality
| Check | Status |
|---|---|
| Typecheck | PASS |
| Tests | PASS |
| Lint | PASS |
| Structure | PASS |
| RGAA | PASS |
| Security | SECURE |

### PR
#{pr_number} — {pr_url} — Review: {APPROVED|PENDING}

### Reviews Addressed
| Author | File | Comment | Action |
|---|---|---|---|
```
