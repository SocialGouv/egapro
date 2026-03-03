---
name: process-issue
description: Process a GitHub issue (parent + sub-issues) end-to-end with mandatory RGAA + security gates
---

# /process-issue

Process a GitHub issue end-to-end: fetch sub-tasks, implement each sequentially, run mandatory quality gates (including RGAA and security on every task), and report progress.

## Arguments

$ARGUMENTS — required: GitHub issue number (`#123`) or URL (`https://github.com/owner/repo/issues/123`).

## Instructions

### Step 1 — Parse argument and resolve repo

1. Extract the issue number from `$ARGUMENTS`:
   - URL format: `https://github.com/{owner}/{repo}/issues/{N}` → extract `N`, `owner`, `repo`
   - Short format: `#N` or just `N` → extract `N`
2. If owner/repo not in URL, resolve from git remote:
   ```bash
   git remote get-url origin
   ```
   Parse `owner/repo` from the remote URL.

### Step 2 — Fetch issue and detect tasks

1. Fetch the parent issue metadata:
   ```bash
   gh issue view {N} --json number,title,body,state,labels
   ```

2. Detect sub-tasks using three strategies in order:

   **Strategy A — Native sub-issues** (preferred):
   ```bash
   gh api repos/{owner}/{repo}/issues/{N}/sub_issues
   ```
   If this returns a non-empty array, use it. Each item has `number`, `title`, `state`.

   **Strategy B — Checkbox parsing** (fallback):
   Parse the issue body for task checkboxes:
   - `- [ ] task text` → pending task
   - `- [x] task text` → completed task (skip)
   - If checkbox text contains `#N` or a URL, link to that issue for details.

   **Strategy C — Single task** (final fallback):
   If neither sub-issues nor checkboxes found, treat the parent issue itself as a single task.

3. Build an ordered task list, filtering out closed/checked items.

4. Present the task list to the user with `AskUserQuestion`:
   - Show each task: number, title, status
   - Show total count: `{pending}/{total} tasks to implement`
   - Ask for confirmation before proceeding

### Step 3 — Branch

1. Generate a slug from the parent issue title:
   - Lowercase, replace non-alphanumeric with hyphens, truncate to 40 chars
2. Branch name: `feat/issue-{N}-{slug}`
3. If branch already exists (re-run scenario), check it out. Otherwise create from current HEAD.
   ```bash
   git checkout -b feat/issue-{N}-{slug} 2>/dev/null || git checkout feat/issue-{N}-{slug}
   ```

### Step 4 — Sequential task loop

For each pending task, execute the following sub-steps:

#### 4.1 — Fetch task details

- If sub-issue: `gh issue view {task_number} --json number,title,body,labels`
- If checkbox: use the checkbox text as the task description

#### 4.2 — Analyze scope

- Read the task body/description carefully
- Identify affected files, modules, and patterns
- Load `packages/app/CLAUDE.md` if working in `packages/app/`
- **Figma design detection**: check if the task involves UI creation or modification (new page, new component, visual change, layout change, design update). Indicators:
  - Labels containing `design`, `ui`, `ux`, `frontend`, `page`, `component`, `figma`
  - Task title/body mentioning "page", "écran", "maquette", "composant", "interface", "formulaire", "modale"
  - Task requires creating or significantly modifying `.tsx` files with visual output
- If a Figma URL is present in the task body → use `get_design_context` to fetch the design
- If the task is identified as design-related but **no Figma URL is found** in the issue body → **ask the user** with `AskUserQuestion`:
  > "Task #{task_number} ({title}) involves UI work but has no Figma link. Do you have a Figma design URL for this task?"
  - If the user provides a URL → use `get_design_context` to fetch the design
  - If the user says no / skip → proceed without Figma (implement based on issue description and existing patterns)

#### 4.3 — Implement

- Follow all project conventions from `CLAUDE.md` and `packages/app/CLAUDE.md`
- Write code, tests, and any necessary migrations
- Use existing patterns from the codebase

#### 4.4 — Quality gates (MANDATORY — not conditional)

**Phase 1 — Validation** (3 parallel agents):

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

If any fails → fix → re-run until all pass.

**Phase 2 — Audits** (2 parallel agents, ALWAYS run regardless of file types):

1. **Agent: RGAA audit** — delegate to `rgaa-auditor` agent (`.claude/agents/rgaa-auditor/AGENT.md`)
   - Pass all files created/modified in this task
   - Auto-fix all `[ERROR]` findings
2. **Agent: Security audit** — delegate to `security-auditor` agent (`.claude/agents/security-auditor/AGENT.md`)
   - Pass all files created/modified in this task
   - Auto-fix all `[CRITICAL]` and `[HIGH]` findings

If any auto-fixes were applied in Phase 2 → re-run Phase 1 validation.

#### 4.5 — Mark task as done

- **Sub-issue** → close it:
  ```bash
  gh issue close {task_number} --comment "Implemented in branch feat/issue-{N}-{slug}"
  ```
- **Checkbox** → check it in the parent issue body:
  ```bash
  gh issue edit {N} --body "updated body with [x]"
  ```

#### 4.6 — Report progress

Display after each task:
```
[{current}/{total}] #{task_number} {task_title} DONE — Validation: PASS | RGAA: {PASS|X findings} | Security: {SECURE|X findings}
```

### Step 5 — Cleanup

1. Comment on the parent issue with a summary:
   ```bash
   gh issue comment {N} --body "All tasks implemented in branch \`feat/issue-{N}-{slug}\`. PR incoming."
   ```

2. Ask the user if they want to open a PR:
   - If yes, create PR targeting `master` with a summary of all changes
   - If no, just report the branch name

### Step 6 — Final report

```
## Issue #{N}: {title}

### Task Summary

| # | Task | Validation | RGAA | Security |
|---|---|---|---|---|
| 1 | #{task_number} {title} | PASS | PASS | SECURE |
| 2 | #{task_number} {title} | PASS | 2 WARN | SECURE |

### Findings Detail

#### Task #{task_number}: {title}
- RGAA: [WARN] RGAA-11.1 file.tsx:42 — Missing explicit label (not auto-fixable)
- Security: No findings

### Next Steps
- [ ] Review PR #{pr_number}
- [ ] Address {X} remaining warnings
- [ ] Manual QA on affected routes
```
