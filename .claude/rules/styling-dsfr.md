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

## No raw rgba() / hex colors (enforced by hook)

Always use DSFR color tokens (`var(--text-default-grey)`, `var(--background-action-high-blue-france)`, etc.).
Never hardcode `#hex`, `rgb()`, or `rgba()` values in SCSS or TSX files.

Common token families:
- **Backgrounds**: `var(--background-default-grey)`, `var(--background-alt-blue-france)`, `var(--background-contrast-grey)`
- **Text**: `var(--text-title-grey)`, `var(--text-default-grey)`, `var(--text-mention-grey)`, `var(--text-action-high-blue-france)`
- **Borders**: `var(--border-default-grey)`, `var(--border-action-high-blue-france)`
- **Artwork/icons**: `var(--artwork-major-blue-france)`, `var(--artwork-minor-blue-france)`
- **Shadows**: `var(--raised-shadow)`, `var(--overlap-shadow)`, `var(--lifted-shadow)`
- **Status**: `var(--text-default-error)`, `var(--background-flat-error)`, `var(--text-default-success)`

**Exception**: `@react-pdf/renderer` cannot use CSS variables. PDF style files (`pdfStyles.ts`) use hex constants named after their DSFR token equivalents, with inline comments documenting the mapping.

## No hardcoded fontFamily

Never set `font-family` in SCSS or component styles — DSFR's Marianne font is inherited from the root `<html>` element.
Use DSFR typography utility classes (`fr-text--*`, `fr-h1`..`fr-h6`) or the inherited font stack.

**Exception**: PDF rendering (`@react-pdf/renderer`) requires explicit font names since it cannot access browser fonts.

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
