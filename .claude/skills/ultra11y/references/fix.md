# Put the fixes in place — `fix` (hybrid, native-first)

`fix` applies what is **mechanically safe**, prepares what needs a word filled in, and
**proposes** what is judgment — without ever inventing content (anti-hallucination doctrine).
By default it is a **dry-run** (diff); `--write` applies.

```
node scripts/ultra11y.mjs fix "src/**/*.html"            # dry-run: diff + list
node scripts/ultra11y.mjs fix "src/**/*.html" --write     # apply the safe fixes
node scripts/ultra11y.mjs fix --changed --write           # only the git diff
node scripts/ultra11y.mjs fix page.html --only positive-tabindex --write
```

## Three classes of fix

- **auto** — deterministic, no judgment, written as-is:
  `positive-tabindex` (→ `tabindex="0"`), `redundant-aria` (drop the redundant `role`),
  `meta-viewport-zoom-block` (drop blocking `user-scalable=no` / `maximum-scale`).
- **fill-in (placeholder)** — inserts a **valid** attribute with a `TODO` sentinel that **you**
  replace with a relevant, in-context value: `html-lang-missing` (`lang="TODO"`),
  `iframe-title-missing` (`title="TODO"`), `img-alt-missing` (`alt="TODO"` or
  `aria-label="TODO"`), `control-label-missing` (`aria-label="TODO"`).
- **judgment (proposal)** — the engine never fixes on its own: alt relevance (1.1.1), link/
  button purpose (2.4.4/4.1.2), contrast, table/fieldset structure… the AI agent writes the
  content and adjudicates the criterion (`verify --manual`, gated).

## Guarantees

- **Edit by source range**: codemods re-read the opening tag locally (attribute offsets are not
  provided by the parser) and apply edits **back-to-front**; edits that overlap on one element
  are dropped, never misapplied.
- **Anti-regression gate**: after `--write`, the file is re-audited; if a fix **introduced** a
  new non-conformity, it is **not** written.
- **JSX/TSX: safe codemods only.** `.jsx`/`.tsx` parse to a real AST whose offsets index the
  original file, so `fix --write` applies the codemods marked **jsxSafe** (attribute removal /
  insertion of React-valid props) — it never rewrites an attribute name (`tabIndex={5}` is
  never turned into `tabindex="0"`). Only the rare **lossy** fallback (a file the AST parser
  could not parse at all) stays proposal-only.

## Fix order (native-first)

native semantics → accessible names / labels → keyboard access → visible focus → meaning not
carried by colour alone → media. See `references/authoring.md` and
`references/forbidden-patterns.md`. After fixing, re-audit; the AI agent adjudicates the judgment
criteria (`verify --manual`, gated) and the rendering criteria go to `scan` — never marked
conforming without a recorded, gated justification.
