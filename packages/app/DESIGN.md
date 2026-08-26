---
name: EgaPro
description: Consultation publique institutionnelle, factuelle et accessible des résultats d’égalité professionnelle.
colors:
  primary-blue-france: "#000091"
  primary-blue-france-hover: "#1212ff"
  primary-blue-france-active: "#2323ff"
  accent-blue-france: "#6a6af4"
  focus-blue: "#0a76f6"
  surface-default: "#ffffff"
  surface-contrast: "#eeeeee"
  surface-blue-tint: "#f5f5fe"
  surface-blue-open: "#e3e3fd"
  chart-women: "#273962"
  chart-men: "#74a5ec"
  text-title: "#161616"
  text-default: "#3a3a3a"
  text-mention: "#666666"
  border-default: "#dddddd"
  border-plain: "#929292"
typography:
  headline:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "2.5rem"
  title:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.25rem"
  lead:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: "2rem"
  body:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  mention:
    fontFamily: "Marianne, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5rem"
rounded:
  sharp: "0"
  field-top: "0.25rem 0.25rem 0 0"
  pill: "1rem"
spacing:
  1w: "0.5rem"
  2w: "1rem"
  3w: "1.5rem"
  4w: "2rem"
  5w: "2.5rem"
  6w: "3rem"
  7w: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-blue-france}"
    textColor: "{colors.surface-blue-tint}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-blue-france-hover}"
    textColor: "{colors.surface-blue-tint}"
    rounded: "{rounded.sharp}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary-blue-france}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  field-default:
    backgroundColor: "{colors.surface-contrast}"
    textColor: "{colors.text-default}"
    typography: "{typography.body}"
    rounded: "{rounded.field-top}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  callout-information:
    backgroundColor: "{colors.surface-contrast}"
    textColor: "{colors.text-default}"
    rounded: "{rounded.sharp}"
    padding: "1.5rem"
  tag-year:
    backgroundColor: "{colors.surface-contrast}"
    textColor: "{colors.text-title}"
    typography: "{typography.mention}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
    height: "2rem"
---

# Design System: EgaPro

## Overview

**Creative North Star: "Le guichet public vérifiable"**

EgaPro transpose l’autorité calme d’un service public dans une interface de consultation immédiatement compréhensible. La recherche d’entreprise est l’action dominante; les filtres l’affinent sans concurrencer ce premier geste, puis les résultats et indicateurs sont présentés comme des faits à lire, comparer et réutiliser.

Le système conserve strictement l’identité de l’État et le vocabulaire DSFR. Sa personnalité vient de la précision : hiérarchie typographique franche, Bleu France réservé aux actions et états actifs, surfaces tonales plutôt que décoratives, séparateurs nets et densité d’information contenue. L’interface reste stable du grand écran au mobile, où la grille se replie en une colonne et les actions prennent la largeur disponible.

**Key Characteristics:**

- Institutionnel, direct et explicatif, sans tonalité commerciale.
- Recherche d’entreprise dominante, filtres factuels secondaires.
- Mise en page blanche, plate et structurée par l’espacement et les séparateurs.
- Composants DSFR reconnaissables et états clavier toujours visibles.
- Données lisibles en texte ou en tableau, avec chiffres tabulaires lorsque nécessaire.

## Colors

La palette est celle du DSFR en thème clair : un Bleu France souverain pour l’action, entouré de blancs et gris neutres qui laissent les données porter le sens.

### Primary

- **Bleu France souverain:** porte les actions principales, les liens, l’onglet actif et les soulignements de recherche.
- **Bleu France interaction:** réserve les teintes plus lumineuses au survol et à l’activation; elles ne deviennent jamais des aplats décoratifs permanents.

### Secondary

- **Bleu France médian:** signale les filets d’information et les accents secondaires, notamment le bord gauche des encarts.
- **Bleu de focus:** dessine le contour de focus clavier sans ambiguïté sur toute surface interactive.
- **Bleus de données femmes-hommes:** `#273962` et `#74a5ec`, issus du composant Figma Observatoire, distinguent uniquement les deux séries de bénéficiaires; les libellés textuels restent toujours présents.

### Neutral

