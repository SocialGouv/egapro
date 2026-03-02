---
description: General code quality rules — always loaded
---

# Code Quality

## Zero suppression comments

Never add `biome-ignore`, `eslint-disable`, `@ts-ignore`, or `@ts-expect-error`.
Fix the underlying issue instead. If a rule is genuinely wrong for the entire project, update the Biome config.

## DRY: 3+ repetitions = extract

If the same logic or markup appears 3 or more times, extract it into a shared function or component.

Common duplication hotspots to watch for:
- **Test mocks** — standard mocks (next/link, next/navigation, server-only) live in `src/test/setup.ts`. Never duplicate them in test files.
- **Constants** — shared domain constants go in the module's `shared/constants.ts`. Never duplicate a constant across multiple files.
- **Validation schemas** — shared Zod schemas go in a module-level file (e.g. `phone.ts`). Never duplicate regex or validation logic.
- **Utility functions** — shared formatting functions (formatSiren, formatPhone, etc.) go in the module's barrel or a shared utils file.

## No useless constants

Do not extract a value into a `const` at module scope unless it is:
- Used in multiple places, OR
- A magic number/string that benefits from a descriptive name

A constant used exactly once right below its definition adds noise, not clarity.

## Imports

- Use the `~/` path alias (mapped to `src/`). Never use relative paths that go up more than one level (`../../`).
- Import from module barrels (`~/modules/layout`), not internal files.

## File size

Keep files under 200 lines. Split at 400. Files over 800 lines are forbidden.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`
- No explicit `any` — use `unknown` + narrowing
- Shared object types in `types.ts` at module level
- Component props: `type Props = { ... }` (never `any`)

## Naming conventions

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `HeaderBrand.tsx` |
| Hook | camelCase + `use` | `useNavigation.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type / Interface | PascalCase | `type UserProfile = ...` |
| Constant | SCREAMING_SNAKE | `const MAX_RETRY = 3` |
| Module folder | camelCase | `modules/layout/` |

## General rules

- **Immutability**: never mutate objects/arrays — always spread (`{ ...obj, key: val }`)
- **Error handling**: always `try/catch` with explicit user-facing error message
- **Input validation**: Zod at system boundaries (forms, route params, API body)

## Environment variables

Declared and validated in `src/env.js` via `@t3-oss/env-nextjs` + Zod. **Never read `process.env` directly** — always `import { env } from "~/env.js"`.

To add a variable: declare in `src/env.js` (`server` or `client` section) + add to `runtimeEnv` + add to `.env` local. Pass `SKIP_ENV_VALIDATION=1` to bypass validation (Docker build, CI without secrets).
