---
paths:
  - "src/**/*.tsx"
  - "src/**/*.scss"
---

# Figma Workflow

> **Used by**: `code-dev` (quand un ticket cite une URL Figma dans sa section `## Référence Figma`), `architect` (lecture survol des écrans pour découper). Hors pipeline : tout agent implémentant depuis un design Figma. Auto-chargé via `paths:` quand un `.tsx`/`.scss` sous `src/` est lu/édité (travail UI).

When implementing from a Figma design, follow this phased approach strictly. Figma reste la **source unique de vérité visuelle** : pas de mockup HTML intermédiaire, pas de screenshots téléchargés en avance — `code-dev` interroge Figma à la demande via le MCP `figma-dev` au moment de l'implémentation.

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

**Figma API limitations**: the API only exposes the *dominant* style of a text node. Character-level overrides (e.g., a bold number inside a regular sentence) are invisible. When the API shows `Regular` but bold is plausible, **always download a screenshot** (`mcp__figma-dev__download_figma_images`) to verify visually.

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

1. **Read Figma spacing**: fetch the parent frame with `mcp__figma-dev__get_figma_data` and read its `itemSpacing` / `gap`
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

1. **Fetch the content frame** with full depth via `mcp__figma-dev__get_figma_data`
2. **Walk the node tree top-to-bottom**, listing every visible element in order: headings, paragraphs, alerts, tables, source lines, accordions, buttons, etc.
3. **Build a structural checklist** — one line per element with its type, text, and position relative to siblings
4. **Compare element-by-element** against the current code's JSX, checking:
   - Is every Figma element present in the code?
   - Is the order identical?
   - Are conditional elements correctly scoped?
5. **Flag every discrepancy** before writing any code

This prevents missing structural elements (alert blocks, source lines, description paragraphs) that a flat text search would overlook.

---

## Phase 4 — Final verification

L'implémentation pixel-perfect (Phases 1–3) repose sur la **lecture structurelle** de l'arbre Figma via `mcp__figma-dev__get_figma_data` — chaque propriété (color, fontSize, fontWeight, itemSpacing) est mappée à sa classe / token DSFR. Quand cette lecture a été faite proprement, la Phase 4 sert juste à **fermer la boucle** : confirmer que le rendu réel correspond au plan, et produire les artefacts pour la review humaine.

### 1. Sanity check structurel

Reparcourir mentalement la checklist Phase 3 sur l'écran fini : couleurs, fontSize, fontWeight (cell-by-cell sur les tableaux), texte verbatim, ordre des éléments, espacements. Si un doute persiste sur un point d'ambiguïté de l'API (typiquement les overrides char-level de bold dans un tableau), faire un appel ciblé à `mcp__figma-dev__download_figma_images` sur le node concerné pour confirmer visuellement.

### 2. Screenshots dev server pour la review humaine

Avec un browser MCP (Playwright ou next-devtools `browser_eval`) :

1. **Navigate** vers la page dans le dev server
2. **Take a screenshot** du rendu (desktop 1280×800 + mobile 375×667)
3. **Joindre les images au body de la PR** — c'est le signal visuel principal pour le reviewer humain

Si aucun browser MCP n'est dispo, demander à l'utilisateur de fournir le screenshot.

### Points qui échappent souvent à la lecture structurelle seule

- Wrong DSFR class name **qui n'existe pas** (ex : `fr-text--mention-grey` au lieu de `fr-text-mention--grey`) → la classe est silencieusement ignorée, le token attendu n'est pas appliqué. Vérifier dans `public/dsfr/dsfr.css` que la classe existe bien.
- DSFR utility class correcte mais **CSS file pas chargé** dans `layout.tsx` (ex : `utility/colors/colors.min.css`). Confirmer dans le DOM que la prop CSS est bien appliquée.
- Marges par défaut d'un composant DSFR qui s'additionnent à tes utilities (`fr-mb-3w` qui s'ajoute à la marge interne du composant).

Ces 3 cas typiques sont les seuls où un screenshot du rendu apporte une info que la lecture structurelle ne donne pas.

---

## Design errors & typos

- If **illogical or inconsistent elements** appear in the design, do **NOT** implement them
- **Notify the user** about the inconsistency and ask how to proceed
- Examples: duplicate elements, contradictory states, impossible layouts
- If the design contains **spelling mistakes** (e.g., "horraire" instead of "horaire"), fix them silently in the code — do not reproduce typos

---

## Tooling

- Always use the **`figma-dev`** MCP server (`mcp__figma-dev__get_figma_data`) to fetch design data — never the project's HTTP `figma` server (OAuth, broken locally)
- Use `search_components` and `get_component_doc` from the **`dsfr`** MCP to verify component structure
- When Figma data is too large, **do NOT fall back to flat text extraction**. Instead, fetch child nodes individually and walk the tree structure to build the element checklist described above
- Use `mcp__figma-dev__download_figma_images` to get PNG screenshots for visual comparison (especially for tables, bold verification, and Phase 4 validation)
- **Independent verification**: this rule is `code-dev`'s *building* discipline. The rendered result is verified separately by the `design-validator` gate (`rules/visual-quality-validation.md`, `code-dev` step 9a-bis) — render + DOM measurement + onion-skin overlay.
