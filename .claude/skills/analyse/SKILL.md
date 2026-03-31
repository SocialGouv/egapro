---
name: analyse
description: "Analyze a GitHub issue and generate an implementation plan. Usage: /analyse [#N]"
---

# /analyse

Analyzes a GitHub issue, explores the codebase, and produces a structured implementation plan for user validation. Run **before** `/implement`.

## Arguments

`$ARGUMENTS` — GitHub issue number (`#123`, URL, or `123`). If omitted, infer from branch name (`feat/issue-{N}-*`) or ask.

---

# Step 1 — Understand the issue

Extract `{owner}/{repo}` from `git remote get-url origin`.

Fetch the issue **including comments** (requirements, Figma links, acceptance criteria often live there).

Detect sub-tasks in priority order:

1. **Native sub-issues**: `gh api repos/{owner}/{repo}/issues/{N}/sub_issues`
2. **Checkboxes**: `- [ ] task` in body + comments
3. **Single task**: the issue itself

---

# Step 2 — Explore the codebase

For each task, identify:

- **Existing files** to modify — read them to understand the current state
- **New files** to create — identify which module they belong to (`src/modules/{domain}/`)
- **Patterns to reuse** — search for similar features already implemented in the codebase and follow the same approach
- **Figma** — if UI task, note Figma URLs found in the issue. If none and the task is UI, flag it.
- **DB schema** — if the task requires schema changes, identify the tables/columns involved
- **Dependencies** — which tasks depend on others (e.g. schema before API, API before UI)

---

# Step 3 — Generate plan

Present a structured plan:

```
## Plan: #{N} — {title}

### Tasks (in order)

#### 1. {task title}
- **Files**: `path/to/file.ts` (modify), `path/to/new.ts` (create)
- **Approach**: {1-2 sentences on how to implement}
- **Tests**: {what to test — unit/E2E}
- **Risks**: {potential issues, things to clarify}

#### 2. ...

### Questions
- {anything unclear or ambiguous from the issue that should be resolved before coding}

### DB migrations
- {table/column changes, or "none"}

### Figma
- {screens to implement with URLs, or "none"}
```

---

# Step 4 — Validate

Ask the user to validate, adjust, or ask questions about the plan. Once approved, the user runs `/implement` to execute it.
