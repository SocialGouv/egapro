---
name: validate
description: Run all quality checks (lint, format, typecheck, tests) with parallel agents
---

# /validate

Comprehensive quality check. Runs all agents, auto-fixes issues, loops until clean.

## Arguments

$ARGUMENTS — optional focus: `rgaa`, `security`, `structure`, or empty for full check.

## Instructions

### Step 1 — Detect scope

```bash
git diff origin/master...HEAD --name-only
```

If no changes vs master, use uncommitted changes:

```bash
git diff --name-only HEAD
```

### Step 2 — Launch agents

**If no argument (full check)** — launch **4 parallel agents**:

1. **Validator** — delegate to `.claude/agents/validator/AGENT.md` (typecheck + test + lint + format)
2. **Structural auditor** — delegate to `.claude/agents/structural-auditor/AGENT.md` on all changed files
3. **RGAA auditor** — delegate to `.claude/agents/rgaa-auditor/AGENT.md` on all changed `.tsx` files. Auto-fix all `[ERROR]` findings.
4. **Security auditor** — delegate to `.claude/agents/security-auditor/AGENT.md` on all changed `.ts/.tsx` files. Auto-fix all `[CRITICAL]` and `[HIGH]` findings.

**If argument = `rgaa`** — launch RGAA auditor only (+ validator after fixes).
**If argument = `security`** — launch Security auditor only (+ validator after fixes).
**If argument = `structure`** — launch Structural auditor only.

### Step 3 — Fix loop

1. If **any agent reports violations**: fix all issues.
2. Re-run **only the failing agents**.
3. If auto-fixes were applied → also re-run validator.
4. **Repeat until zero violations across all agents.**

Never report completion with known violations.

### Step 4 — Report

```
## Validation: [PASS | FAIL]

| Check | Status | Details |
|---|---|---|
| Typecheck | PASS/FAIL | ... |
| Tests | PASS/FAIL | ... |
| Lint + Format | PASS/FAIL | ... |
| Structure | PASS/NEEDS WORK | ... |
| RGAA | PASS/NEEDS WORK | ... |
| Security | SECURE/VULNERABLE | ... |
```

### Lighthouse confirmation (if dev server is running)

If `pnpm dev` is running on port 3000, also run:

```bash
pnpm test:lighthouse
```

Lighthouse accessibility must score **100%**.
