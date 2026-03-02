#!/bin/bash
# PreToolUse hook: block inline styles and inline SVG in .tsx files

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check .tsx files
if [[ ! "$FILE_PATH" =~ \.tsx$ ]]; then
  exit 0
fi

# Extract the content being written
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

# Check for inline style={{ pattern
if echo "$CONTENT" | grep -qE 'style=\{'; then
  echo "Blocked: inline style={{}} is forbidden in .tsx files. Use DSFR classes or a scoped SCSS module instead." >&2
  exit 2
fi

# Check for inline SVG markup
if echo "$CONTENT" | grep -qE '<svg[[:space:]>]'; then
  echo "Blocked: inline <svg> is forbidden in .tsx files. Place SVG files in public/assets/ and use <img src=\"/assets/...\"> or DSFR icon classes (fr-icon-*)." >&2
  exit 2
fi

exit 0
