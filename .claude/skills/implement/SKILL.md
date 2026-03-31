---
name: implement
description: "Implement a GitHub issue: fetch, branch, code, validate. Usage: /implement [#N]"
---

# /implement

Implements a GitHub issue end-to-end: understand the issue, code it, validate it.

## Arguments

`$ARGUMENTS` — GitHub issue number (`#123`, URL, or `123`). If omitted, infer from branch name (`feat/issue-{N}-*`) or ask.

---

# Step 0 — Detect state

Check if there are already commits on the branch vs `origin/alpha`:

- **No changes on branch** -> Step 1 (start from scratch)
- **Changes already exist** -> Step 4 (skip to validate)

---

# Step 1 — Understand the issue

Extract `{owner}/{repo}` from `git remote get-url origin` (needed for API calls below).

Fetch the issue **including comments** (requirements, Figma links, acceptance criteria often live there).

Detect sub-tasks in priority order:

1. **Native sub-issues**: `gh api repos/{owner}/{repo}/issues/{N}/sub_issues`
2. **Checkboxes**: `- [ ] task` in body + comments
3. **Single task**: the issue itself

Present the task list and confirm with the user before starting.

---

# Step 2 — Branch

Create `feat/issue-{N}-{slug}` from `origin/alpha`. If the current branch already tracks this issue, stay on it.

---

# Step 3 — Implement

For each task:

1. **Fetch details** — if the task is a sub-issue, fetch its full content individually (`gh issue view {task_number}`). For checkboxes, use the text as description.
2. **Analyze scope** — identify affected files, modules, patterns
3. **Figma** — if UI task with a Figma URL in the issue, follow `.claude/rules/figma-workflow.md` strictly. If UI task without URL, ask for the link.
4. **Code** — write code, tests, migrations
5. **Commit** — one commit per logical unit of work (not per file, not one giant commit at the end). Conventional messages: `feat:`, `fix:`, `refactor:`. Clean commit boundaries make split PRs easier in `/ship`.
6. **Report** — `[{current}/{total}] #{task} — done`

---

# Step 4 — Validate

Run the quality gates defined in `.claude/rules/automation.md`: 4 parallel agents (validator, structural, RGAA, security).

**Fix loop**: fix all violations, re-run only the failing agents, and if auto-fixes were applied also re-run the validator. Loop until zero violations.

If the dev server is running, also run `pnpm test:lighthouse` (must score 100% accessibility).

Done. Code is validated and ready to ship via `/ship`.
