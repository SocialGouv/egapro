---
paths:
  - "src/**/*.tsx"
  - "src/**/*.scss"
---

# Figma Workflow

> **Used by**: `code-dev` (quand un ticket cite une URL Figma dans sa section `## Référence Figma`), `architect` (lecture survol des écrans pour découper). Hors pipeline : tout agent implémentant depuis un design Figma. Auto-chargé via `paths:` quand un `.tsx`/`.scss` sous `src/` est lu/édité (travail UI).

When implementing from a Figma design, follow this phased approach. Figma reste la **source unique de vérité visuelle** : pas de mockup HTML intermédiaire, pas de screenshots téléchargés en avance — `code-dev` interroge Figma à la demande via le serveur MCP **officiel `figma`** au moment de l'implémentation.

---

## Serveur & outils

Le seul serveur Figma branché est l'**officiel `figma`** (`https://mcp.figma.com/mcp`, OAuth). Il est **authentifié** (compte Figma Dev enterprise, seat développeur) et fonctionne **headless à partir d'une URL node-id** — pas besoin de l'app desktop. C'est le **seul** serveur Figma du repo ; aucune référence historique à un serveur Figma local ou tiers (type Framelink) n'est valide.

Chaque outil prend `fileKey` + `nodeId`, extraits de l'URL : `figma.com/design/:fileKey/:name?node-id=X-Y` → `fileKey = :fileKey`, `nodeId = X:Y` (convertir le `-` en `:`).

