---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
---

# Qualité de code

> Chargée dès qu'un fichier `.ts/.tsx/.js/.jsx` sous `src/` est lu ou édité. Vérifiée après coup par `structural-auditor`.
>
> Ce qu'un hook bloque mécaniquement n'est **pas** répété ici (`any`, `process.env`, `../../`, suppressions de lint, `.tsx` non-route dans `src/app/`, helpers domain ré-inlinés) — la liste vit dans `rules/automation.md`. Ce fichier ne porte que ce qui demande du jugement.

## Pas de commentaire par défaut

Le code produit ne porte **aucun** commentaire descriptif (`// fetch user`), JSDoc, référence au ticket (`// for ticket #42`), TODO/FIXME (ouvrir une issue), en-tête de section (`// --- helpers ---`), ni paraphrase de la ligne d'en dessous. Le nom de la fonction ou de la variable doit suffire.

**Seule exception** : un `// ` d'une ligne qui explique un **WHY non-évident** — contrainte cachée, invariant subtil, workaround référencé, comportement contre-intuitif. Test : si le retirer ne gênerait pas un futur lecteur, il ne fallait pas l'écrire.

La règle porte sur le **code nouvellement écrit ou modifié**. Les commentaires legacy déjà présents ne se suppriment pas dans le cadre du ticket courant — pas de scope creep.

## Source unique d'une règle métier

Une règle métier existe à **exactement un endroit** : `~/modules/domain`, en fonction pure, importée depuis le barrel. Les appelants la **consomment**, ils ne la re-dérivent jamais en ligne.

Ce n'est pas seulement du DRY, c'est de la **justesse sous changement**. Quand une règle réglementaire bouge — une convention de signe, un seuil, une classification — il faut pouvoir éditer **une** fonction et que chaque écran, export, PDF et routeur suive. Toute copie hors du domaine est un bug en attente du jour où la règle change.

| Règle métier | Fonction à appeler | Ne jamais ré-inliner en |
|---|---|---|
| Écart signé `((men − women)/men)×100` | `computeGap` / `computeGapBetween` | `((m - w) / m) * 100` dans un composant ou un export |
| Franchissement du seuil d'alerte (5 %, positif seulement) | `gapLevel(gap) === "high"` | `gap >= GAP_ALERT_THRESHOLD` dispersé |
| Quel sexe un jeu d'écarts défavorise | une fonction nommée de `gap.ts` | `parseFloat(w) < parseFloat(m)` compté dans un composant |
| Ratio stocké (0..1) → pourcentage | un helper domain nommé | `Number(row.gap) * 100` dans la couche export |
| Déclaration annulée | `isCancelled()` | `cancelledAt !== null` |
| CSE obligatoire (≥ 100) | `isCseRequired()` | `workforce >= 100` |

Avant d'ajouter un calcul ou une classification dans un composant, un routeur, un PDF ou un export : *est-ce une règle métier ?* Si oui, elle va dans le domaine (fonction pure + test unitaire) et l'appelant l'importe. Si la fonction manque, **l'ajouter** — jamais la ré-implémenter.

Quand deux points d'appel ont besoin d'**intentions différentes** sur les mêmes entrées (« écart au-dessus du seuil dans les deux sens » pour un encart, « positif seulement » pour un badge de conformité), chaque intention est sa **propre fonction nommée** — jamais deux morceaux de code qui se ressemblent et dont la divergence se lit comme un accident.

Les helpers **spécifiques à l'UI** (classes de badge, libellés DSFR) restent dans le module de la feature : seule la logique pure va dans le domaine.

## DRY : 3 répétitions = extraction

Trois occurrences de la même logique ou du même markup → extraire. Points chauds : les constantes partagées (`shared/constants.ts` du module, jamais dupliquées), les schémas Zod partagés, les fonctions de formatage (`formatSiren`, `formatPhone`).

> La règle DRY propre aux **tests** (mocks centralisés dans `src/test/setup.ts`) vit dans `rules/testing.md`, sa source unique.

## Pas de constante inutile

Ne pas extraire une valeur en `const` au niveau module sauf si elle est utilisée à plusieurs endroits, ou si c'est un nombre/une chaîne magique qui gagne à être nommé. Une constante utilisée une seule fois, juste en dessous de sa définition, ajoute du bruit, pas de la clarté.

## Imports

Alias `~/` (mappé sur `src/`), et import depuis le **barrel** du module (`~/modules/layout`), jamais depuis un fichier interne.

## Taille de fichier

< 200 lignes idéal · 200–400 acceptable · > 400 découper · > 800 **interdit**.

## Typage

`strict: true` et `noUncheckedIndexedAccess: true` sont actifs. Les types d'objets partagés vont dans le `types.ts` du module ; les props de composant sont un `type Props = { … }`.

## Nommage

| Type | Convention | Exemple |
|---|---|---|
| Composant React | PascalCase | `HeaderBrand.tsx` |
| Hook | camelCase + `use` | `useNavigation.ts` |
| Utilitaire | camelCase | `formatDate.ts` |
| Type / Interface | PascalCase | `type UserProfile = …` |
| Constante | SCREAMING_SNAKE | `const MAX_RETRY = 3` |
| Dossier de module | camelCase | `modules/layout/` |

Nommer d'après **ce que la chose est ou affiche**, pas d'après sa place dans l'arbre : `DeclarationSummaryCard`, pas `LeftPanelCard`.

## Divers

- **Immutabilité** : jamais de mutation d'objet ou de tableau — toujours un spread.
- **Erreurs** : `try/catch` avec un message explicite destiné à l'utilisateur.
- **Validation** : Zod aux frontières du système (formulaires, params de route, body d'API).
