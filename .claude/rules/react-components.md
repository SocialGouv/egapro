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
Place all SVG files in `public/assets/` and reference them via `<Image>` from `next/image`, or use DSFR icon classes (`fr-icon-*`).

## Images: always use `next/image` (blocked by hook)

Raw `<img>` tags are forbidden in `.tsx` files — use `import Image from "next/image"` instead.
Next.js `Image` provides automatic optimization (lazy loading, responsive sizing, format conversion).

```tsx
// FORBIDDEN
<img src="/assets/illustration.svg" alt="Illustration" />

// CORRECT
import Image from "next/image";
<Image src="/assets/illustration.svg" alt="Illustration" width={200} height={150} />
```

- Decorative images: `alt=""`
- Informative images: descriptive `alt` (not "image", "photo", "icon")
- SVG from `public/assets/`: use `width` + `height` props
- Remote images: declare the domain in `next.config.js` `images.remotePatterns`

## Figma assets: always SVG, never PNG/JPG

When extracting illustrations, icons, or graphics from Figma (`get_design_context`), **always export as SVG**.
PNG and JPG raster formats are forbidden for illustrations and icons — they are not scalable and produce larger files.

| Asset type | Format | Where to store |
|---|---|---|
| Illustration / graphic | **SVG** | `public/assets/{module}/` |
| Icon | **DSFR icon class** preferred, SVG fallback | `fr-icon-*` or `public/assets/icons/` |
| Photo (real photograph) | **WebP** (exception: only format where SVG is impossible) | `public/assets/{module}/` |

```tsx
// FORBIDDEN — raster export from Figma
<Image src="/assets/illustration.png" alt="..." width={400} height={300} />

// CORRECT — vector export from Figma
<Image src="/assets/illustration.svg" alt="..." width={400} height={300} />
```

When calling `get_design_context` from the Figma MCP, if the returned asset download URLs point to PNG/JPG:
1. Re-export manually as SVG from Figma, or
2. Ask the user to export the asset as SVG from the Figma file
3. Only accept PNG/JPG for actual photographs that cannot be vectorized

## .map() over 5 lines

If a `.map()` callback exceeds 5 lines of JSX, extract it to a named sub-component.

## No common.module.scss

Never import from a shared `common.module.scss`. Each component must have its own scoped SCSS module if custom styles are needed.

## Component naming

Name components after **what they display**, not where they sit in the tree.
`DeclarationSummaryCard` not `LeftPanelCard`.
