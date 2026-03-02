---
name: audit-secu
description: Deep OWASP Top 10 + RGS security audit with auto-fix
---

# /audit-secu

Perform a comprehensive security review against OWASP Top 10 and French government standards (RGS).

## Arguments

$ARGUMENTS — optional: specific files, modules, or routes to audit. If empty, audit all changed files on the current branch.

## Instructions

### Step 1 — Identify scope

If no arguments provided, detect changed files:
```bash
git diff origin/master...HEAD --name-only -- '*.ts' '*.tsx'
```

If arguments provided, resolve the file paths.

### Step 2 — Audit (parallel agents)

Launch parallel agents by domain:

**Agent 1 — Server code** (files in `src/server/`):
Delegate to security-auditor agent (`.claude/agents/security-auditor/AGENT.md`).
Focus on: A01 (access control), A03 (injection), A07 (auth), A08 (data integrity).

**Agent 2 — Client code** (files in `src/modules/`, `src/app/`):
Check for: A02 (secrets in client code), A03 (XSS, dangerouslySetInnerHTML), process.env usage.

**Agent 3 — Configuration** (next.config.js, env.js, middleware):
Check for: A05 (security headers, CORS), A10 (SSRF, open redirects).

**Agent 4 — Dependencies**:
```bash
pnpm audit --json 2>/dev/null | head -100
```
Check for known vulnerable packages (A06).

### Step 3 — Auto-fix

Fix `[CRITICAL]` and `[HIGH]` findings automatically:
- `process.env` direct access → replace with `import { env } from "~/env.js"`
- Missing Zod input validation → add Zod schema
- `publicProcedure` on protected route → change to `protectedProcedure`
- Missing ownership check → add `where(eq(userId, ctx.session.user.id))`
- `dangerouslySetInnerHTML` without sanitization → add DOMPurify or remove
- String concatenation in SQL → use Drizzle query builder
- Missing transaction on multi-write → wrap in `db.transaction()`

For `[MEDIUM]` and `[LOW]` findings, list them and ask the user which to fix.

### Step 4 — Validate

Run validation to ensure fixes don't break anything:
```bash
pnpm typecheck && pnpm test
```

### Step 5 — Report

```
## Security Audit: [SECURE | VULNERABLE | HARDENING NEEDED]

### Critical / High (auto-fixed)
| OWASP | File:Line | Vulnerability | Fix Applied |
|---|---|---|---|
| A01 | router.ts:42 | Missing ownership check | Added userId filter |

### Medium / Low (need review)
| OWASP | File:Line | Issue | Recommendation |
|---|---|---|---|
| A05 | next.config.js:15 | Missing CSP header | Add Content-Security-Policy |

### Dependency Audit
| Package | Severity | Advisory | Action |
|---|---|---|---|
| example@1.0 | High | CVE-2024-XXX | Upgrade to 1.1 |

### Summary
- X critical/high issues auto-fixed
- Y medium/low issues for review
- Z dependencies checked
- {N} files audited
```
