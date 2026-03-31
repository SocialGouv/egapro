---
name: ship
description: "Ship validated code: create PR, watch reviews. Usage: /ship"
---

# /ship

Ships validated code to GitHub. Creates the PR and handles the review cycle. Run after `/implement`.

## Arguments

`$ARGUMENTS` — not typically needed. State is inferred from branch and PR status.

---

# Step 0 — Detect state

Check branch, commits, and existing PR. Route accordingly:

- **Commits on branch, no open PR** -> Step 1 (create PR)
- **Open PR with unresolved review comments** -> Step 2 (review)
- **Open PR, nothing unresolved** -> done, report status
- **No commits on branch** -> nothing to ship, suggest `/implement`

Infer issue number from branch name (`feat/issue-{N}-*`). Announce what was detected before proceeding.

---

# Step 1 — Create PR

Analyze commits on the branch, then ask: **single PR** or **split**?

### Single PR

Push and create PR. Use this body template:

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

Group commits by logical concern. Present the plan as a table and ask confirmation. For each group in dependency order:

- Branch naming: `split/{original-branch}/{short-name}`
- First branch from `origin/alpha`, each subsequent branch from the previous one
- Cherry-pick commits, validate via the validator agent, push, create PR

Cross-link all PRs in their bodies.

---

# Step 2 — Review cycle

Gather context in parallel:
1. Fetch PR comments and review status
2. Run structural auditor on the PR diff

For each unresolved comment:
1. Categorize: code change needed / clarification / style fix / already resolved
2. **Check if already addressed** in a subsequent commit before re-fixing
3. Fix what needs fixing
4. Re-validate (quality gates from `.claude/rules/automation.md`)

After fixes:
- **Never reply to comments automatically** — ask the user first
- Reply via `gh api repos/{owner}/{repo}/pulls/{number}/comments/{id}/replies`
- Push fixes

Ask whether to keep watching for new reviews. Loop if yes.
