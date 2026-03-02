#!/bin/bash
# PreToolUse hook: block suppression comments (biome-ignore, eslint-disable, @ts-ignore)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Extract the content being written
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

# Check for suppression patterns
if echo "$CONTENT" | grep -qE 'biome-ignore|eslint-disable|@ts-ignore|@ts-expect-error'; then
  echo "Blocked: suppression comments (biome-ignore, eslint-disable, @ts-ignore, @ts-expect-error) are forbidden. Fix the underlying issue instead." >&2
  exit 2
fi

exit 0
