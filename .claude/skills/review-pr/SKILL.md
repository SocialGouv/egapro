# /review-pr

Review the current branch's changes against the code quality checklist.

## Instructions

1. Get the diff of the current branch against the base branch:

```
!git diff origin/master...HEAD --name-only
```

2. Get the full diff for context:

```
!git diff origin/master...HEAD
```

3. Delegate the review to the **code-reviewer** agent (subagent_type: "general-purpose", model: "sonnet") with:
   - The list of changed files
   - The full diff content
   - Instructions to follow the 10-point checklist from `.claude/agents/code-reviewer/AGENT.md`

4. Present the agent's findings with this format:

```
## Review Result: [PASS | NEEDS WORK | MINOR]

### Errors (must fix)
- [ERROR] file:line - description

### Warnings (should fix)
- [WARN] file:line - description

### Summary
X error(s), Y warning(s) across Z file(s)
```

If no violations are found, respond with:

```
## Review Result: PASS

No violations found. All changes follow the project conventions.
```
