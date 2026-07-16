# Correction phase (put the fixes in place, by priority)

Fix without breaking or inventing anything. Doctrine (native HTML first, smallest possible
change, no regressions) applied in priority order.

## Processing order

1. **🔴 Blocking first**, then 🟠 major, then 🟡 minor — the order of the `prd` backlog and the
   report. On a large repo, handle the shared templates first (layouts, design system): a fix
   there covers the whole site.
2. **Three classes of fix** (`fix`):
   - **auto** — deterministic codemods (positive tabindex, redundant ARIA, blocked zoom); safe
     to apply unsupervised.
   - **placeholder** — inserts a valid attribute with a `TODO` (alt/lang/title/aria-label) that
     you replace with a real, in-context value.
   - **proposal** — judgment only; the engine never invents content (alt text, link purpose,
     table structure) — the AI agent writes it and adjudicates the criterion (`verify --manual`,
     gated).
3. **Conforming / non-conforming examples**: for each pattern, start from the smallest change
   that makes the **rendered** HTML conforming (not just the source). If a library component
   does not instantiate correctly (e.g. an icon-only DSFR button with no `title`), fix at the
   usage site and re-verify on the render.

## Commands

```
node scripts/ultra11y.mjs fix "src/**/*.html"            # dry-run: proposed diff
node scripts/ultra11y.mjs fix "src/**/*.html" --write     # apply (auto+placeholder)
node scripts/ultra11y.mjs fix "src/**/*.tsx"  --write     # real JSX: jsxSafe codemods only
node scripts/ultra11y.mjs fix "src/**" --write --iterate   # re-audit + re-apply to a fixpoint
node scripts/ultra11y.mjs fix "src/**" --only img-alt-missing,positive-tabindex
node scripts/ultra11y.mjs prd  --in audits/audit-latest.json   # prioritized backlog of remaining fixes
```

- **Anti-regression gate**: `--write` applies only if a re-audit proves no new non-conformity
  is introduced (including no new finding type). An invalid placeholder is thus blocked.
- **JSX/TSX**: `fix --write` applies only the safe codemods (remove ARIA, insert valid React
  attributes); it never rewrites an attribute name (no `tabIndex={5}` → `tabindex="0"`). The
  rest stays a proposal.
- After fixing, **loop**: re-audit, re-judge the `proposal`s, until `check`/`verify` are green
  again (see the SKILL's "loop" section).
