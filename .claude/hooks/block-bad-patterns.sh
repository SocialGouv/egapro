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

# Block if CONTENT matches PATTERN and FILE_PATH matches FILE_FILTER.
# Optional 4th arg: exclude filter (skip if FILE_PATH matches).
check_pattern() {
  local file_filter="$1"
  local pattern="$2"
  local message="$3"
  local exclude_filter="${4:-}"

  # Skip if file matches exclusion
  if [[ -n "$exclude_filter" ]] && [[ "$FILE_PATH" =~ $exclude_filter ]]; then
    return
  fi

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

# Inline SVG — JSX files only (DsfrPictogram is the only allowed SVG wrapper)
check_pattern '\.(tsx|jsx)$' \
  '<svg[[:space:]>]' \
  'Inline <svg> is forbidden. Use DsfrPictogram, public/assets/*.svg + <Image> (next/image), or DSFR icon classes (fr-icon-*).' \
  '(DsfrPictogram\.tsx|ErrorArtwork\.tsx)'

# Direct process.env — use ~/env.js instead (exclude env.js, instrumentation, next.config)
check_pattern '\.(ts|tsx)$' \
  'process\.env' \
  'Direct process.env is forbidden. Use: import { env } from "~/env.js".' \
  '(env\.js|instrumentation\.ts|next\.config|trpc/react\.tsx)'

# Deep relative imports — use ~/ path alias
check_pattern '\.(ts|tsx)$' \
  '(\.\./){2,}' \
  'Deep relative imports (../../ or deeper) are forbidden. Use the ~/ path alias.'

# Raw @media queries in SCSS — use DSFR mixins (allow @media print and comments)
check_pattern '\.scss$' \
  '@media[[:space:]]+.*((min|max)-width|screen)' \
  'Raw @media queries are forbidden. Use DSFR mixins: @include respond-from(md) or @include respond-to(sm).'

# dangerouslySetInnerHTML — XSS vector, forbidden in JSX
check_pattern '\.(tsx|jsx)$' \
  'dangerouslySetInnerHTML' \
  'dangerouslySetInnerHTML is forbidden (XSS risk). Use safe rendering or DOMPurify if absolutely necessary.'

# Explicit `any` type — kills TypeScript safety (allow test files)
check_pattern '\.(ts|tsx)$' \
  '(: any[^a-zA-Z]|as any[^a-zA-Z])' \
  'Explicit `any` type is forbidden. Use `unknown` with type narrowing instead.' \
  '(__tests__|\.test\.|\.spec\.)'

# Raw <img> tags — use next/image Image component instead (allow test files)
check_pattern '\.(tsx|jsx)$' \
  '<img[[:space:]>]' \
  'Raw <img> is forbidden. Use: import Image from "next/image".' \
  '(__tests__|\.test\.|\.spec\.|setup\.ts)'

exit 0
