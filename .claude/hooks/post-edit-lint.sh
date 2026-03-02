#!/bin/bash
# PostToolUse hook: auto-lint/format edited files via Biome

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only lint code files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  exit 0
fi

# Skip files outside packages/app/
if [[ ! "$FILE_PATH" =~ packages/app/ ]]; then
  exit 0
fi

# Biome must run from packages/app/ to find the correct config
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')
cd "$PROJECT_DIR/packages/app" 2>/dev/null || exit 0

# Convert absolute path to relative path from packages/app/
REL_PATH="${FILE_PATH#$PROJECT_DIR/packages/app/}"
pnpm biome check --write "$REL_PATH" 2>&1 | tail -5 >&2

exit 0
