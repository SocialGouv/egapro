---
name: validate
description: Run all quality checks (lint, format, typecheck, tests) with parallel agents
---

# /validate

Run all quality checks to ensure the codebase is CI-ready. Includes RGAA and Security audits.

## Instructions

### Phase 1 — Validation (3 parallel agents)

Launch **3 parallel agents** for maximum speed:

#### Agent 1 — Lint + Format
```bash
pnpm lint:check && pnpm format:check
```
Report any errors or warnings.

#### Agent 2 — TypeScript
```bash
pnpm typecheck
```
Report any type errors with file:line references.

#### Agent 3 — Unit Tests
```bash
pnpm test
```
Report any test failures with test names.

### Phase 2 — Audits (2 parallel agents)

Detect changed files:
```bash
git diff origin/master...HEAD --name-only
```

Launch **2 parallel agents**:

#### Agent 4 — RGAA audit
Delegate to `rgaa-auditor` agent (`.claude/agents/rgaa-auditor/AGENT.md`).
Pass all changed `.tsx` files. Auto-fix all `[ERROR]` findings.

#### Agent 5 — Security audit
Delegate to `security-auditor` agent (`.claude/agents/security-auditor/AGENT.md`).
Pass all changed `.ts`/`.tsx` files. Auto-fix all `[CRITICAL]` and `[HIGH]` findings.

### After agents complete

1. If **all 5 pass**: report `PASS` with a one-line summary.
2. If **any fail**: fix the issues, then re-run the failing check(s) only.
3. If Phase 2 auto-fixes were applied → re-run Phase 1 validation.
4. Repeat until all 5 pass.

## Output Format

```
## Validation: [PASS | FAIL]

| Check | Status | Details |
|---|---|---|
| Lint | PASS/FAIL | X warnings, Y errors |
| Format | PASS/FAIL | X files need formatting |
| Typecheck | PASS/FAIL | X errors |
| Tests | PASS/FAIL | X/Y passed |
| RGAA | PASS/NEEDS WORK | X errors, Y warnings |
| Security | SECURE/VULNERABLE | X critical, Y high |
```
