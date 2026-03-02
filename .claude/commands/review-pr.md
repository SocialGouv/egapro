# Review PR

Review the pull request for the current branch, fetch comments, and apply fixes.

## Instructions

1. **Detect current PR** from the git branch:
   ```bash
   gh pr view --json number,title,body,headRefName,baseRefName,url
   ```

2. **Fetch review comments**:
   ```bash
   gh pr view --json comments,reviews,reviewDecision
   gh api repos/{owner}/{repo}/pulls/{number}/comments
   ```

3. **Analyze each review comment**:
   - Identify what the reviewer is asking for (code change, clarification, style fix, etc.)
   - Check the referenced file and line to understand the context
   - Determine if the comment has already been addressed in a subsequent commit

4. **For each unresolved comment**:
   - Read the referenced file
   - Apply the requested fix following project conventions (see CLAUDE.md and .claude/rules/)
   - If the fix is ambiguous, list the options and ask for clarification

5. **After all fixes are applied**:
   - Run `pnpm typecheck` to verify no type errors
   - Run `pnpm test` to verify all tests pass
   - Run `pnpm lint:check` and `pnpm format:check` to verify CI will pass
   - Summarize what was fixed and what was left unresolved

6. **Optionally reply to comments** (only if the user asks):
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="Fixed in latest commit."
   ```
