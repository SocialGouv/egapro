# Write / review accessible HTML/CSS (without regressions)

Doctrine: **semantic native HTML first, ARIA last** (native-first, ARIA last). Add ARIA
only when no native element fits, and never duplicate implicit semantics (see
`references/forbidden-patterns.md`).

## Review loop

1. **Structure & landmarks** — a single `<main>`, `<header>/<nav>/<footer>`, `h1…h6`
   headings without level skips, real lists (`ul/ol/dl`).
2. **Accessible names** — every link/button has a label; every field has an associated
   `<label>` (not just a `placeholder`).
3. **Images & icons** — relevant `alt` if informative, `alt=""` if decorative, a name on
   icon-only controls.
4. **Tables** — `<caption>`, `<th scope>`, cell↔header association.
5. **Keyboard** — everything reachable and operable by keyboard; no positive `tabindex`;
   visible focus (verify at render); a working skip link.
6. **Language & title** — `<html lang>`, a relevant `<title>`, language changes marked.

## Catch regressions early

Before shipping the code, audit the snippet:
```
node scripts/ultra11y.mjs audit - < component.html
node scripts/ultra11y.mjs audit "src/components/**/*.tsx" --jsx
```
Fix by priority: native semantics → names/labels → keyboard → focus → meaning not carried
by colour/shape alone → media.

## Definition of Done

A change is "done" when: native semantics are correct, accessible names are present,
keyboard access is preserved, no regression is introduced, and the points not statically
verifiable (contrast, visible focus, zoom) are **flagged as residual risks** rather than
assumed OK.

For the exact meaning of a criterion: `node scripts/ultra11y.mjs criteria <sc>`.
