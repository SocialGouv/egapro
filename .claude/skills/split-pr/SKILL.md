---
name: split-pr
description: Split the current branch into multiple focused PRs to simplify code review
---

# /split-pr

Split the current branch into multiple small, focused PRs grouped by logical concern. Each PR is self-contained, reviewable independently, and linked to the others for context.

## Arguments

`$ARGUMENTS` — optional: the base branch (defaults to `master`).

## Instructions

### Step 0 — Preconditions

Save the current branch name and determine the base:

```bash
ORIGINAL_BRANCH=$(git branch --show-current)
```

Parse `$ARGUMENTS`: if provided use it as base, otherwise default to `master`.

Check the working tree is clean:
```bash
git status --porcelain
```
If there are uncommitted changes, **stop and ask the user** to commit or stash first via `AskUserQuestion`.

Check there are commits ahead of the base:
```bash
git log --oneline origin/<base>..HEAD
```
If empty, **stop** — nothing to split.

### Step 1 — Analyze the branch

Gather all commits with their changed files:

```bash
git log --oneline --reverse origin/<base>..HEAD
```

For each commit, read its full diff to understand what changed:
```bash
git show <sha> --stat
git show <sha>
```

Also get the global picture:
```bash
git diff origin/<base>..HEAD --stat
```

### Step 2 — Propose a split plan

Analyze all commits and group them by **logical concern** (e.g., refactor, feature, fix, tests, config). Each group must:

1. Be **self-contained** — it compiles and tests pass on its own
2. Have a **clear single purpose** — one theme per PR
3. **Respect dependency order** — if group B depends on changes in group A, A must be merged first

**Edge case**: if all commits belong to a single logical group, tell the user there is nothing to split and suggest creating a normal PR instead. Stop here.

Present the plan as a table:

```
## Proposed split

| # | PR title | Commits | Files | Depends on |
|---|---|---|---|---|
| 1 | refactor: split domain gap.ts into focused modules | abc1234, def5678 | 7 files | -- |
| 2 | feat: remove gapUtils re-export layer | 1a2b3c4 | 14 files | PR #1 |
```

**Ask the user to confirm or adjust the plan** via `AskUserQuestion` before proceeding. Loop until the user approves.

### Step 3 — Create the PRs (sequential, in dependency order)

For each group in the approved plan, in order:

#### 3a — Create the branch

Branch naming: `split/<original-branch>/<short-name>` (namespaced to avoid collisions).

```bash
# First PR: branch from the base
git checkout -b split/<original-branch>/<short-name> origin/<base>

# Subsequent PRs: branch from the previous split branch
git checkout -b split/<original-branch>/<short-name> split/<original-branch>/<previous-name>
```

#### 3b — Cherry-pick the commits

```bash
git cherry-pick <sha1> <sha2> ...
```

If a cherry-pick conflicts:
1. Read the conflicting files and attempt to resolve
2. If the resolution is ambiguous, run `git cherry-pick --abort` and ask the user via `AskUserQuestion`
3. After resolving, `git add` the resolved files and `git cherry-pick --continue`

#### 3c — Verify the branch is green

Launch **3 parallel agents**:

1. **Agent: typecheck** — `pnpm typecheck`
2. **Agent: tests** — `pnpm test`
3. **Agent: lint+format** — `pnpm lint:check && pnpm format:check`

If any check fails:
1. Fix the issue and commit the fix on this branch
2. Re-run only the failing check(s)
3. Repeat until all 3 pass

#### 3d — Push and create the PR

```bash
git push -u origin split/<original-branch>/<short-name>
```

Determine the correct base for the PR:
- First PR: `<base>`
- Subsequent PRs: `split/<original-branch>/<previous-name>`

Create the PR with a temporary body (cross-links will be added in Step 4):

```bash
gh pr create \
  --base <base-branch> \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing this PR's scope>

## Review order
This is PR **N/total** in a split series. Cross-links will follow.

> Tip: review this PR by itself -- each PR in the series is self-contained.

## Test plan
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Lint + format clean

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Save the created PR number and URL.

#### 3e — Continue to the next group

Repeat 3a-3d for the next group in the plan. The branch just created becomes the base for the next PR.

### Step 4 — Update all PR descriptions with cross-links

Once all PRs are created, update each PR body to include the full ordered list of PR links:

```bash
gh pr edit <number> --body "$(cat <<'EOF'
## Summary
<original summary>

## Review order
This is PR **N/total** in a split series:
1. #<number1> — <title1>
2. #<number2> — <title2> **(this PR)**
3. #<number3> — <title3>

Merge in order. After merging each PR, GitHub auto-updates the next PR's base.

> Tip: review this PR by itself -- each PR in the series is self-contained.

## Test plan
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Lint + format clean

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 5 — Return to original branch

```bash
git checkout <original-branch>
```

## Output Format

```
## Split complete: N PRs created

| # | PR | Title | Base | Checks |
|---|---|---|---|---|
| 1 | #123 | refactor: split domain modules | master | PASS |
| 2 | #124 | feat: remove re-export layer | split/.../domain-modules | PASS |

### Review order
1. #123 (independent)
2. #124 (after #123 is merged)

### Merge strategy
Merge in order (1, 2, ...). After merging each PR, the next PR's base updates automatically on GitHub.
```