| Outil | Rôle |
|---|---|
| `mcp__figma__get_metadata` | **Carte structurelle** d'un frame (ids/types/noms/positions/tailles, en XML). Sert à naviguer un grand écran et choisir les node-ids enfants à détailler. **Jamais sur une page entière** (un node de page peut faire >200 k caractères → overflow). Sans `nodeId` → liste les pages du fichier. |
| `mcp__figma__get_design_context` | **Outil principal.** Rend un **code de référence** (React+Tailwind par défaut) **+ la map des tokens inline + un screenshot + la doc du composant Figma + les URLs des assets**. ⚠️ Ce code est une **référence à traduire** (voir la règle d'or plus bas), jamais à coller. |
| `mcp__figma__get_variable_defs` | Map des variables/tokens d'un node **par leur nom** (ex : `$background-action-high-blue-france` → `#000091`). C'est le pont direct vers DSFR. ⚠️ Appeler sur un node **layer/composant précis**, pas une page/canvas (sinon erreur « nothing selected »). |
| `mcp__figma__get_screenshot` | PNG du node — renvoie une **URL courte + instructions curl** (économe en tokens ; `enableBase64Response` seulement si le curl est impossible). Pour la vérif visuelle ciblée (bold char-level, tableaux, éléments fantômes). `maxDimension` cap le côté long. |

> **Pas de Code Connect ici.** `get_code_connect_map` renvoie `{}` : les composants DSFR vivent dans des bibliothèques **partagées (État)** qu'egapro consomme sans les posséder — on ne peut pas y attacher de mapping. La correspondance node Figma → classe DSFR passe donc par la **traduction** ci-dessous, pas par Code Connect.

Toujours **valider** un nom de classe / la structure d'un composant DSFR via le MCP `dsfr` (`get_component_doc`, `search_components`, `get_color_tokens`) ou le CSS réel dans `public/dsfr/` — jamais deviner.

---

## Règle d'or : le code de `get_design_context` est une RÉFÉRENCE À TRADUIRE, pas à coller

`get_design_context` sort du **React+Tailwind avec des valeurs en dur** (`bg-[#000091]`, `px-[24px]`, `py-[10px]`, `text-[18px]`, `leading-[28px]`). L'outil lui-même le rappelle : *« SUPER CRITICAL: the generated React+Tailwind code MUST be converted to match the target project's styling system. »*

egapro est en **DSFR vanilla** (`@gouvfr/dsfr`, classes `fr-*` en markup, pas de wrapper React) → **ne jamais garder de Tailwind / px / hex brut**. Traduire chaque propriété :

- **Couleur / espacement / typo** → prendre le **nom du token** via `get_variable_defs` (ex : `$background-action-high-blue-france`) et le mapper vers la custom property DSFR (`var(--background-action-high-blue-france)`) ou la classe `fr-*` correspondante. **Ne pas** rétro-deviner à partir du hex.
- **Composant** → le node Figma est nommé sémantiquement (« Thème clair / Primaire / LG ») et porte souvent sa doc DSFR dans la réponse de `get_design_context` → s'en servir pour retrouver le markup DSFR (`fr-btn`, etc.), **validé** via le MCP `dsfr`.

---

## Granularité (obligatoire)

- **Une URL = un node précis** (`?node-id=...`). Jamais une URL de fichier générique : `code-dev` doit aller direct au bon écran, sans deviner.
- **Un frame / composant à la fois.** Un gros node explose le contexte : `get_metadata` d'abord pour cartographier, puis `get_design_context` sur les node-ids enfants pertinents.
- **Frames archivées.** L'ancienne version d'un écran garde le **même nom** préfixé de `[ARCHIVE]` (posée à gauche de la nouvelle sur le canvas). Ne **jamais** implémenter ni mesurer depuis un frame `[ARCHIVE]` — toujours le node courant. En cas de doute sur lequel est courant, **demander le node-id à l'utilisateur** plutôt que deviner.

---

## Phase 1 — Overview (new screens only)

When multiple screens need to be created:

- Do **NOT** dive into screen details immediately.
- Focus on **navigation flow** between screens and **shared components** — use `get_metadata` on the top frame to map the structure cheaply.
- Draft the navigation structure and identify common components first, then proceed to Phase 2.

## Phase 2 — Screen-by-screen implementation

- Process screens **one at a time** to avoid context saturation.
- Only move to the next screen after the current one is fully complete.
- If screens already exist in the app, skip Phase 1 and start here.

## Phase 3 — Per-screen rules (pixel perfect)

For each screen, ensure:

- **Exact placement**: elements positioned exactly as in the design.
- **Correct text styles**: right DSFR text classes (`fr-h1`, `fr-text--sm`, `fr-text--xs`, etc.).
- **No missing elements**: every element from the design is present.
- **Interactive placeholders**: tooltips/accordions without defined content → lorem ipsum.
- **Spacing & margins**: DSFR spacing classes (`fr-mb-1w`, `fr-mt-3w`, etc.) match the design.
- **Element order**: DOM order matches the visual order.

### Visual fidelity checklist (mandatory per element)

For **every** element in the Figma tree, check these properties — not just structure:

#### 1. Text color

Read the color from `get_design_context` / `get_variable_defs`. If it differs from the default (`#161616`), apply the matching DSFR class. **Always validate the exact class name** against the `dsfr` MCP (`get_color_tokens`) or the CSS in `public/dsfr/` — never guess. Prefer mapping the **token name** returned by `get_variable_defs` (e.g. `$text-mention-grey`) over reverse-engineering a hex.

Common pitfalls:
- **Wrong class name**: e.g. `fr-text--mention-grey` does not exist, the correct class is `fr-text-mention--grey`.
- **Missing CSS file**: DSFR utility classes (colors, spacing) live in separate CSS files (e.g. `utility/colors/colors.min.css`) that may not be loaded in `layout.tsx`. A correct class with a missing CSS file silently fails.

#### 2. Font size

Read the font size from the `get_design_context` output / the node's text style. Map to the correct DSFR class:

| Figma px | DSFR class | Note |
|---|---|---|
| 12px | `fr-text--xs` | |
| 14px | `fr-text--sm` | |
| 16px | *(none)* | Default body size |
| 18px | `fr-text--lg` | |
| 20px | `fr-text--xl` | |

**Never assume a size** — always read it from the Figma node.

#### 3. Font weight (critical — never skip)

**Every text node's font weight must be replicated exactly.** Read the `fontWeight` / textStyle name:

- `fontWeight` >= 600 or textStyle containing "Bold"/"SemiBold" → wrap in `<strong>`, `<b>`, or use `fr-text--bold`.
- `fontWeight` < 600 or textStyle "Regular"/"Normal" → no bold wrapper.

**Do not assume any cell, label, or value is regular by default** — check the Figma data.

**API limitation**: the API only exposes the *dominant* style of a text node. Character-level overrides (a bold number inside a regular sentence) are invisible. When the data shows `Regular` but bold is plausible, **`mcp__figma__get_screenshot`** on the node to verify visually.

**Tables and data grids**: always `get_screenshot` the node and verify bold **cell-by-cell**. Common bold patterns: summary/total rows or columns, first-column row labels, computed values (percentages, gaps, scores). Do not assume only headers are bold.

#### 4. Exact text content

Copy text **verbatim** from Figma (after fixing typos). Never paraphrase or approximate. Example: if the design says *"X, Y et Z"*, do not write *"X, Y, Z"*.

#### 5. Component structure

Never assume a design system component's internal structure. Always verify with `get_component_doc` from the `dsfr` MCP before writing HTML. Example: a callout might look like it has a separate `<h3>` title, but the DSFR spec may expect inline bold text within a `<p>`.

#### 6. Element position relative to siblings

Check the Figma y-coordinate order (via `get_metadata` / `get_design_context`). If an element appears between a title and a table in Figma, it must be between them in the DOM. Components may encapsulate siblings: content placed "below the title" may need to go inside that component too.

#### 7. Spacing between elements

For **every pair of adjacent elements**, compare the Figma spacing with the code's margin/gap:

1. **Read Figma spacing**: from the `get_design_context` output (`gap` / padding) and/or the spacing token name from `get_variable_defs`.
2. **Map to DSFR**: `1w` = 8px, `2w` = 16px, `3w` = 24px, `4w` = 32px, `5w` = 40px.
3. **Verify the CSS value** in `public/dsfr/dsfr.css` — never guess (e.g. `3w` = 24px, not 12px).
4. **Flex vs. normal flow**: in flex containers, margins **add to** gap (no collapsing). In normal flow, vertical margins collapse to `max(top, bottom)`. A `margin-top: 32px` child inside a `gap: 24px` flex parent = 56px total, not 32px.
5. **Nesting groups**: Figma often groups elements with different gaps (table + source at 8px, inside a container at 24px). The code must reproduce this nesting.
6. **Design system default margins**: framework components (stepper, breadcrumb, etc.) have built-in margins from CSS. Removing a utility class doesn't remove the base margin — use `fr-mb-0` to explicitly zero it.

#### 8. Nested styling

When a sentence contains mixed styles (e.g. *"écart de **4,5 %**"*), wrap the bold portion in `<strong>`. Do not flatten styles.

#### 9. No phantom elements

Do not add elements (tooltips, icons, decorations) absent from the Figma design. Every element must have a corresponding Figma node.

#### 10. Bordures, séparateurs, dimensions — mesurer, ne rien retirer

- **Bordures & séparateurs** : chaque cellule / bloc que le Figma borde doit l'être dans le rendu. Un composant « tableau bordé » DSFR trace une bordure sur **chaque** cellule (grille complète) — vérifier cellule par cellule (`get_screenshot` + mesure du `background-image` / `border` dans le DOM), pas seulement l'aspect global.
- **Ne jamais retirer / fusionner / « simplifier »** un élément que le node montre (bordure, séparateur, sous-cellule). Le point #9 interdit d'*ajouter* du fantôme ; celui-ci interdit l'**inverse** : *supprimer* du réel. Le node fait autorité, pas ton interprétation du layout — en cas de doute (« ces 2 sous-cellules ne forment-elles pas une colonne unique ? »), confirmer sur le node **avant** de retirer quoi que ce soit.
- **Largeurs / tailles fixes** : lire la **largeur du node** (`get_metadata` → `width`) et la reproduire au ratio, jamais « à peu près égales » à l'œil. Deux colonnes que le Figma donne à 115px / 151px ne sont pas « 15 % / 15 % ».
- **Règle générale — mesurer, pas comparer à l'œil** : pour toute propriété dimensionnelle (largeur, bordure, gap, taille), confronter la valeur **mesurée** du DOM (`getBoundingClientRect` / `getComputedStyle`) à celle du node. Même discipline que le gate `design-validator`, mais à appliquer **pendant la construction** et sur les **fixes UI ad-hoc hors pipeline** — ce qui « semble à peu près bon » à l'œil est exactement ce qui dérive.

#### 11. Tableaux — revue colonne par colonne

Pour **chaque** tableau, vérifier explicitement :

- **Alignement** de chaque valeur (gauche / droite) tel que le node le montre — pas seulement la première ligne.
- **Nombre de lignes de chaque en-tête** : tout wrap ou débordement non prévu par le Figma = défaut (élargir la colonne ou ajuster). Un en-tête qui passe sur 3 lignes au lieu de 2 est bloquant.
- **Largeur des colonnes** : lue sur le node (`get_metadata` → `width`), jamais « à peu près égales ».
- **Texte exact des placeholders** quand une valeur n'est pas calculée : « - % », « - € » — **jamais** un « - » nu si le Figma affiche l'unité.

#### 12. Tous les états (vide / partiel / rempli)

Vérifier l'écran **vide**, **partiellement rempli** et **rempli**. Les placeholders de l'état vide comptent **autant** que les valeurs calculées — ne **jamais** vérifier uniquement avec `[DEV] Remplir`. Un « - % » manquant à vide est un défaut au même titre qu'une valeur fausse.

---

## Per-screen verification method (mandatory)

When comparing a Figma screen to existing code, **never** rely on a flat text extraction. Instead:

1. **Map the content frame** with `mcp__figma__get_metadata` (structure: node ids, types, order, sizes).
2. **Walk the node tree top-to-bottom**, and for each meaningful node call `mcp__figma__get_design_context` to get its reference code + tokens + screenshot.
3. **Build a structural checklist** — one line per element with its type, text, and position relative to siblings.
4. **Compare element-by-element** against the current code's JSX: is every Figma element present? Is the order identical? Are conditional elements correctly scoped?
5. **Flag every discrepancy** before writing any code.

This prevents missing structural elements (alert blocks, source lines, description paragraphs) that a flat text search would overlook.

### Tableau de diff avant de coder, passe QA après

**Avant de coder**, produire un **tableau de diff** — `élément | spec Figma | rendu actuel | écart` — couvrant **alignement, wrapping d'en-tête, espacement, largeurs, placeholders**. Flag chaque écart *avant* d'écrire la moindre ligne.

**Après avoir codé**, refaire une **passe QA design élément par élément** et lister **toute** déviation, même minime : chacune est **bloquante** (pas de « c'est presque bon »). Idéalement, déléguer cette passe au gate indépendant `design-validator` (`rules/visual-quality-validation.md`).

---

## Phase 4 — Final verification

L'implémentation pixel-perfect (Phases 1–3) repose sur la lecture de `get_design_context` + `get_variable_defs` (chaque propriété mappée à sa classe / token DSFR). Quand cette lecture a été faite proprement, la Phase 4 **ferme la boucle** : confirmer que le rendu réel correspond au plan, et produire les artefacts pour la review humaine.

### 0. État de rendu contrôlé (obligatoire avant toute comparaison)

- **Thème clair forcé.** Le site suit le thème du navigateur ; un rendu en sombre ne matche pas la maquette (claire) et fausse l'overlay onion-skin + la lecture des couleurs. Forcer le clair **avant toute comparaison** : `data-fr-scheme="light"` + `data-fr-theme="light"` sur `<html>`, ou le toggle DSFR « Paramètres d'affichage » en pied de page.
- **Viewport connu, ≥2 largeurs.** Desktop **et** mobile — un `space-between` ou une marge qui collapse ne se voit qu'à certaines hauteurs (cf. `visual-quality-validation.md`).
- **Pages derrière ProConnect.** Un écran authentifié ne rend pas sans session valide (sinon 500). Demander à l'utilisateur de se connecter, **ou** débloquer la session locale (seed DB — voir la mémoire `project_local_session_500_seed`). Sans session, aucune comparaison n'est possible.

### 1. Sanity check structurel

Reparcourir la checklist Phase 3 sur l'écran fini : couleurs, fontSize, fontWeight (cell-by-cell sur les tableaux), texte verbatim, ordre des éléments, espacements. Si un doute persiste sur un point d'ambiguïté de l'API (typiquement les overrides char-level de bold dans un tableau), faire un appel ciblé à `mcp__figma__get_screenshot` sur le node concerné pour confirmer visuellement.

### 2. Screenshots dev server pour la review humaine

Avec un browser MCP (Playwright ou next-devtools `browser_eval`) :

1. **Navigate** vers la page dans le dev server.
2. **Take a screenshot** du rendu (desktop 1280×800 + mobile 375×667).
3. **Comparer** au `mcp__figma__get_screenshot` du node Figma, puis **joindre les images au body de la PR** — signal visuel principal pour le reviewer humain.

Si aucun browser MCP n'est dispo, demander à l'utilisateur de fournir le screenshot.

### Points qui échappent souvent à la lecture structurelle seule

- Wrong DSFR class name **qui n'existe pas** (ex : `fr-text--mention-grey` au lieu de `fr-text-mention--grey`) → la classe est silencieusement ignorée. Vérifier dans `public/dsfr/dsfr.css` que la classe existe.
- DSFR utility class correcte mais **CSS file pas chargé** dans `layout.tsx` (ex : `utility/colors/colors.min.css`). Confirmer dans le DOM que la prop CSS est appliquée.
- Marges par défaut d'un composant DSFR qui s'additionnent à tes utilities (`fr-mb-3w` qui s'ajoute à la marge interne du composant).

Ces 3 cas typiques sont les seuls où un screenshot du rendu apporte une info que la lecture structurelle ne donne pas.

---

## Design errors & typos

- If **illogical or inconsistent elements** appear in the design, do **NOT** implement them — **notify the user** and ask how to proceed (duplicate elements, contradictory states, impossible layouts).
- If the design contains **spelling mistakes** (e.g. "horraire" instead of "horaire"), fix them silently in the code — do not reproduce typos.

---

## Tooling — rappel

- **Toujours** le serveur MCP **officiel `figma`** (`mcp__figma__get_metadata` / `get_design_context` / `get_variable_defs` / `get_screenshot`). C'est le **seul** serveur Figma du repo.
- Utiliser `search_components` et `get_component_doc` du MCP `dsfr` pour valider la structure d'un composant avant d'écrire le HTML.
- Quand une réponse `get_design_context` est trop grosse, **ne pas** retomber sur une extraction texte à plat : cartographier avec `get_metadata` et redescendre node par node.
- **Vérification indépendante** : cette règle est la discipline de *construction* de `code-dev`. Le rendu est vérifié séparément par le gate `design-validator` (`rules/visual-quality-validation.md`, `code-dev` step 9a-bis) — render + mesure DOM + overlay onion-skin.
