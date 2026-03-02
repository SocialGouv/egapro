---
paths:
  - "src/**/*.tsx"
---

# React Components

## No logic in JSX

Extract conditions, computations, and transformations **before** the return statement.
Ternaries in JSX are acceptable only for simple show/hide (`{condition && <X />}`).

```tsx
// FORBIDDEN
return <div>{items.filter(i => i.active).map(i => <span key={i.id}>{i.name.toUpperCase()}</span>)}</div>

// CORRECT
const activeItems = items.filter(i => i.active);
return <div>{activeItems.map(i => <ActiveItem key={i.id} item={i} />)}</div>
```

## No inline SVG (blocked by hook)

Never paste raw `<svg>` markup in `.tsx` components — the edit will be rejected.
Place all SVG files in `public/assets/` and reference them via `<img src="/assets/icon.svg" alt="..." />` or use DSFR icon classes (`fr-icon-*`).

## .map() over 5 lines

If a `.map()` callback exceeds 5 lines of JSX, extract it to a named sub-component.

## No common.module.scss

Never import from a shared `common.module.scss`. Each component must have its own scoped SCSS module if custom styles are needed.

## Component naming

Name components after **what they display**, not where they sit in the tree.
`DeclarationSummaryCard` not `LeftPanelCard`.
