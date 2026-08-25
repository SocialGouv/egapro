---
paths:
  - "src/**/*.tsx"
  - "src/**/*.scss"
---

# Implémenter depuis Figma

> La discipline de **construction**. La **vérification** du rendu est un gate séparé et indépendant (`design-validator`) → `rules/visual-quality-validation.md`. Vaut aussi pour un fix UI ad-hoc hors pipeline.

Figma est la **source unique de vérité visuelle** : pas de mockup HTML intermédiaire, pas de screenshots téléchargés à l'avance. On interroge Figma à la demande, au moment d'implémenter.

## Serveur et outils

Le seul serveur branché est l'**officiel `figma`** (`https://mcp.figma.com/mcp`, OAuth, seat développeur). Il marche **headless depuis une URL node-id** — pas besoin de l'app desktop. Aucune référence historique à un serveur local ou tiers (type Framelink) n'est valide.

Chaque outil prend `fileKey` + `nodeId`, extraits de l'URL `figma.com/design/:fileKey/:name?node-id=X-Y` → `nodeId = X:Y` (le `-` devient `:`).

| Outil | Ce qu'il rend |
|---|---|
| `get_metadata` | **carte structurelle** d'un frame (ids, types, noms, positions, tailles). Pour naviguer un grand écran et choisir les node-ids enfants. **Jamais sur une page entière** (>200 k caractères → overflow). Sans `nodeId` → liste les pages |
| `get_design_context` | **l'outil principal** : code de référence + map des tokens inline + screenshot + doc du composant Figma + URLs des assets |
| `get_variable_defs` | les variables/tokens **par leur nom** (`$background-action-high-blue-france` → `#000091`) — le pont direct vers DSFR. Sur un node layer/composant précis, pas une page (« nothing selected ») |
| `get_screenshot` | PNG du node — URL courte + instructions curl. `maxDimension` cappe le côté long |

**Pas de Code Connect ici** : `get_code_connect_map` renvoie `{}`. Les composants DSFR vivent dans des bibliothèques **partagées (État)** qu'egapro consomme sans les posséder, donc aucun mapping ne peut y être attaché. La correspondance node → classe DSFR passe par la traduction ci-dessous.

## Règle d'or : le code rendu est une référence à traduire, pas à coller

`get_design_context` sort du **React + Tailwind avec des valeurs en dur** (`bg-[#000091]`, `px-[24px]`, `text-[18px]`). L'outil le dit lui-même. egapro est en **DSFR vanilla** (classes `fr-*` en markup, pas de wrapper React) : ne jamais garder de Tailwind, de px ni de hex brut.

Traduire depuis le **nom du token** (`get_variable_defs`), jamais en rétro-devinant depuis un hex :

| Figma | DSFR |
|---|---|
| token de couleur | `var(--<même-nom>)` ou la classe `fr-*` correspondante |
| 12 / 14 / 16 / 18 / 20 px | `fr-text--xs` / `fr-text--sm` / *(défaut)* / `fr-text--lg` / `fr-text--xl` |
| `fontWeight ≥ 600` | `<strong>` ou `fr-text--bold` |
| `itemSpacing` 8 / 16 / 24 / 32 / 40 px | `1w` / `2w` / `3w` / `4w` / `5w` |

Le node est nommé sémantiquement (« Thème clair / Primaire / LG ») et `get_design_context` renvoie souvent sa doc DSFR : s'en servir pour retrouver le markup, **validé** via le MCP `dsfr` (`rules/styling-dsfr.md`).

## Granularité

- **Une URL = un node précis** (`?node-id=…`). Une URL de fichier générique oblige à deviner l'écran.
- **Un frame à la fois.** Un gros node explose le contexte : `get_metadata` pour cartographier, puis `get_design_context` sur les enfants pertinents. Si une réponse est trop grosse, redescendre node par node — **jamais** retomber sur une extraction de texte à plat, qui rate les éléments structurels (encarts, lignes de source, paragraphes de description).
- **Frames archivées** : l'ancienne version d'un écran garde le même nom préfixé `[ARCHIVE]`, posée à gauche de la nouvelle. Ne jamais implémenter ni mesurer depuis un `[ARCHIVE]`. Dans le doute sur lequel est courant, **demander le node-id à l'utilisateur**.

## Les pièges qui survivent à une lecture soignée

**Le bold que l'API cache.** `get_design_context` n'expose que le style **dominant** d'un node texte : un chiffre en gras dans une phrase régulière est invisible. Dès qu'un bold est plausible — et **systématiquement sur un tableau ou une grille de données, cellule par cellule** — faire un `get_screenshot` ciblé du node. Les patterns habituels : lignes/colonnes de total, libellés de première colonne, valeurs calculées.

**Les marges qui s'additionnent.** Dans un conteneur flex, les marges **s'ajoutent** au `gap` (pas de collapse) : `margin-top: 32px` dans un parent `gap: 24px` fait 56px. En flux normal, les marges verticales collapsent à `max(top, bottom)`. Et les composants DSFR ont leurs **marges internes** : retirer une classe utilitaire ne les enlève pas — il faut `fr-mb-0` explicitement.

**Le groupement imbriqué.** Figma groupe souvent avec des gaps différents (tableau + source à 8px, dans un conteneur à 24px). Le code doit reproduire l'imbrication, pas aplatir.

**Ne pas retirer ce que le node montre.** Chaque bordure, séparateur ou sous-cellule visible dans le node doit exister dans le rendu — un tableau bordé DSFR trace une bordure sur **chaque** cellule. Le node fait autorité, pas ton interprétation du layout : dans le doute (« ces deux sous-cellules ne forment-elles pas une colonne unique ? »), confirmer **avant** de retirer. Symétriquement, **ne rien ajouter** qui n'ait pas de node correspondant (tooltip, icône, décoration).

**Mesurer, pas comparer à l'œil.** Toute dimension — largeur de colonne, bordure, gap, taille — se lit sur le node (`get_metadata` → `width`) et se confronte à la valeur **mesurée** du DOM. Deux colonnes que le Figma donne à 115px / 151px ne sont pas « 15 % / 15 % ». Ce qui « semble à peu près bon » est exactement ce qui dérive.

**Le texte est verbatim.** Copier le texte tel quel — « X, Y et Z » n'est pas « X, Y, Z ». Les placeholders comptent : « - % », « - € », jamais un « - » nu si le Figma affiche l'unité. Les **fautes d'orthographe** du design se corrigent silencieusement dans le code.

**Les états.** Vérifier vide / partiel / rempli. Un « - % » manquant à vide est un défaut au même titre qu'une valeur fausse.

## Erreurs de design

Si le design contient des éléments **illogiques ou contradictoires** (doublons, états impossibles, layout irréalisable), ne pas les implémenter : **prévenir l'utilisateur** et demander comment procéder.
