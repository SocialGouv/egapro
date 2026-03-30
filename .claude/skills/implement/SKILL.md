---
name: implement
description: "Implement a GitHub issue: fetch, branch, code, validate. Usage: /implement [#N]"
---

# /implement

Implements a GitHub issue from start to validated code. Handles sub-tasks, Figma designs, and runs all quality gates.

## Arguments

`$ARGUMENTS` — optional: GitHub issue number (`#123`), URL, or just `123`.

---

# Step 0 — Detect state

Run this **before anything else** to figure out where we are:

```bash
BRANCH=$(git branch --show-current)
git diff origin/master...HEAD --name-only
git diff --name-only HEAD
```

Also try to infer the issue number from the branch name if no `$ARGUMENTS` given (e.g. `feat/issue-{N}-*`).

### Routing

| State | Action |
|---|---|
| Issue number given + no changes on branch | **Phase 1** — implement |
| Issue number given + changes already exist | **Phase 2** — validate |
| No arg + changes exist + no open PR | **Phase 2** — validate (infer issue from branch) |
| No arg + no changes | Ask: "Which issue? (`#123`)" |

**Always announce** which phase was detected:
> "Branch `feat/issue-42-...`, no changes yet. Starting at **Phase 1 — Implement**."

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

Done. Code is validated and ready to ship via `/ship`.
