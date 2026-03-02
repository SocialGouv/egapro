#!/bin/bash
# PostToolUse hook: auto-lint/format edited files via Biome

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only lint code files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  exit 0
fi

# Skip files outside packages/app/src
if [[ ! "$FILE_PATH" =~ packages/app/ ]]; then
  exit 0
fi

# Run biome check --write on the file
cd "$(echo "$INPUT" | jq -r '.cwd // empty')" 2>/dev/null || exit 0
pnpm biome check --write "$FILE_PATH" 2>&1 | tail -5 >&2

exit 0
