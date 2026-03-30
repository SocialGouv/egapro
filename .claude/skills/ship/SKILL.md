---
name: ship
description: "Smart end-to-end: auto-detects phase (implement, validate, PR, review). Usage: /ship [#N]"
---

# /ship

Ships a GitHub issue from start to merge-ready. **Smart** — auto-detects where you are and picks up from there.

## Arguments

`$ARGUMENTS` — optional: GitHub issue number (`#123`), URL, or just `123`.

---

# Step 0 — Detect phase

Run this **before anything else** to figure out where we are:

```bash
BRANCH=$(git branch --show-current)
gh pr view --json number,title,url,reviewDecision,comments,reviews 2>/dev/null
git diff origin/master...HEAD --name-only
git diff --name-only HEAD
```

Also try to infer the issue number from the branch name if no `$ARGUMENTS` given (e.g. `feat/issue-{N}-*`).

### Routing

| State | Phase |
|---|---|
| Issue number given + no changes on branch | **Phase 1** — implement |
| Issue number given + changes already exist | **Phase 2** — validate |
| No arg + changes exist + no open PR | **Phase 2** — validate (infer issue from branch) |
| No arg + open PR + unresolved review comments | **Phase 4** — review |
| No arg + open PR + no unresolved comments | **Phase 5** — done |
| No arg + no changes + no PR | Ask: "Which issue? (`#123`)" |

**Always announce** which phase was detected:
> "Branch `feat/issue-42-...`, open PR #87, 3 unresolved comments. Starting at **Phase 4 — Review**."

---

# Phase 1 — Implement

## 1.1 — Resolve issue

1. Extract issue number from `$ARGUMENTS` (URL, `#N`, or `N`)
2. If owner/repo not in URL: `git remote get-url origin`

## 1.2 — Fetch issue and detect tasks

```bash
gh issue view {N} --json number,title,body,state,labels,comments
```

Treat **comments** as part of the context (requirements, Figma links, acceptance criteria).

Detect sub-tasks in order:

1. **Native sub-issues**: `gh api repos/{owner}/{repo}/issues/{N}/sub_issues`
2. **Checkboxes**: `- [ ] task` in body + comments
3. **Single task**: the issue itself

Present the task list with `AskUserQuestion` and ask for confirmation.

## 1.3 — Branch

Ask with `AskUserQuestion`:
> "Create branch `feat/issue-{N}-{slug}` or stay on `{current_branch}`?"

## 1.4 — Task loop

For each pending task:

### Fetch details
- Sub-issue: `gh issue view {task_number} --json number,title,body,labels,comments`
- Checkbox: use text as description

### Analyze scope
- Identify affected files, modules, patterns
- Load `packages/app/CLAUDE.md` if working in app
- **Figma**: if UI task + Figma URL in body/comments -> `get_design_context`. If UI task + no URL -> ask user for link.

### Implement
- Follow all conventions from `CLAUDE.md` and `packages/app/CLAUDE.md`
- Write code, tests, migrations
- Use existing codebase patterns

### Report progress
```
[{current}/{total}] #{task_number} {task_title} DONE
```

-> Continue to **Phase 2**.

---

# Phase 2 — Validate

## 2.1 — Scope

```bash
git diff origin/master...HEAD --name-only
```
Fallback: `git diff --name-only HEAD`

## 2.2 — Launch 4 parallel agents

1. **Validator** — `.claude/agents/validator/AGENT.md` (typecheck + test + lint + format)
2. **Structural auditor** — `.claude/agents/structural-auditor/AGENT.md` on all changed files
3. **RGAA auditor** — `.claude/agents/rgaa-auditor/AGENT.md` on changed `.tsx`. Auto-fix `[ERROR]`.
4. **Security auditor** — `.claude/agents/security-auditor/AGENT.md` on changed `.ts/.tsx`. Auto-fix `[CRITICAL]` and `[HIGH]`.

## 2.3 — Fix loop

1. Fix all violations
2. Re-run only failing agents
3. If auto-fixes applied, re-run validator too
4. **Loop until zero violations**

## 2.4 — Lighthouse (if dev server running)

```bash
pnpm test:lighthouse  # must score 100% accessibility
```

## 2.5 — Report

```
## Validation: PASS
| Check      | Status |
|------------|--------|
| Typecheck  | PASS   |
| Tests      | PASS   |
| Lint       | PASS   |
| Structure  | PASS   |
| RGAA       | PASS   |
| Security   | SECURE |
```

-> Continue to **Phase 3**.

---

# Phase 3 — PR

## 3.1 — Analyze

```bash
git log --oneline --reverse origin/master..HEAD
git diff origin/master..HEAD --stat
```

## 3.2 — Ask strategy

Ask with `AskUserQuestion`:
> "Validation passed. Ship as:"
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

-> Continue to **Phase 4**.

---

# Phase 4 — Review

## 4.1 — Ask

Ask with `AskUserQuestion`:
> "PR ready: {PR_URL}. Watch for reviews?"

If no -> **Phase 5**.

## 4.2 — Gather context (2 parallel agents)

**Agent 1 — PR comments:**
```bash
gh pr view --json number,title,body,headRefName,baseRefName,url,comments,reviews,reviewDecision
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

**Agent 2 — Code review:**
Delegate diff to `.claude/agents/structural-auditor/AGENT.md`.

## 4.3 — Analyze

1. **Human comments** -> categorize: code change, clarification, style fix, resolved
2. **Auditor findings** -> ERROR and WARN items
3. Check if already addressed in subsequent commits

No unresolved comments -> **Phase 5**.

## 4.4 — Fix

For each unresolved issue:
1. Read the file
2. Apply fix following project conventions
3. If ambiguous, ask for clarification

## 4.5 — Re-validate

Re-run Phase 2 (4 agents + fix loop).

## 4.6 — Reply (user-driven)

**NEVER** reply automatically. Ask with `AskUserQuestion`:
> "Reply to resolved comments on GitHub?"

If yes: `gh api .../comments/{id}/replies -f body="Fixed in latest commit."`

## 4.7 — Push

```bash
git push
```

## 4.8 — Loop

Ask with `AskUserQuestion`:
> "Keep watching for new reviews?"

If yes -> back to 4.2. If no -> **Phase 5**.

---

# Phase 5 — Done

## 5.1 — Wrap up

**NEVER** take GitHub actions automatically. Ask with `AskUserQuestion`:
> "Shipped. Anything else?"

Options:
- **Close sub-issues**
- **Comment on parent issue**
- **Nothing**

## 5.2 — Final report

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