- **Blanc de service:** fond principal et toile de lecture.
- **Gris de contraste:** fond des champs, encarts et petits contrôles afin de distinguer les zones opérables sans ombre.
- **Noir de titre:** titres, légendes fortes et libellés de navigation.
- **Gris de lecture:** texte courant et contenu factuel.
- **Gris de mention:** sources, indications secondaires et placeholders.
- **Gris de séparation:** bordures de listes et divisions de tableaux.
- **Gris de contrôle:** soulignement structurel des champs et des sélecteurs.

### Named Rules

**The Bleu utile Rule.** Le Bleu France signifie action, lien, sélection ou focus; il ne sert pas à décorer des surfaces de contenu.

**The Donnée neutre Rule.** Un résultat factuel reste en gris de lecture sauf si une sémantique réglementaire explicite exige une couleur d’état.

## Typography

**Display Font:** Marianne (avec Arial et sans-serif en repli)
**Body Font:** Marianne (avec Arial et sans-serif en repli)

**Character:** Marianne donne une voix publique contemporaine, nette et familière. Une seule famille couvre titres, libellés et données; la hiérarchie vient du corps, de la graisse et de l’espace, jamais d’un contraste typographique décoratif.

### Hierarchy

- **Headline** (gras, 2rem/2.5rem; 2.5rem/3rem dès 48em): un seul titre de page, bref et orienté tâche.
- **Title** (gras, 1.75rem/2.25rem; 2rem/2.5rem dès 48em): sections principales de résultats, d’historique et de téléchargement.
- **Lead** (normal, 1.25rem/2rem): explication immédiate sous le titre ou identifiant d’entreprise important.
- **Body** (normal, 1rem/1.5rem): libellés, métadonnées et explications factuelles.
- **Label** (normal ou médium, 1rem/1.5rem): champs, boutons et contrôles; le sens est porté par les mots, pas par les capitales.
- **Mention** (normal, 0.875rem/1.5rem): provenance, confidentialité, légendes secondaires et données compactes de tableau.

### Named Rules

**The Une voix publique Rule.** Marianne est la voix unique de l’interface; la graisse et l’échelle suffisent à distinguer action, structure et détail.

**The Chiffres stables Rule.** Les identifiants, années et mesures alignées utilisent des chiffres tabulaires dès qu’un balayage vertical ou une comparaison est attendue.

## Layout

La mise en page suit la grille DSFR à 12 colonnes dans un conteneur centré de 78rem maximum. Le conteneur garde 1rem de marge intérieure sur les petits écrans et 1.5rem au palier large. Le rythme est un multiple de 0.5rem; les espacements de 2.5 à 3.5rem séparent les grandes séquences de lecture, tandis que les groupes opérables restent plus serrés.

La recherche principale occupe toute la largeur utile. À partir de 48em, les filtres s’organisent en trois colonnes égales; sous ce seuil ils deviennent une séquence verticale. Les ruptures DSFR sont 36em, 48em, 62em et 78em. Les boutons groupés s’alignent horizontalement lorsque l’espace le permet et prennent toute la largeur en mobile. Les tableaux conservent leur structure sémantique et défilent horizontalement plutôt que de compresser les colonnes jusqu’à l’illisibilité.

**The Progression factuelle Rule.** Organiser chaque page dans l’ordre : contexte bref, action ou identité dominante, critères ou période, résultats, puis provenance et réutilisation.

## Elevation & Depth

Le contenu est plat par défaut et n’utilise aucune ombre. La profondeur vient des changements de ton, des filets inférieurs, des bordures de liste et de l’espacement. Le chrome global peut porter une séparation légère propre au DSFR, mais les formulaires, résultats, tableaux et encarts de consultation ne flottent jamais au-dessus de la page.

### Named Rules

**The Plat par défaut Rule.** Une surface de consultation ne gagne pas une ombre pour attirer l’attention; utiliser d’abord la hiérarchie, le ton de fond ou un filet DSFR.

## Shapes

La géométrie est fonctionnelle et presque orthogonale. Les boutons et encarts sont carrés; les champs n’arrondissent que leurs deux coins supérieurs avant un soulignement de 2px. Les tags d’année forment l’unique silhouette pleinement arrondie, car ils représentent un choix compact et répétable. Les séparateurs horizontaux prolongent cette langue administrative nette.

