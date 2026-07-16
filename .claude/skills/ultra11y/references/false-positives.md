# Known false-positive traps — what to scrutinise before trusting a finding

The static engine reads SOURCE, not the rendered DOM. On component-based code that
creates a few predictable false-positive (FP) classes. The engine now **auto-suppresses**
most of them; this page tells you (the agent) where it still cannot be sure, so you can
**confirm or refute** instead of trusting blindly. Run the refutation loop:
`verify --report <md> [--semantic]` → rule each item against the cited `file:line` →
`verify --apply <verdicts.json>` (refuted/unsupported entries fail the gate).

## How the engine already protects you

- **Components are skipped.** A PascalCase tag (`<Button>`, `<HistoryEntry>`) keeps its
  case in JSX **and** in `.vue/.svelte/.astro` (parsed with case preserved). Single-file
  rules only fire on intrinsic HTML tags, so a component child of `<ul>`, a `<Select>`,
  or a `role` prop on `<UChatMessage>` is no longer mis-flagged.
- **Injected content is not "empty".** A `<slot>`, `{@render children()}`, `{children}`,
  or a child component means the name/content/options may be supplied at runtime —
  `empty-heading`, `button-empty-name`, `link-empty-name`, `select-has-option`,
  `list-structure`, `data-table-no-headers` and `h1-missing` all bail instead of asserting.
- **Dynamic bindings/values count as present, never invalid.** `:aria-label`,
  `v-bind:aria-label`, `bind:value`, `:alt`, `:scope` (Vue/Svelte/Alpine) are read as
  "present, value unknown"; a dynamic `role={…}` is skipped (not parsed as a bogus role);
  a `v-bind="…"` / `{...rest}` / `{shorthand}` spread suppresses missing-name/label/alt.
- **Cross-file references resolve under `--graph`.** An `aria-controls`/`for`/heading
  target defined in another file (including a `const X = "id"; id={X}`) is proven to exist
  and the finding is suppressed; an icon-only component whose definition supplies its own
  `aria-label` is not flagged "unnamed". **Always run component code with `--graph`.**
- **Conditional branches & interleaved components aren't crossed.** Headings in different
  arms of `{cond ? … : …}` are mutually exclusive, and a child component between two
  headings may inject an intermediate one — so `heading-order-skip` won't compare across them.
- **Framework shell templates are recognized.** A SPA mount shell (`<div id="app"></div>`)
  or a build placeholder (`%sveltekit.body%`/`%sveltekit.head%`, `{{ }}`, `<%= %>`) means
  the real content/title is injected later — `h1-missing`/`title-missing-empty` don't fire.
- **Slot-projected required content is not "missing".** A `<slot>`/`{@render children()}`
  passthrough suppresses `fieldset-legend-missing` and `aria-required-children`; `<th>` in a
  `<thead>` carries implicit column scope.
- **Test/story markup is out of scope by default.** `*.test.*`, `*.spec.*`, `*.stories.*`
  and `__tests__/` are excluded (bad-by-design fixtures). Re-include with
  `--no-default-excludes` or by naming the file.

## Where the AI agent must still adjudicate

A finding's `preliminary: true` (in `--json`) and a `scope.sourceTemplate` / `scope.rendered`
caveat in the report mean **the verdict is provisional** — the AI agent confirms it against the
rendered output (rendering criteria go to `scan`), recording a verdict either way.

| Rule / situation | Why it may still be wrong | How to confirm or refute |
|---|---|---|
| Any finding on `.vue/.svelte/.astro` SOURCE | Slots, snippets, `{#if}`, `v-for`, scoped logic and provide/inject are invisible to the template parser | Audit the **rendered** HTML (Storybook/build output) or `scan` a live page; refute the source finding if the rendered DOM is conformant |
| Any finding on library-rendered JSX (DSFR/MUI…) | The component's produced HTML lives in `node_modules` | `render` → build/SSR → `audit` the output, or `scan` |
| `control-label-missing` in an SFC | The label may be wired via provide/inject or a sibling `<Label>` component the parser can't link | Read the form component + its field wrapper; refute if a programmatic label exists at render |
| `heading-order-skip` via `{#if}`/`v-if` in SFCs (no AST) | SFC conditionals are opaque text, so arms can't be separated like in JSX | Reason about each render path; flag only a skip that occurs in a single path |
| `contrast` (1.4.3), focus, zoom, reflow | Needs computed styles | `scan` (Docker tier) — never decide from source |
| `aria-*` referencing a runtime-built id (`id={`\`x-${i}\``}`) | The id is dynamic; cross-file resolution only handles `const` string ids | Read the component; refute if the id is generated and wired correctly |

## Normativity false positives — a "problem" with no failing normative test

A finding can cite a real element yet still not be a **non-conformity**, because no test of
the active standard actually fails. These were the professional-auditor + official-Ara
corrections against ultra11y's own RGAA audit of egapro; each is now handled as a
**recommendation (non-normative)** or suppressed outright — never a normative NC.

| Case | Why it is NOT an NC | Current handling |
|---|---|---|
| An **empty `<th>`** (layout/spacer header cell) | No RGAA/WCAG test says every `<th>` must have content; a best-practice-only axe `empty-table-header` violation carries no `wcag*` tag | merges as **advisory**, attaches to no criterion as NC |
| A **download link** (`…report.pdf`) whose text doesn't name the format/weight | Good practice (DSFR), but no failing normative test under 6.1/2.4.4 | the RGAA `download-link-format` pack rule is **`advisory: true`** → « Recommandation (non normative) », never flips 6.1 |
| **Two `<h1>`** on a page / a page **starting at `<h2>`** | "one `<h1>` per page" is not a rule in HTML, a11y, or SEO; no heading-order skip occurs | `h1-multiple` / `h1-missing` are **advisory** (no normative NC) |
| A **lorem-ipsum tooltip** | Content-quality (UX), not accessibility | emits **no finding** |

The distinction is the same one you apply in the judgment phase (`references/judgment.md`):
an **NC needs a `normativeRef`** citing the precise failed test of the active standard; a
good practice without one is a `recommendations[]` entry, and a pure UX concern is neither.
When you adjudicate, don't "promote" a recommendation to an NC to look thorough.

## The rule of thumb

The engine raises **confirmed candidates**, never silent conformance. When a finding is
`preliminary`, or sits on SFC/library source, treat it as "verify, don't trust": open the
`file:line`, check whether the missing thing is injected/rendered elsewhere, and record a
`supported`/`refuted` verdict via `verify --apply`. A refuted finding is dropped — that is
the anti-hallucination contract working as intended.
