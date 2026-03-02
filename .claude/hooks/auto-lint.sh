#!/bin/bash
# PostToolUse hook: auto-lint/format after edits or Bash commands.
# Handles both Edit/Write (single file) and Bash (all modified files).

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
APP_DIR="$PROJECT_DIR/packages/app"

cd "$APP_DIR" 2>/dev/null || exit 0

# --- Edit/Write: lint the single edited file ---
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  # Only lint code files inside packages/app/
  if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]] || [[ ! "$FILE_PATH" =~ packages/app/ ]]; then
    exit 0
  fi

  REL_PATH="${FILE_PATH#$APP_DIR/}"
  pnpm biome check --write "$REL_PATH" 2>&1 | tail -5 >&2
  exit 0
fi

# --- Bash: lint all modified files after pnpm commands ---
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  # Only run after pnpm quality commands
  if ! echo "$COMMAND" | grep -qE 'pnpm (test|build|typecheck|lint|format|check)'; then
    exit 0
  fi

  CHANGED=$(git diff --name-only --diff-filter=ACM HEAD \
    -- 'packages/app/**/*.ts' 'packages/app/**/*.tsx' 'packages/app/**/*.json' 2>/dev/null \
    | sed 's|^packages/app/||' \
    | head -50)

  if [ -z "$CHANGED" ]; then
    exit 0
  fi

  COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
  echo "Auto-fixing lint+format on $COUNT changed files..." >&2
  echo "$CHANGED" | xargs pnpm biome check --write 2>&1 | tail -3 >&2
  exit 0
fi

exit 0
