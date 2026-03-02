---
paths:
  - "src/**/*.scss"
  - "src/**/*.tsx"
---

# Styling & DSFR

## One component = one SCSS module

If custom styles are needed, create `Component.module.scss` next to the component file.
Never share SCSS modules across unrelated components.

## DSFR first

Before writing custom CSS, check if the DSFR already provides the utility:
- Layout: `fr-grid-row`, `fr-col-*`
- Spacing: `fr-mt-*`, `fr-py-*`, `fr-mb-*`
- Typography: `fr-text--*`, `fr-h1`..`fr-h6`
- Colors: CSS custom properties `var(--background-default-grey)`, `var(--text-title-grey)`

Use `get_component_doc` or `search_components` from the DSFR MCP to verify classes.

## No raw rgba() / hex colors

Always use DSFR color tokens (`var(--text-default-grey)`, `var(--background-action-high-blue-france)`, etc.).
Never hardcode `#hex` or `rgba()` values.

## No hardcoded breakpoints

Use DSFR SASS mixins: `@include respond-from(md)`, `@include respond-to(sm)`.
Never write raw `@media (max-width: 768px)`.

### SCSS Modules & DSFR SASS

`next.config.js` auto-injects DSFR mixins via `sassOptions.additionalData`. No manual import needed.

| Mixin | Media query | Usage |
|---|---|---|
| `@include respond-from(md)` | `min-width: 48em` | Mobile-first (preferred) |
| `@include respond-to(sm)` | `max-width: 47.98em` | Desktop-first (fallback) |

**Breakpoint tokens:** `xs` (0), `sm` (36em), `md` (48em), `lg` (62em), `xl` (78em)

## DSFR runtime

- **Assets**: copied to `public/dsfr/` by `scripts/copy-dsfr.js` (git-ignored, regenerated on `dev`/`build`). Never import DSFR CSS via webpack.
- **JS**: loaded via `<Script type="module" strategy="beforeInteractive">`. Handles modals, dropdowns, theme toggle, keyboard navigation. Never duplicate this logic in React — use `data-fr-*` attributes.
- **Dark mode**: `data-fr-scheme="system"` on `<html>`, cookie `fr-theme` read by inline script to avoid flash, `ThemeModal` for user toggle.
- **Icons**: `fr-icon-{name}-{fill|line}` classes. Always `aria-hidden="true"` on decorative icons.

## MCP DSFR (mandatory)

Before writing any DSFR HTML, use `get_component_doc` or `search_components` from the DSFR MCP to verify the correct structure. Never guess DSFR classes from memory.
