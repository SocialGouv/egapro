# Figma Workflow

When implementing from a Figma design, follow this phased approach strictly.

---

## Phase 1 — Overview (new screens only)

When multiple screens need to be created:

- Do **NOT** dive into screen details immediately
- Focus on **navigation flow** between screens and **shared components**
- Draft the navigation structure and identify common components first
- Only then proceed to Phase 2

## Phase 2 — Screen-by-screen implementation

- Process screens **one at a time** to avoid context saturation
- Only move to the next screen after the current one is fully complete
- If screens already exist in the app, skip Phase 1 and start here

## Phase 3 — Per-screen rules (pixel perfect)

For each screen, ensure:

- **Exact placement**: elements must be positioned exactly as in the design
- **Correct text styles**: use the right DSFR text classes (`fr-h1`, `fr-text--sm`, `fr-text--xs`, etc.)
- **No missing elements**: every element from the design must be present
- **Interactive placeholders**: tooltips, accordions, or other interactive elements without defined content -> use lorem ipsum
- **Spacing & margins**: check DSFR spacing classes (`fr-mb-1w`, `fr-mt-3w`, etc.) match the design
- **Element order**: verify the DOM order matches the visual order in the design

### Visual fidelity checklist (mandatory per element)

For **every** element in the Figma tree, check these properties — not just structure:

#### 1. Text color

Read the `fill` color from Figma nodes. If it differs from the default (`#161616`), apply the matching DSFR class. **Always validate the exact class name** against the DSFR MCP (`get_color_tokens`) or the actual CSS in `public/dsfr/` — never guess class names.

Common pitfalls:
- **Wrong class name**: e.g., `fr-text--mention-grey` does not exist, the correct class is `fr-text-mention--grey`
- **Missing CSS file**: DSFR utility classes (colors, spacing) live in separate CSS files (e.g., `utility/colors/colors.min.css`) that may not be loaded in `layout.tsx`. A correct class with a missing CSS file silently fails.

#### 2. Font size

Read `fontSize` from the Figma node's `textStyle`. Map to the correct DSFR class:

| Figma px | DSFR class | Note |
|---|---|---|
| 12px | `fr-text--xs` | |
| 14px | `fr-text--sm` | |
| 16px | *(none)* | Default body size |
| 18px | `fr-text--lg` | |
| 20px | `fr-text--xl` | |

**Never assume a size** — always verify from the Figma node.

#### 3. Font weight (critical — never skip)

**Every text node's font weight must be replicated exactly.** This is one of the most commonly missed properties. Read the `fontWeight` or `textStyle` name from the Figma node:

- `fontWeight` >= 600 or textStyle containing "Bold"/"SemiBold" → wrap in `<strong>`, `<b>`, or use `fr-text--bold`
- `fontWeight` < 600 or textStyle containing "Regular"/"Normal" → no bold wrapper

**Do not assume any cell, label, or value is regular weight by default** — always check the Figma data.

**Figma API limitations**: the API only exposes the *dominant* style of a text node. Character-level overrides (e.g., a bold number inside a regular sentence) are invisible. When the API shows `Regular` but bold is plausible, **always download a screenshot** (`get_screenshot`) to verify visually.

**Tables and data grids**: always download a screenshot and verify bold **cell-by-cell**. Common bold patterns:
- Summary/total columns or rows
- Row labels (first column)
- Computed values (percentages, gaps, scores)
- Do not assume only headers are bold — data cells are often bold too

#### 4. Exact text content

Copy text **verbatim** from Figma (after fixing typos). Never paraphrase, summarize, or approximate.

Example: if the design says *"X, Y et Z"*, do not write *"X, Y, Z"*.

#### 5. Component structure

Never assume a design system component's internal structure. Always verify with `get_component_doc` from the DSFR MCP before writing HTML.

Example: a callout might look like it has a separate `<h3>` title, but the DSFR spec may expect inline bold text within a `<p>`.

#### 6. Element position relative to siblings

Check the Figma y-coordinate order. If an element appears between a title and a table in Figma, it must be between them in the DOM.

Consider that components may encapsulate siblings: if a title is inside a component, content placed "below the title" may need to go inside that component too.

#### 7. Spacing between elements

