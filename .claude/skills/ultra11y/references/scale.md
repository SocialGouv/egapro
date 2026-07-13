# Audit at scale — focus smartly

You never audit "all" of a huge repo. The engine reads only the **markup** (HTML/JSX/Vue/
Svelte/Astro), streams it (bounded memory, one file at a time, the `Doc` is dropped after use),
and you **focus** it. Recommended loop:

## The loop

1. **Map without loading everything.** The engine ignores `node_modules`, `.git`, `dist`,
   `build`, `.next`, `out`, `coverage`, `audits` by default, and skips **test/spec/story
   markup** (`*.test.*`, `*.spec.*`, `*.stories.*`, `__tests__/`, `__mocks__/`,
   `.storybook/`) — bad-by-design fixtures, never shipped UI (the drop count is logged).
   Pass `--no-default-excludes` to include them, or name a file / `--include` it directly to
   re-admit. Narrow further:
   ```
   node scripts/ultra11y.mjs audit "apps/web/**/*.{html,tsx}" --json > audit.json
   ```
2. **Pick the slice that matters.** Three levers, most targeted to broadest:
   - **The diff** (hooks/CI, PR review): `--changed` (vs `HEAD`) or `--since <ref>` — audits
     only the changed markup files (via `git diff`, no tree walk).
   - **Shared templates/components first**: the engine **prioritizes** layouts, templates,
     entry pages, then `components/`, `shared/`, `ui/`, `design-system/`, then leaves. A partial
     run therefore covers the highest-impact markup first.
   - **An explicit cap**: `--max-files <n>` bounds the number of files audited (highest-priority
     first); truncation is **always logged** (never a silent drop) and recorded in the report.
3. **De-duplicate the repetitive.** An identical component repeated N times is audited **once**
   (`--dedup exact` by default; `normalized` ignores inter-tag whitespace; `off` disables). The
   report cites the canonical file.
4. **Audit → fix → re-audit → widen.** On the chosen slice: read the `AuditResult`, complete the
   judgment, apply the fixes (`references/fix.md`), re-audit to prove no regression, then widen
   the scope.

## Why it is safe at scale

- **Bounded memory**: file-by-file stream; only the finding count (not source size) stays in
  memory.
- **Deterministic**: stable order (priority then path) → reproducible audits, stable canonical
  file choice, `check:build` holds.
- **Incremental**: `--changed`/`--since` make the audit proportional to the diff, not the repo —
  what makes hooks/CI viable (see `references/automation.md`).

> In `--changed` mode, de-duplication is disabled: a changed file is always audited, never
> merged with a file that was not read.
