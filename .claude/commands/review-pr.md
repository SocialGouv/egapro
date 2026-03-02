Review a pull request by fetching its comments and suggesting fixes.

## Instructions

1. **Fetch PR details and comments** using the `gh` CLI:
   ```bash
   gh pr view $ARGUMENTS --json title,body,number,headRefName,baseRefName
   gh api repos/{owner}/{repo}/pulls/{number}/comments
   gh api repos/{owner}/{repo}/issues/{number}/comments
   gh pr diff $ARGUMENTS
   ```

2. **Analyze each review comment**:
   - Identify what the reviewer is asking for (code change, clarification, style fix, etc.)
   - Check the referenced file and line to understand the context
   - Determine if the comment has already been addressed in a subsequent commit

3. **For each unresolved comment**:
   - Read the referenced file
   - Apply the requested fix following project conventions (see CLAUDE.md and .claude/rules/)
   - If the fix is ambiguous, list the options and ask for clarification

4. **After all fixes are applied**:
   - Run `pnpm typecheck` to verify no type errors
   - Run `pnpm test` to verify all tests pass
   - Summarize what was fixed and what was left unresolved

5. **Optionally reply to comments** (only if the user asks):
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="Fixed in latest commit."
   ```

## Usage

```
/review-pr <PR_NUMBER_OR_URL>
```