For **every pair of adjacent elements**, compare the Figma spacing with the code's margin/gap:

1. **Read Figma spacing**: fetch the parent frame with `get_design_context` and read its `itemSpacing` / `gap`
2. **Map to DSFR**: `1w` = 8px, `2w` = 16px, `3w` = 24px, `4w` = 32px, `5w` = 40px
3. **Verify the CSS value**: check in `public/dsfr/dsfr.css` — never guess (e.g., `3w` = 24px, not 12px)
4. **Flex vs. normal flow**: in flex containers, margins **add to** gap (no collapsing). In normal flow, vertical margins collapse to `max(top, bottom)`. A `margin-top: 32px` child inside a `gap: 24px` flex parent = 56px total, not 32px.
5. **Nesting groups**: Figma often groups elements with different gap values (e.g., table + source in a group with 8px gap, inside a container with 24px gap). The code must reproduce this nesting.
6. **Design system default margins**: framework components (stepper, breadcrumb, etc.) have built-in margins from CSS. Removing a utility class (e.g., `fr-mb-3w`) doesn't remove the base margin — use `fr-mb-0` to explicitly zero it.

#### 8. Nested styling

When a sentence contains mixed styles (e.g., *"écart de **4,5 %**"*), the bold portion must be wrapped in `<strong>`. Do not flatten styles.

#### 9. No phantom elements

Do not add elements (tooltips, icons, decorations) that are not present in the Figma design. Every element must have a corresponding Figma node.

---

## Per-screen verification method (mandatory)

When comparing a Figma screen to existing code, **never** rely on a flat text extraction (`text:` lines). Instead:

1. **Fetch the content frame** with full depth via `get_design_context`
2. **Walk the node tree top-to-bottom**, listing every visible element in order: headings, paragraphs, alerts, tables, source lines, accordions, buttons, etc.
3. **Build a structural checklist** — one line per element with its type, text, and position relative to siblings
4. **Compare element-by-element** against the current code's JSX, checking:
   - Is every Figma element present in the code?
   - Is the order identical?
   - Are conditional elements correctly scoped?
5. **Flag every discrepancy** before writing any code

This prevents missing structural elements (alert blocks, source lines, description paragraphs) that a flat text search would overlook.

---

## Phase 4 — Visual validation (mandatory)

After implementing each screen, **visually verify** the result against the Figma design.

### Method A — Browser tool (preferred)

If a browser MCP is available (Playwright, next-devtools `browser_eval`, etc.):

1. **Navigate** to the page in the dev server
2. **Take a screenshot** of the rendered page
3. **Download the Figma screenshot** via `get_screenshot`
4. **Compare side-by-side** against the checklist below
5. **Fix discrepancies** before moving to the next screen

### Method B — Manual review (fallback)

If no browser tool is available:

1. **Ask the user to take a screenshot** of the rendered page
2. **Download the Figma screenshot** via `get_screenshot`
3. **Compare both images** against the checklist below
4. **Fix discrepancies** before moving to the next screen

### Validation checklist

- Text colors match (grey text is actually grey, not default black)
- Bold text renders as bold (especially numbers, percentages, computed values)
- Element order matches (titles before content, notes in correct position)
- Spacing between sections matches the design
- No extra or missing elements (phantom tooltips, missing labels)
- Design system component margins are correctly overridden when needed

This step catches issues that code review alone misses: wrong CSS class names (that silently fail), incorrect element nesting, and spacing problems.

---

## Design errors & typos

- If **illogical or inconsistent elements** appear in the design, do **NOT** implement them
- **Notify the user** about the inconsistency and ask how to proceed
- Examples: duplicate elements, contradictory states, impossible layouts
- If the design contains **spelling mistakes** (e.g., "horraire" instead of "horaire"), fix them silently in the code — do not reproduce typos

---

## Tooling

- Always use the **`figma`** MCP server (`get_design_context`) to fetch design data
- Use `search_components` and `get_component_doc` from the **`dsfr`** MCP to verify component structure
- When Figma data is too large, **do NOT fall back to flat text extraction**. Instead, fetch child nodes individually and walk the tree structure to build the element checklist described above
- Use `get_screenshot` to get PNG screenshots for visual comparison (especially for tables, bold verification, and Phase 4 validation)