**The Rayon sémantique Rule.** Le rayon indique un type de contrôle : sommet adouci pour la saisie, pilule pour le tag, angle droit pour l’action et le contenu.

## Components

### Buttons

- **Shape:** rectangles francs, sans rayon; hauteur compacte de 2.5rem et rembourrage horizontal d’1rem.
- **Primary:** fond Bleu France, texte clair, graisse médium; réservé à l’action qui soumet ou applique.
- **Hover / Focus:** teinte Bleu France d’interaction au survol; contour bleu de 2px décalé de 2px au focus clavier.
- **Secondary:** fond transparent, texte et contour Bleu France; utilisé pour réinitialiser, télécharger ou proposer une action voisine sans rivaliser avec la principale.
- **Responsive:** les groupes sont pleine largeur en mobile puis redeviennent ajustés au contenu sur écran suffisamment large.

### Chips

- **Style:** tag d’année gris clair, texte sombre, rayon pilule et hauteur de 2rem.
- **State:** l’année courante porte l’état actif DSFR et reste identifiable par `aria-current`, pas par la couleur seule.

### Cards / Containers

- **Corner Style:** angles droits.
- **Background:** blanc pour les listes et résultats; gris de contraste pour les encarts d’information.
- **Shadow Strategy:** aucune ombre dans la surface de consultation.
- **Border:** filets gris pour les résultats; filet Bleu France médian de 0.25rem pour l’encart d’information.
- **Internal Padding:** 1.5rem dans un encart; les résultats utilisent 1.5rem vertical sans panneau englobant.

### Inputs / Fields

- **Style:** fond gris de contraste, texte gris de lecture, deux coins supérieurs adoucis et filet inférieur de 2px.
- **Focus:** contour bleu de 2px décalé de 2px; le champ de recherche conserve en plus son filet Bleu France.
- **Placeholder:** gris de mention en italique; il illustre un format et ne remplace jamais le libellé accessible.
- **Search:** champ et bouton forment une seule barre; le libellé reste présent pour les technologies d’assistance même lorsqu’il est visuellement masqué.
- **Error / Disabled:** employer les états DSFR natifs et conserver le message textuel associé; ne pas signaler un état par la couleur seule.

### Navigation

La navigation principale est plate, en Marianne, avec des liens de 1rem. L’onglet actif devient Bleu France et reçoit un filet inférieur sur grand écran; le mobile replie le menu dans le contrôle DSFR prévu à cet effet. Le fil d’Ariane peut se réduire à son déclencheur « Voir le fil d’Ariane » avant déploiement.

### Result List

Chaque résultat est un article sans carte : titre-lien en premier, puis une ligne flexible de faits — SIREN, année, localisation, activité et effectif. Des séparateurs gris encadrent la liste; les faits passent naturellement à la ligne sans créer de sous-panneaux.

### Data Tables and History

Les indicateurs utilisent les tableaux DSFR multiligne, avec en-têtes explicites, première colonne sémantique et défilement horizontal. Le graphique historique est un complément masqué aux technologies d’assistance; une alternative tabulaire porte toujours l’information complète.

## Do's and Don'ts

### Do:

- **Do** faire de la recherche ou de l’identité d’entreprise le point d’entrée visuel dominant.
- **Do** révéler les filtres comme une progression factuelle et les empiler dans l’ordre de lecture en mobile.
- **Do** utiliser les composants, variables, états et ruptures DSFR avant d’introduire une règle locale.
- **Do** préserver les libellés, légendes, captions, alternatives tabulaires et contours de focus visibles.
- **Do** placer source, confidentialité, API et exports après les résultats sans concurrencer la tâche principale.

### Don't:

- **Don't** transformer les résultats en mosaïque de cartes, badges colorés ou tuiles de score sans nécessité sémantique.
- **Don't** employer le Bleu France comme remplissage décoratif ou pour colorer arbitrairement une donnée.
- **Don't** ajouter d’ombre, de dégradé, de grand rayon ou de mouvement décoratif aux surfaces de consultation.
- **Don't** masquer un libellé essentiel derrière un placeholder ou dépendre d’un graphique seul pour transmettre un résultat.
- **Don't** comprimer les filtres ou les tableaux au point de rompre l’ordre de lecture, les cibles tactiles ou la lisibilité mobile.
