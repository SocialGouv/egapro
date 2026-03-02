#!/bin/bash
# PreToolUse hook: block forbidden patterns in code edits.
# Merges suppression comments + inline styles + inline SVG into a single check.
# Add new rules by adding a check_pattern call below.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Extract the content being written
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

# Block if CONTENT matches PATTERN and FILE_PATH matches FILE_FILTER
check_pattern() {
  local file_filter="$1"
  local pattern="$2"
  local message="$3"

  if [[ "$FILE_PATH" =~ $file_filter ]] && echo "$CONTENT" | grep -qE "$pattern"; then
    echo "Blocked: $message" >&2
    exit 2
  fi
}

# --- Rules (add new ones here) ---

# Suppression comments — all code files
check_pattern '\.(ts|tsx|js|jsx)$' \
  'biome-ignore|eslint-disable|@ts-ignore|@ts-expect-error' \
  'Suppression comments are forbidden. Fix the underlying issue instead.'

# Inline styles — JSX files only
check_pattern '\.(tsx|jsx)$' \
  'style=\{' \
  'Inline style={{}} is forbidden. Use DSFR classes or a scoped SCSS module.'

# Inline SVG — JSX files only
check_pattern '\.(tsx|jsx)$' \
  '<svg[[:space:]>]' \
  'Inline <svg> is forbidden. Use public/assets/*.svg + <img> or DSFR icon classes (fr-icon-*).'

exit 0
