# Cahier de tests — parcours de déclaration des écarts de rémunération

Cahier de tests métier, maintenu **en corrélation avec les tests E2E** (issue [#3986](https://github.com/SocialGouv/egapro/issues/3986)).

Ce document est le **miroir versionné du fichier `Parcours.xlsx` de Laetitia** (juillet 2026) : chaque feuille, chaque année de campagne (2027 → 2033) et chaque cellule du fichier s'y retrouve, avec ses libellés d'origine. Il remplace l'Excel comme outil de suivi : le métier y lit les parcours à tester, et chaque parcours pointe vers le test E2E qui l'automatise. **En cas d'évolution de l'Excel, c'est ce document qu'il faut mettre à jour**, puis les tests.

**Mode d'emploi** : placez-vous sur votre feuille et votre année au §3 — la cellule liste les cas à dérouler, chacun désigné par une **coordonnée autoportante** `AAAA-EFFMAX-CASNN` (ex. `2027-249-CAS04` = année 2027, tranche 150-249, cas 4) qu'on peut citer sans ambiguïté en réunion. Chaque coordonnée est cliquable vers sa fiche détaillée (§2, étapes verbatim de l'Excel + test E2E). Nomenclature complète en tête du §3.

Audience : équipe métier / PO (référence d'acceptance et suivi des tests) et développeurs (traçabilité scénarios ↔ tests).

> Ce document complète [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md) (narration des flux) : ici on liste **quoi tester**, pas comment l'utilisateur vit le parcours.

## Sommaire

1. [Comment ce cahier reste corrélé aux tests E2E](#1-comment-ce-cahier-reste-corrélé-aux-tests-e2e)
2. [Les fiches de cas (détail verbatim de l'Excel)](#2-les-fiches-de-cas-détail-verbatim-de-lexcel)
3. [Les feuilles de l'Excel, année par année](#3-les-feuilles-de-lexcel-année-par-année)
4. [Scénarios complémentaires hors Excel](#4-scénarios-complémentaires-hors-excel)
5. [Limites de l'automatisation](#5-limites-de-lautomatisation)
6. [Arbitrages métier (divergences résolues)](#6-arbitrages-métier-divergences-résolues)

---

## 1. Comment ce cahier reste corrélé aux tests E2E

Chaque parcours à tester a un **identifiant stable** (`CAS-xx` pour les cas de l'Excel, avec le suffixe `-6IND` pour leurs variantes « 6 premiers indicateurs » ; `ANX-xx` pour les scénarios complémentaires). Le contrat est simple :

> **Tous les parcours du fichier Excel sont dans ce cahier, et la CI n'est verte que quand chaque fiche du §2 a son test E2E.**

Les cellules de l'Excel se **regroupent** : un même cas se répète dans plusieurs feuilles et plusieurs années (ex. le cas 4 apparaît en 2027/2030/2033 pour les 150-249, en 2030/2033 pour les 100-149, et toutes les années pour les 250 et +). Une fiche (§2) définit chaque parcours **une seule fois**, avec son test ; les feuilles (§3) relient chaque cellule de l'Excel à sa fiche.

1. **Côté tests** : le titre du `test.describe(...)` qui couvre un parcours porte le tag entre crochets, ex. `test.describe("[CAS-02] Path 1: no gap + hasCse → ...")`. Un même describe peut porter plusieurs tags. C'est ce tag que ciblent les commandes `--grep` du cahier.
2. **Côté cahier** : la ligne « Test E2E » de chaque fiche décrit ce que le test déroule réellement — y compris, honnêtement, ce qu'il ne déroule pas encore. Cette profondeur se juge en revue de PR ; l'outillage, lui, ne vérifie que l'existence.

Le script [`packages/app/scripts/check-cahier.mjs`](../packages/app/scripts/check-cahier.mjs) (`pnpm --filter app check:cahier`, exécuté en CI) vérifie que :

- toute fiche `CAS-xx` du §2 (et toute ligne `ANX-xx` du §4) est taguée dans au moins une spec `packages/app/src/e2e/*.e2e.ts` — **une fiche sans test fait échouer la CI** : un trou de couverture est visible en rouge, jamais caché ;
- tout tag présent dans une spec correspond à une fiche ou une ligne du cahier.

**Règles de mise à jour** : nouveau parcours métier (évolution de l'Excel) → créer la fiche et la référencer dans les feuilles concernées ; la CI reste rouge jusqu'à l'arrivée du test qui la couvre. Test supprimé ou renommé → répercuter ici. La CI échoue si les deux dérivent.

### Conditions de référence des specs E2E

Les specs conformité tournent avec l'entreprise de test SIREN `130025265`, **effectif GIP 250** (tranche « 250 et + », indicateur G requis toutes les années) sur l'année de campagne courante. La présence ou non d'un CSE est pilotée par `setCompanyHasCse(...)`, l'effectif GIP par `setGipWorkforce(...)`. Voir `packages/app/src/e2e/constants.ts` et `helpers/db.ts`. Sur le cadencement par année, voir §5.

---

## 2. Les fiches de cas (détail verbatim de l'Excel)

Une fiche par **parcours-type**. Chaque fiche a un ID court qui est l'**ancre du test E2E** — c'est la couche « test » ; la couche « désignation métier » est la coordonnée `AAAA-EFFMAX-CASNN` du §3, qui renvoie ici. Un même parcours-type se retrouve dans des dizaines de cellules (années × tranches) mais n'est défini — et testé — qu'une fois.

**Comment lire une fiche.** L'ID `CAS-NN` **reprend le numéro « Cas N » de l'Excel** (`CAS-04` ↔ « Cas 4 » des feuilles) ; le suffixe `-6IND` désigne la variante « 6 premiers indicateurs » (années sans indicateur G). Le titre énonce ensuite les **conditions qui définissent le cas** — nombre d'indicateurs (6 ou 7) · présence d'un CSE · issue du parcours — et le champ **« Libellé Excel »** rappelle le texte exact de la cellule d'origine. Exemple : `CAS-01` = *7 indicateurs, sans CSE, aucun écart ≥ 5 %* → il reprend « Cas 1 » des colonnes 7 indicateurs.

Les cas 1 et 2 existent donc en deux variantes selon l'année (voir §3) : `CAS-01`/`CAS-02` (7 indicateurs) et `CAS-01-6IND`/`CAS-02-6IND` (6 indicateurs, sans indicateur G donc sans parcours de conformité possible). Les cas 3 à 12 n'existent qu'en année « 7 indicateurs ».

Correspondances de vocabulaire (Excel → application) : « 7ᵉ indicateur » = indicateur G, l'écart de rémunération par catégorie de salariés (étape 5 du funnel) ; « Déclaration des 6 premiers indicateurs » = funnel sans l'étape 5 (indicateurs A à F) ; « Parcours de conformité » = page `/declaration-remuneration/parcours-conformite` ; « Nouvelle déclaration du 7ème indicateur » = seconde déclaration (étapes 1 à 3 du parcours actions correctives) ; « Dépot avis CSE » = flux `/avis-cse/etape/1..2` (étape 1 : avis rendus, étape 2 : dépôt des fichiers et matrice d'association) ; « Dépôt du rapport de l'évaluation conjointe » = upload PDF sur `/evaluation-conjointe`.

---

<a name="cas-01"></a>

### CAS-01 : 7 indicateurs · sans CSE · aucun écart ≥ 5 % → fin de démarche

**Libellé Excel** : « Cas 1 sans CSE et aucun écart ≥ 5% pour le 7ème indicateur »

- CSE : non
- Déclaration des 7 indicateurs

**Test E2E** : `compliance.e2e.ts` — `[CAS-01] Path 2` : déclaration complète → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-01\]"`

---

<a name="cas-02"></a>

### CAS-02 : 7 indicateurs · avec CSE · aucun écart ≥ 5 % → avis CSE

**Libellé Excel** : « Cas 2 avec CSE et aucun écart ≥ 5% pour le 7ème indicateur »

- CSE : oui
- Déclaration des 7 indicateurs
- Dépot avis CSE sur l'exactitude des données déclarées

**Test E2E** : `compliance.e2e.ts` — `[CAS-02] Path 1` : déclaration → `/avis-cse` → dépôt de l'avis → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-02\]"`

---

<a name="cas-03"></a>

### CAS-03 : 7 indicateurs · sans CSE · écart ≥ 5 % → justification des écarts

**Libellé Excel** : « Cas 3 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts »

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-03] Path 5.b` : choix justification sans CSE → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-03\]"`

---

<a name="cas-04"></a>

### CAS-04 : 7 indicateurs · avec CSE · écart ≥ 5 % → justification + avis CSE

**Libellé Excel** : « Cas 4 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts »

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : justification des écarts
- Dépot avis CSE sur l'exactitude des données déclarées et la justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-04] Path 3` : justification → avis CSE avec colonnes « Exactitude » + « Justification » → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-04\]"`

---

<a name="cas-05"></a>

### CAS-05 : 7 indicateurs · sans CSE · écart ≥ 5 % → évaluation conjointe

**Libellé Excel** : « Cas 5 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe »

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe

**Test E2E** : `compliance.e2e.ts` — `[CAS-05] Path 5` : éval. conjointe → upload du rapport → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-05\]"`

---

<a name="cas-06"></a>

### CAS-06 : 7 indicateurs · avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE

**Libellé Excel** : « Cas 6 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe »

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe
- Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-06] Path 4` : éval. conjointe → upload du rapport → avis CSE déposé → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-06\]"`

---

<a name="cas-07"></a>

### CAS-07 : 7 indicateurs · sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart

**Libellé Excel** : « Cas 7 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5% »

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur

**Test E2E** : `compliance.e2e.ts` — `[CAS-07] Path 7` : 2ᵉ déclaration sans écart → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-07\]"`

---

<a name="cas-08"></a>

### CAS-08 : 7 indicateurs · avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE

**Libellé Excel** : « Cas 8 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5% »

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Dépot avis CSE sur l'exactitude des données déclarées pour la 1ère et la 2ème déclaration, et éventuellement sur la justifications des écarts de la 1ère déclaration

**Test E2E** : `compliance.e2e.ts` — `[CAS-08] Path 6` : 2ᵉ déclaration sans écart → avis CSE en mode 2 déclarations (« Exactitude » 1ʳᵉ + 2ᵉ) → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-08\]"`

---

<a name="cas-09"></a>

### CAS-09 : 7 indicateurs · sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification

**Libellé Excel** : « Cas 9 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts »

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Parcours de conformité : justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-09] Path 9` : 2ᵉ tour → justification sans CSE → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-09\]"`

---

<a name="cas-10"></a>

### CAS-10 : 7 indicateurs · avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE

**Libellé Excel** : « Cas 10 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts »

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Parcours de conformité : justification des écarts
- Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ère déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ème déclaration

**Test E2E** : `compliance.e2e.ts` — `[CAS-10] Path 8` : 2ᵉ tour, options restreintes → justification → avis CSE 2 déclarations avec colonne « Justification » sur la 2ᵉ → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-10\]"`

---

<a name="cas-11"></a>

### CAS-11 : 7 indicateurs · sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe

**Libellé Excel** : « Cas 11 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe »

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe

**Test E2E** : `compliance.e2e.ts` — `[CAS-11] Path 11` : 2ᵉ tour → éval. conjointe → upload → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-11\]"`

---

<a name="cas-12"></a>

### CAS-12 : 7 indicateurs · avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE

**Libellé Excel** : « Cas 12 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe »

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe
- Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ère et la 2ème déclaration

**Test E2E** : `compliance.e2e.ts` — `[CAS-12] Path 10` : 2ᵉ tour → éval. conjointe → avis CSE en mode 2 déclarations → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-12\]"`

---

<a name="cas-01-6ind"></a>

### CAS-01-6IND : 6 premiers indicateurs · sans CSE

**Libellé Excel** : « Cas 1 sans CSE » *(colonnes « 6 premiers indicateurs » — pas d'indicateur G)*

- CSE : non
- Déclaration des 6 premiers indicateurs

**Test E2E** : `compliance.e2e.ts` — `[CAS-01-6IND] Path 14` : effectif GIP 120 (tranche 100-149), funnel en 5 étapes (étape catégories masquée), soumission → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-01-6IND\]"`

---

<a name="cas-02-6ind"></a>

### CAS-02-6IND : 6 premiers indicateurs · avec CSE · avis CSE « exactitude »

**Libellé Excel** : « Cas 2 avec CSE » *(colonnes « 6 premiers indicateurs » — pas d'indicateur G)*

- CSE : oui
- Déclaration des 6 premiers indicateurs
- Dépot avis CSE sur l'exactitude des données déclarées

**Test E2E** : `compliance.e2e.ts` — `[CAS-02-6IND] Path 15` : effectif GIP 120, funnel en 5 étapes, soumission → `/avis-cse` → dépôt de l'avis « exactitude » → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-02-6IND\]"`

---

<a name="cas-13"></a>

### CAS-13 : 7 indicateurs · tranche < 100 (sans CSE ni obligations d'écart) · aucun écart ≥ 5 % → fin de démarche directe

**Libellé Excel** : « Déclaration des 7 indicateurs » *(feuille « <50 et 50-99 » — cellules sans numéro de cas)*

- CSE : non applicable (pas de question CSE dans le parcours sous 100 salariés)
- Déclaration des 7 indicateurs (étape 5 incluse)
- Soumission → fin de démarche directe

**Test E2E** : `compliance.e2e.ts` — `[CAS-13]` : effectif GIP 30 (représentatif < 50), 7 indicateurs sans écart ≥ 5 %, soumission → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-13\]"`

---

<a name="cas-14"></a>

### CAS-14 : 7 indicateurs · tranche < 100 · au moins un écart ≥ 5 % → fin de démarche directe (aucune obligation déclenchée)

**Libellé Excel** : « Déclaration des 7 indicateurs » *(feuille « <50 et 50-99 » — parcours issu de l'arbitrage n° 3 : sous 100 salariés un écart ≥ 5 % ne déclenche aucune obligation)*

- CSE : non applicable
- Déclaration des 7 indicateurs avec au moins un écart ≥ 5 % sur l'indicateur G
- Ni parcours de conformité, ni seconde déclaration, ni évaluation conjointe, ni avis CSE → fin de démarche directe

**Test E2E** : `compliance.e2e.ts` — `[CAS-14]` : effectif GIP 30, écart ≥ 5 % à l'étape 5, soumission → aucune proposition de conformité → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-14\]"`

---

<a name="cas-13-6ind"></a>

### CAS-13-6IND : 6 premiers indicateurs · 50-99 → fin de démarche directe

**Libellé Excel** : « Déclaration des 6 premiers indicateurs » *(feuille « <50 et 50-99 » — ligne 50 à 99 salariés)*

- CSE : non applicable (différence avec `CAS-01-6IND` qui tourne en 100-149 avec la question CSE)
- Funnel sans étape 5 (indicateur G non applicable)
- Soumission → fin de démarche directe

**Test E2E** : `compliance.e2e.ts` — `[CAS-13-6IND]` : effectif GIP 75 (représentatif 50-99), funnel sans étape 5, soumission → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-13-6IND\]"`

---

## 3. Les feuilles de l'Excel, année par année

Miroir des quatre onglets du fichier. Placez-vous sur votre feuille et votre année : la cellule liste les cas à dérouler, chacun désigné par une **coordonnée autoportante** (cliquable vers sa fiche §2).

### Nomenclature des coordonnées

Chaque cas d'une cellule porte un identifiant `AAAA-EFFMAX-CASNN` qui le désigne sans ambiguïté en réunion (« on parle de 2027-249-CAS04 ») :

- `AAAA` — l'année de campagne (2027 → 2033) ;
- `EFFMAX` — l'effectif **maximum** de la tranche : `49` (< 50), `99` (50-99), `149` (100-149), `249` (150-249), `250P` (250 et plus) ;
- `CASNN` — le numéro de cas de la feuille Excel (`CAS01` → `CAS12`).

L'année et la tranche fixent déjà la variante « 6 ou 7 indicateurs », donc `2027-249-CAS01` (7 indicateurs) et `2028-249-CAS01` (6 indicateurs) sont deux parcours distincts sans qu'il faille de suffixe.

**Lecture d'une ligne de cellule** : `coordonnée : rappel`. Le texte après les deux-points est un **résumé** du cas (conditions · issue), pas une seconde information : `2027-149-CAS01 : sans CSE → fin de démarche directe` se lit « la coordonnée 2027-149-CAS01, qui correspond au parcours *sans CSE, fin de démarche directe* ». Cliquez la coordonnée pour la fiche complète (§2).

La coordonnée est **au-dessus des tests** : elle pointe vers la **fiche du parcours-type** (§2 — `CAS-01` … `CAS-12`, `CAS-01-6IND`, `CAS-02-6IND`) où vit le test E2E. Comme le contenu d'un cas ne dépend ni de l'année ni de la tranche, un même test couvre toutes les coordonnées qui pointent vers sa fiche — d'où ~14 tests pour toute la grille. Pour lancer **un** cas précis, ouvrez sa fiche : la commande `--grep` y est. Pour lancer **une configuration entière** :

- **Année « 7 indicateurs » (les 12 cas)** : `pnpm --filter app test:e2e --grep "\[CAS-(0[1-9]|1[0-2])\]"`
- **Année « 6 premiers indicateurs » (cas 1-2)** : `pnpm --filter app test:e2e --grep "\[CAS-0[12]-6IND\]"`
- **Tranches < 100** : `pnpm --filter app test:e2e --grep "\[CAS-1[34](-6IND)?\]"`

### Feuille « <50 et 50-99 »

Restitution verbatim (cette feuille ne prévoit ni cas CSE ni parcours de conformité — le CSE n'est requis qu'à partir de 100 salariés) :

| Taille entreprises | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
|---|---|---|---|---|---|---|---|
| Moins de 50 salariés (sur la base du volontariat) | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs |
| 50 à 99 salariés | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | **Déclaration des 7 indicateurs** | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | **Déclaration des 7 indicateurs** |

Les arbitrages du §6 étant rendus, chaque cellule porte désormais ses coordonnées et pointe vers une fiche du §2. Sous 100 salariés, il n'y a jamais de CSE ni de parcours de conformité : un écart ≥ 5 % ne déclenche aucune obligation, la démarche se termine directement (arbitrage n° 3).

*Ligne « Moins de 50 salariés »* — coordonnées préfixées `AAAA-49-…`, les 7 années identiques (7 indicateurs sur la base du volontariat).

| Année | Déclaration | Cas à dérouler (coordonnée — rappel) |
|---|---|---|
| 2027 | 7 indicateurs | Les 2 cas :<br>[2027-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2027-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2028 | 7 indicateurs | Les 2 cas :<br>[2028-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2028-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2029 | 7 indicateurs | Les 2 cas :<br>[2029-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2029-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2030 | 7 indicateurs | Les 2 cas :<br>[2030-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2030-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2031 | 7 indicateurs | Les 2 cas :<br>[2031-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2031-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2032 | 7 indicateurs | Les 2 cas :<br>[2032-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2032-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2033 | 7 indicateurs | Les 2 cas :<br>[2033-49-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2033-49-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |

*Ligne « 50 à 99 salariés »* — coordonnées préfixées `AAAA-99-…`. Assujetties chaque année dès 2027 : 6 premiers indicateurs, sauf en 2030 et 2033 (7 indicateurs).

| Année | Déclaration | Cas à dérouler (coordonnée — rappel) |
|---|---|---|
| 2027 | 6 premiers indicateurs | Le cas :<br>[2027-99-CAS13](#cas-13-6ind) : 6 premiers indicateurs → fin de démarche directe |
| 2028 | 6 premiers indicateurs | Le cas :<br>[2028-99-CAS13](#cas-13-6ind) : 6 premiers indicateurs → fin de démarche directe |
| 2029 | 6 premiers indicateurs | Le cas :<br>[2029-99-CAS13](#cas-13-6ind) : 6 premiers indicateurs → fin de démarche directe |
| **2030** | **7 indicateurs** | Les 2 cas :<br>[2030-99-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2030-99-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |
| 2031 | 6 premiers indicateurs | Le cas :<br>[2031-99-CAS13](#cas-13-6ind) : 6 premiers indicateurs → fin de démarche directe |
| 2032 | 6 premiers indicateurs | Le cas :<br>[2032-99-CAS13](#cas-13-6ind) : 6 premiers indicateurs → fin de démarche directe |
| **2033** | **7 indicateurs** | Les 2 cas :<br>[2033-99-CAS13](#cas-13) : aucun écart → fin de démarche directe<br>[2033-99-CAS14](#cas-14) : écart ≥ 5 % → fin de démarche directe (aucune obligation) |

### Feuille « 100-149 »

Coordonnées préfixées `AAAA-149-…`. Les années « 6 premiers indicateurs » (2027, 2028, 2029, 2031, 2032) sont identiques entre elles ; les années « 7 indicateurs » (2030, 2033) aussi.

| Année | Déclaration | Cas à dérouler (coordonnée — rappel) |
|---|---|---|
| 2027 | 6 premiers indicateurs | Les 2 cas :<br>[2027-149-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2027-149-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| 2028 | 6 premiers indicateurs | Les 2 cas :<br>[2028-149-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2028-149-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| 2029 | 6 premiers indicateurs | Les 2 cas :<br>[2029-149-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2029-149-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| **2030** | **7 indicateurs** | Les 12 cas :<br>[2030-149-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2030-149-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2030-149-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2030-149-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2030-149-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2030-149-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2030-149-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2030-149-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2030-149-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2030-149-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2030-149-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2030-149-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| 2031 | 6 premiers indicateurs | Les 2 cas :<br>[2031-149-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2031-149-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| 2032 | 6 premiers indicateurs | Les 2 cas :<br>[2032-149-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2032-149-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| **2033** | **7 indicateurs** | Les 12 cas :<br>[2033-149-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2033-149-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2033-149-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2033-149-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2033-149-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2033-149-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2033-149-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2033-149-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2033-149-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2033-149-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2033-149-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2033-149-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |

### Feuille « 150-249 »

Coordonnées préfixées `AAAA-249-…`. Les années « 7 indicateurs » (2027, 2030, 2033) sont identiques entre elles ; les années « 6 premiers indicateurs » (2028, 2029, 2031, 2032) aussi.

| Année | Déclaration | Cas à dérouler (coordonnée — rappel) |
|---|---|---|
| **2027** | **7 indicateurs** | Les 12 cas :<br>[2027-249-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2027-249-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2027-249-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2027-249-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2027-249-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2027-249-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2027-249-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2027-249-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2027-249-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2027-249-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2027-249-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2027-249-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| 2028 | 6 premiers indicateurs | Les 2 cas :<br>[2028-249-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2028-249-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| 2029 | 6 premiers indicateurs | Les 2 cas :<br>[2029-249-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2029-249-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| **2030** | **7 indicateurs** | Les 12 cas :<br>[2030-249-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2030-249-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2030-249-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2030-249-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2030-249-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2030-249-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2030-249-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2030-249-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2030-249-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2030-249-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2030-249-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2030-249-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| 2031 | 6 premiers indicateurs | Les 2 cas :<br>[2031-249-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2031-249-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| 2032 | 6 premiers indicateurs | Les 2 cas :<br>[2032-249-CAS01](#cas-01-6ind) : sans CSE → fin de démarche directe<br>[2032-249-CAS02](#cas-02-6ind) : avec CSE → avis CSE « exactitude » |
| **2033** | **7 indicateurs** | Les 12 cas :<br>[2033-249-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2033-249-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2033-249-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2033-249-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2033-249-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2033-249-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2033-249-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2033-249-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2033-249-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2033-249-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2033-249-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2033-249-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |

### Feuille « 250 et + »

Coordonnées préfixées `AAAA-250P-…`. Toutes les années suivent le même schéma (les 12 cas) ; une ligne par année pour que chaque coordonnée soit lisible telle quelle.

| Année | Déclaration | Cas à dérouler (coordonnée — rappel) |
|---|---|---|
| **2027** | **7 indicateurs** | Les 12 cas :<br>[2027-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2027-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2027-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2027-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2027-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2027-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2027-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2027-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2027-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2027-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2027-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2027-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2028** | **7 indicateurs** | Les 12 cas :<br>[2028-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2028-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2028-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2028-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2028-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2028-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2028-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2028-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2028-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2028-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2028-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2028-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2029** | **7 indicateurs** | Les 12 cas :<br>[2029-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2029-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2029-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2029-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2029-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2029-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2029-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2029-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2029-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2029-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2029-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2029-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2030** | **7 indicateurs** | Les 12 cas :<br>[2030-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2030-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2030-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2030-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2030-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2030-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2030-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2030-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2030-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2030-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2030-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2030-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2031** | **7 indicateurs** | Les 12 cas :<br>[2031-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2031-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2031-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2031-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2031-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2031-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2031-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2031-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2031-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2031-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2031-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2031-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2032** | **7 indicateurs** | Les 12 cas :<br>[2032-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2032-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2032-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2032-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2032-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2032-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2032-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2032-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2032-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2032-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2032-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2032-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |
| **2033** | **7 indicateurs** | Les 12 cas :<br>[2033-250P-CAS01](#cas-01) : sans CSE · aucun écart → fin de démarche<br>[2033-250P-CAS02](#cas-02) : avec CSE · aucun écart → avis CSE « exactitude »<br>[2033-250P-CAS03](#cas-03) : sans CSE · écart ≥ 5 % → justification des écarts<br>[2033-250P-CAS04](#cas-04) : avec CSE · écart ≥ 5 % → justification + avis CSE<br>[2033-250P-CAS05](#cas-05) : sans CSE · écart ≥ 5 % → évaluation conjointe<br>[2033-250P-CAS06](#cas-06) : avec CSE · écart ≥ 5 % → évaluation conjointe + avis CSE<br>[2033-250P-CAS07](#cas-07) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart<br>[2033-250P-CAS08](#cas-08) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. sans écart + avis CSE<br>[2033-250P-CAS09](#cas-09) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification<br>[2033-250P-CAS10](#cas-10) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → justification + avis CSE<br>[2033-250P-CAS11](#cas-11) : sans CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe<br>[2033-250P-CAS12](#cas-12) : avec CSE · écart ≥ 5 % → actions correctives, 2ᵉ décl. avec écart → évaluation conjointe + avis CSE |

**Règles de cadencement sous-jacentes** (implémentées dans `packages/app/src/modules/domain/shared/indicatorG.ts` et `companyObligation.ts`, couvertes par les tests unitaires `indicatorG.test.ts` et `companyObligation.test.ts`) : indicateur G requis chaque année sous 50 salariés (volontariat, 7 indicateurs) et dès 250 salariés ; les années triennales (2027, 2030, 2033) dès 150 salariés avant 2030 puis dès 50 salariés à partir de 2030 ; assujettissement annuel dès 50 salariés à partir de 2027 (6 premiers indicateurs pour les 50-99 hors années « indicateur G »).


---

## 4. Scénarios complémentaires hors Excel

Comportements testés en E2E qui ne figurent pas dans le fichier de Laetitia mais font partie du contrat du parcours :

| ID | Scénario | Test E2E |
|---|---|---|
| ANX-01 | Tâtonnement : changer de parcours de conformité avant toute action aval (le dernier choix gagne, les deux événements sont historisés) | `compliance-path-change.e2e.ts` |
| ANX-02 | Démarche terminée → toute navigation vers le parcours de conformité redirige | `compliance.e2e.ts` — `[ANX-02] Path 12` |
| ANX-03 | Bouton « Précédent » sur `/avis-cse` : retour contextuel selon l'état (récap étape 6, choix de parcours, récap 2ᵉ déclaration) | `compliance.e2e.ts` — `[ANX-03] Paths 13.a / 13.b / 13.c` |

Le socle déclaratif (étapes 1–6, brouillon, historique, panneau de démarche, deadlines de campagne, annulation, saut de l'étape 5 quand l'indicateur G ne s'applique pas…) est couvert par les autres specs (`declaration.e2e.ts`, `declarationDraft.e2e.ts`, `declaration-history.e2e.ts`, `declaration-process-panel.e2e.ts`, `campaign-deadlines-gating.e2e.ts`, `declaration-cancellation.e2e.ts`) — hors périmètre de ce cahier, qui trace les parcours du fichier Excel.

---

## 5. Limites de l'automatisation

Ce que les tests E2E ne peuvent pas rejouer tel quel, et comment c'est compensé :

1. **La dimension année de campagne** — les specs E2E tournent sur l'année de campagne courante, pas sur 2027 → 2033. Le *contenu* de chaque cellule de l'Excel (les parcours) est déroulé par les tests du §2 ; le *cadencement* (quelle année déclenche 6 ou 7 indicateurs pour quelle tranche) est verrouillé par les tests unitaires du domaine (`indicatorG.test.ts`, `companyObligation.test.ts`), qui couvrent chaque tranche × année de la matrice.
2. **La tranche d'effectif** — les parcours de conformité (cas 1 à 12) tournent en 250 et + (effectif GIP 250) ; les variantes 6 indicateurs (`CAS-01-6IND`, `CAS-02-6IND`) tournent avec un effectif GIP de 120, représentatif de la tranche 100-149 ; les nouveaux parcours < 100 tournent avec un effectif GIP de 30 (représentatif < 50) pour `CAS-13`/`CAS-14` et de 75 (représentatif 50-99) pour `CAS-13-6IND`.
3. **Avis CSE défavorables** — tous les tests déposent des avis « favorable » ; les variantes « défavorable » (sans impact de routage attendu, mais affichées au récapitulatif) ne sont pas déroulées.

---

## 6. Arbitrages métier (divergences résolues)

Les 3 divergences relevées en transcrivant le fichier Excel ont été arbitrées par le métier (juillet 2026) et répercutées dans le code, les miroirs SQL et le moteur de règles par #4043.

1. **Moins de 50 salariés (volontariat)** — déclarent **les 7 indicateurs chaque année**, indicateur G compris. La déclaration reste volontaire ; c'est son *contenu* qui change. *Statut : répercutée dans le code par #4043 (`isIndicatorGRequired` renvoie `true` sous 50 salariés, toutes années).*
2. **50 à 99 salariés** — sont assujetties **chaque année** dès 2027 : les **6 premiers indicateurs** en 2027, 2028, 2029, 2031 et 2032, et les **7 indicateurs** en **2030 et 2033**. *Statut : répercutée dans le code par #4043 (`isObligatedForYear` assujettit les 50-99 chaque année dès `V2_FIRST_CAMPAIGN_YEAR`).*
3. **Sous 100 salariés en année « 7 indicateurs »** — les tranches < 100 (50-99 comprises en 2030/2033, et les < 50 volontaires) ne sont **pas** concernées par les obligations déclenchées par un écart ≥ 5 % : pas de parcours de conformité, pas de seconde déclaration, pas de rapport d'évaluation conjointe, pas d'avis CSE. Le seuil de ces obligations reste **100 salariés**. *Statut : le code était déjà conforme — le seuil 100 vit dans `isComplianceProcessRequired`/`isCseOpinionRequired` (domaine) et `phase2Required`/`cseRequired` (moteur de règles) ; la divergence décrivait un état antérieur du code (« sans condition de tranche ») qui n'existe plus. Verrouillée par des tests, sans changement de comportement.*
