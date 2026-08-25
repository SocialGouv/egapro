---
paths:
  - "src/**/*.scss"
  - "src/**/*.tsx"
---

# Styling & DSFR

> Chargée sur tout `.scss` / `.tsx` sous `src/`. Vérifiée par `structural-auditor`. Les couleurs en dur, les `@media` bruts et `style={}` sont bloqués par le hook — voir `rules/automation.md`.

## Cascade, dans cet ordre

1. classe DSFR → 2. utilitaire DSFR + custom property → 3. SCSS module scopé (dernier recours, un par composant).

Avant d'écrire du CSS sur mesure, vérifier que le DSFR ne le fournit pas déjà : layout (`fr-grid-row`, `fr-col-*`), espacement (`fr-mt-*`, `fr-py-*`, `fr-mb-*`), typographie (`fr-text--*`, `fr-h1`..`fr-h6`).

**Avant d'écrire du HTML DSFR, valider la structure via le MCP `dsfr`** (`get_component_doc`, `search_components`, `get_color_tokens`) ou le CSS réel de `public/dsfr/`. Ne jamais deviner un nom de classe : une classe qui n'existe pas (`fr-text--mention-grey` au lieu de `fr-text-mention--grey`) est silencieusement ignorée.

## Tokens de couleur

Toujours une custom property DSFR, jamais un hex. Familles courantes :

- **Fonds** : `--background-default-grey`, `--background-alt-blue-france`, `--background-contrast-grey`
- **Texte** : `--text-title-grey`, `--text-default-grey`, `--text-mention-grey`, `--text-action-high-blue-france`
- **Bordures** : `--border-default-grey`, `--border-action-high-blue-france`
- **Artwork / icônes** : `--artwork-major-blue-france`, `--artwork-minor-blue-france`
- **Ombres** : `--raised-shadow`, `--overlap-shadow`, `--lifted-shadow`
- **États** : `--text-default-error`, `--background-flat-error`, `--text-default-success`

**Exception PDF** : `@react-pdf/renderer` ne sait pas lire une CSS variable. Les fichiers de style PDF (`pdfStyles.ts`) utilisent des constantes hex nommées d'après leur token DSFR équivalent, avec le mapping documenté en commentaire. Même exception pour `font-family`, que le PDF doit nommer explicitement — partout ailleurs la Marianne est héritée de `<html>` et ne se redéclare jamais.

## Breakpoints

`next.config.js` injecte les mixins DSFR via `sassOptions.additionalData` — aucun import manuel.

| Mixin | Media query | Usage |
|---|---|---|
| `@include respond-from(md)` | `min-width: 48em` | mobile-first (préféré) |
| `@include respond-to(sm)` | `max-width: 47.98em` | desktop-first (repli) |

Tokens : `xs` (0), `sm` (36em), `md` (48em), `lg` (62em), `xl` (78em).

## Runtime DSFR

- **Assets** : copiés dans `public/dsfr/` par `scripts/copy-dsfr.mjs` (git-ignoré, régénéré au `dev`/`build`). Ne jamais importer le CSS DSFR via webpack.
- **JS** : chargé en `<Script type="module" strategy="beforeInteractive">`. Il gère modales, dropdowns, bascule de thème et navigation clavier — ne jamais redupliquer cette logique en React, utiliser les attributs `data-fr-*`.
- **Thème sombre** : `data-fr-scheme="system"` sur `<html>`, cookie `fr-theme` lu par un script inline pour éviter le flash, `ThemeModal` pour la bascule utilisateur.
- **Icônes** : classes `fr-icon-{nom}-{fill|line}`, toujours `aria-hidden="true"` sur les décoratives.
- **Piège fréquent** : une classe utilitaire DSFR correcte dont le fichier CSS n'est pas chargé dans `layout.tsx` (les couleurs et espacements vivent dans des fichiers séparés, ex. `utility/colors/colors.min.css`) échoue silencieusement. Confirmer dans le DOM que la propriété est bien appliquée.
