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
