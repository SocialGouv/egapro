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

# Inline styles — JSX files only (exclude @react-pdf/renderer components which require style={})
check_pattern '\.(tsx|jsx)$' \
  'style=\{' \
  'Inline style={{}} is forbidden. Use DSFR classes or a scoped SCSS module.' \
  '(declarationPdf/|noSanctionAttestation/)'

# Inline SVG — JSX files only (DsfrPictogram is the only allowed SVG wrapper)
check_pattern '\.(tsx|jsx)$' \
  '<svg[[:space:]>]' \
  'Inline <svg> is forbidden. Use DsfrPictogram, public/assets/*.svg + <Image> (next/image), or DSFR icon classes (fr-icon-*).' \
  '(DsfrPictogram\.tsx|ErrorArtwork\.tsx)'

# Direct process.env — use ~/env.js instead (exclude env.js, instrumentation, next.config, sentry configs)
check_pattern '\.(ts|tsx)$' \
  'process\.env' \
  'Direct process.env is forbidden. Use: import { env } from "~/env.js".' \
  '(env\.js|instrumentation(-client)?\.ts|next\.config|trpc/react\.tsx|sentry\.(client|server|edge)\.config\.ts|global-setup\.ts|playwright\.config|drizzle\.config|migrate\.mjs|e2e/helpers/)'

# Deep relative imports — use ~/ path alias
check_pattern '\.(ts|tsx)$' \
  '(\.\./){2,}' \
  'Deep relative imports (../../ or deeper) are forbidden. Use the ~/ path alias.'

# Hardcoded hex colors in SCSS — use DSFR CSS custom properties
check_pattern '\.scss$' \
  '#[0-9a-fA-F]{3,8}' \
  'Hardcoded hex colors are forbidden in SCSS. Use DSFR CSS custom properties (var(--background-*, --text-*, --border-*, --artwork-*)).'

# Hardcoded rgb/rgba colors in SCSS — use DSFR CSS custom properties
check_pattern '\.scss$' \
  'rgba?\(' \
  'Hardcoded rgb()/rgba() colors are forbidden in SCSS. Use DSFR CSS custom properties.'

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

# Domain layer — getFullYear() must come from ~/modules/domain (allow domain/ itself and tests)
check_pattern '\.(ts|tsx)$' \
  'getFullYear\(\)' \
  'Inline getFullYear() is forbidden. Use getCurrentYear() or getCseYear() from ~/modules/domain.' \
  '(domain/|__tests__|\.test\.|\.spec\.)'

# Domain layer — slice(0, 9) for SIREN extraction must come from ~/modules/domain
check_pattern '\.(ts|tsx)$' \
  'slice\(0,[[:space:]]*9\)' \
  'Inline slice(0, 9) is forbidden. Use extractSiren() from ~/modules/domain.' \
  '(domain/|__tests__|\.test\.|\.spec\.)'

# Zod imports forbidden in router files — schemas must be in ~/modules/{domain}/schemas.ts
check_pattern 'routers/.*\.ts$' \
  "from ['\"]zod['\"]" \
  'Zod imports are forbidden in router files. Import schemas from ~/modules/{domain}/schemas.ts.'

# Zod imports forbidden in component files — schemas must be in ~/modules/{domain}/schemas.ts
check_pattern '\.(tsx)$' \
  "from ['\"]zod['\"]" \
  'Zod imports are forbidden in components. Import schemas from ~/modules/{domain}/schemas.ts.' \
  '(__tests__|\.test\.|\.spec\.)'

# Custom components in src/app/ — only Next.js route files allowed (page, layout, error, etc.)
# Detect non-standard .tsx files in src/app/ by checking the filename is not a known route file
if [[ "$FILE_PATH" =~ src/app/.*\.tsx$ ]] && [[ "$TOOL_NAME" = "Write" ]]; then
  BASENAME=$(basename "$FILE_PATH" .tsx)
  case "$BASENAME" in
    page|layout|loading|error|not-found|global-error|template|default|opengraph-image|icon|apple-icon) ;;
    *) echo "Blocked: Custom components are forbidden in src/app/. Move to src/modules/ and import from the barrel." >&2; exit 2 ;;
  esac
fi

exit 0
