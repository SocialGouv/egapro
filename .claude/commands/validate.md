# Validate

Run all quality checks to ensure the codebase is clean.

## Instructions

Run the following checks in order and report all errors:

1. **Lint + format** (auto-fixed by hook, but verify):
   ```bash
   pnpm lint:check
   pnpm format:check
   ```

2. **TypeScript type checking**:
   ```bash
   pnpm typecheck
   ```

3. **Unit tests**:
   ```bash
   pnpm test
   ```

If any check fails, fix the issues and re-run until all checks pass.
Report a summary of results at the end.
