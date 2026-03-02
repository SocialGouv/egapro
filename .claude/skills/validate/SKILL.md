---
name: validate
description: Run all quality checks (lint, format, typecheck, tests) with parallel agents
---

# /validate

Run all quality checks to ensure the codebase is CI-ready.

## Instructions

Launch **3 parallel agents** for maximum speed:

### Agent 1 — Lint + Format
```bash
pnpm lint:check && pnpm format:check
```
Report any errors or warnings.

### Agent 2 — TypeScript
```bash
pnpm typecheck
```
Report any type errors with file:line references.

### Agent 3 — Unit Tests
```bash
pnpm test
```
Report any test failures with test names.

## After agents complete

1. If **all 3 pass**: report `PASS` with a one-line summary.
2. If **any fail**: fix the issues, then re-run the failing check(s) only.
3. Repeat until all 3 pass.

## Output Format

```
## Validation: [PASS | FAIL]

| Check | Status | Details |
|---|---|---|
| Lint | PASS/FAIL | X warnings, Y errors |
| Format | PASS/FAIL | X files need formatting |
| Typecheck | PASS/FAIL | X errors |
| Tests | PASS/FAIL | X/Y passed |
```
