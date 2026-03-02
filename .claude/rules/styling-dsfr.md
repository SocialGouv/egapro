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
