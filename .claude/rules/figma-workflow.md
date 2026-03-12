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
- **Interactive placeholders**: tooltips, accordions, or other interactive elements without defined content → use lorem ipsum
- **Spacing & margins**: check DSFR spacing classes (`fr-mb-1w`, `fr-mt-3w`, etc.) match the design
- **Element order**: verify the DOM order matches the visual order in the design

## Design errors

- If **illogical or inconsistent elements** appear in the design, do **NOT** implement them
- **Notify the user** about the inconsistency and ask how to proceed
- Examples: duplicate elements, contradictory states, impossible layouts

## Tooling

- Always use the **`figma-dev`** MCP server (`get_figma_data`) to fetch design data
- Use `search_components` and `get_component_doc` from the **`dsfr`** MCP to verify component structure
- When Figma data is too large, search for key text content (labels, headings) to understand structure
