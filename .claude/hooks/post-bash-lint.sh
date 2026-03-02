#!/bin/bash
# PostToolUse hook: run lint+format on all modified files after Bash commands.
# Acts as a safety net to catch any formatting issues before CI.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only run after test/build/typecheck commands (skip simple commands like ls, git, etc.)
if ! echo "$COMMAND" | grep -qE 'pnpm (test|build|typecheck|lint|format|check)'; then
  exit 0
fi

PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
cd "$PROJECT_DIR/packages/app" 2>/dev/null || exit 0

# Auto-fix lint+format on all modified files tracked by git
CHANGED=$(git diff --name-only --diff-filter=ACM HEAD -- '*.ts' '*.tsx' '*.json' 2>/dev/null | head -50)
if [ -z "$CHANGED" ]; then
  exit 0
fi

echo "Auto-fixing lint+format on $(echo "$CHANGED" | wc -l | tr -d ' ') changed files..." >&2
echo "$CHANGED" | xargs pnpm biome check --write 2>&1 | tail -3 >&2

exit 0
