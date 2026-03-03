---
name: audit-rgaa
description: Deep RGAA/WCAG 2.1 AA accessibility audit with auto-fix
---

# /audit-rgaa

Perform a comprehensive accessibility audit against all 13 RGAA themes.

## Arguments

$ARGUMENTS — optional: specific files, modules, or routes to audit. If empty, audit all changed files on the current branch.

## Instructions

### Step 1 — Identify scope

If no arguments provided, detect changed files:
```bash
git diff origin/master...HEAD --name-only -- '*.tsx'
```

If arguments provided, resolve the file paths.

### Step 2 — Audit (parallel agents)

Split the files into batches of ~10 and launch parallel agents. Each agent:

1. Reads each file in its batch
2. Checks against all 13 RGAA themes documented in `.claude/agents/rgaa-auditor/AGENT.md`
3. Reports findings with `[SEVERITY] RGAA-{theme}.{criterion} file:line — description`

The RGAA auditor agent checks:
- **Theme 1**: Images — `next/image` mandatory (raw `<img>` forbidden), alt, decorative, icon accessibility
- **Theme 2**: Frames — iframe titles
- **Theme 3**: Colors — color-only information, contrast via DSFR tokens
- **Theme 5**: Tables — caption, th scope, no layout tables
- **Theme 6**: Links — descriptive text, NewTabNotice for target="_blank"
- **Theme 7**: Scripts — keyboard access, no onClick on non-interactive elements
- **Theme 8**: Required elements — lang, title, heading hierarchy
- **Theme 9**: Structure — landmarks, no redundant roles, lists
- **Theme 10**: Presentation — no inline styles, responsive
- **Theme 11**: Forms — labels, required, error messages, fieldset/legend
- **Theme 12**: Navigation — skip links, aria-current, focus order, visible focus
- **Theme 13**: Consultation — no unexpected context changes

### Step 3 — Auto-fix

Fix all `[ERROR]` findings automatically:
- Missing `<label>` → add `<label htmlFor="...">` with matching `id`
- Raw `<img>` → replace with `import Image from "next/image"` + `<Image>`
- Missing `alt` → add descriptive `alt` (or `alt=""` if decorative)
- Missing `aria-hidden="true"` on decorative icons → add it
- Missing `<NewTabNotice />` → import and add after link text
- Redundant `role` → remove it
- `tabindex > 0` → remove or set to `0`
- Missing `<fieldset>` + `<legend>` → wrap form groups

For `[WARN]` findings, list them and ask the user which to fix.

### Step 4 — Validate

Run validation to ensure fixes don't break anything:
```bash
pnpm typecheck && pnpm test
```

### Step 5 — Report

```
## RGAA Audit: [PASS | NEEDS WORK | MINOR]

### Errors (auto-fixed)
| RGAA | File:Line | Issue | Fix Applied |
|---|---|---|---|
| 11.1 | Form.tsx:42 | Missing label | Added <label htmlFor="email"> |

### Warnings (need review)
| RGAA | File:Line | Issue | Suggested Fix |
|---|---|---|---|
| 6.1 | Card.tsx:18 | Non-descriptive link text | Rewrite link text |

### Summary
- X errors auto-fixed
- Y warnings for review
- Z files audited across {N} RGAA themes
```

### Lighthouse confirmation (if dev server is running)

If `pnpm dev` is running on port 3000, also run:
```bash
pnpm test:lighthouse
```
Lighthouse accessibility must score **100%**.
