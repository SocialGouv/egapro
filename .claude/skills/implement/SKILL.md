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

- **No changes on branch + `/analyse` already run in this conversation** -> Step 2 (skip to branch, use existing plan)
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
4. **DSFR** — before writing any DSFR HTML, verify component structure via the DSFR MCP (`get_component_doc`, `search_components`). Never guess classes from memory.
5. **Code** — write implementation following project conventions
6. **Tests** — unit tests for every new file with logic (100% coverage on logic files, 75% global minimum). If a page is created or modified, add/update E2E tests in `src/e2e/`.
7. **DB migrations** — if schema was changed, run `pnpm db:generate && pnpm db:migrate`. Never hand-edit migration files.
8. **Commit** — one commit per logical unit of work (not per file, not one giant commit at the end). Conventional messages: `feat:`, `fix:`, `refactor:`. Clean commit boundaries make split PRs easier in `/ship`.
9. **Report** — `[{current}/{total}] #{task} — done`

---

# Step 4 — Validate

Run the quality gates and fix loop as defined in `.claude/rules/automation.md`.

If the dev server is running, also run `pnpm test:lighthouse` (must score 100% accessibility).

Done. Code is validated and ready to ship via `/ship`.
