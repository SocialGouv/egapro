---
name: ship
description: "Ship validated code: create PR (single/split). Usage: /ship"
---

# /ship

Creates a PR from validated code. Run after `/implement`. For review handling, use `/review`.

## Arguments

`$ARGUMENTS` — not typically needed. State is inferred from branch and PR status.

---

# Step 0 — Detect state

Check branch, commits, and existing PR. Route accordingly:

- **Commits on branch, no open PR** -> Step 1 (create PR)
- **Open PR exists** -> already shipped, suggest `/review` if there are comments
- **No commits on branch** -> nothing to ship, suggest `/implement`

Infer issue number from branch name (`feat/issue-{N}-*`). Announce what was detected before proceeding.

---

# Step 1 — Analyze and decide

Analyze commits on the branch. Decide whether to **split** into multiple PRs based on:

- Multiple sub-tasks / issues addressed in separate commits
- Unrelated concerns mixed together (e.g. refactor + feature + bugfix)
- Large diff that would be hard to review as a single PR

If the commits form a single cohesive change, create one PR. If not, split.

---

# Step 2 — Create PR(s)

### Single PR

Push and create PR targeting `alpha` (`--base alpha`). Use this body template:

```
## Summary
<1-3 bullet points from the issue/commits>

Closes #{N}

## Quality gates
- [x] Typecheck / Tests / Lint
- [x] Structural / RGAA / Security audit

Generated with [Claude Code](https://claude.com/claude-code)
```

### Split PRs

Group commits by logical concern. Present the plan as a table and ask confirmation before creating. For each group in dependency order:

- Branch naming: `split/{original-branch}/{short-name}`
- First branch from `origin/alpha`, each subsequent branch from the previous one
- Cherry-pick commits (if conflicts, ask the user), validate via the validator agent, push, create PR targeting `alpha`

Cross-link all PRs in their bodies. Return to original branch when done.
