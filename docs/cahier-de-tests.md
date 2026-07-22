# Cahier de tests — parcours de déclaration des écarts de rémunération

Cahier de tests métier, maintenu **en corrélation avec les tests E2E** (issue [#3986](https://github.com/SocialGouv/egapro/issues/3986)).

Ce document est le **miroir versionné du fichier `Parcours.xlsx` de Laetitia** (juillet 2026) : chaque feuille, chaque année de campagne (2027 → 2033) et chaque cellule du fichier s'y retrouve, avec ses libellés d'origine. Il remplace l'Excel comme outil de suivi : le métier y lit les parcours à tester, et chaque parcours pointe vers le test E2E qui l'automatise. **En cas d'évolution de l'Excel, c'est ce document qu'il faut mettre à jour**, puis les tests.

**Mode d'emploi** : placez-vous sur votre feuille et votre année au §3 — la ligne donne les cas à dérouler (avec leur résumé), la commande qui exécute exactement ces tests, et chaque cas est cliquable vers sa fiche détaillée (§2, étapes verbatim de l'Excel).

Audience : équipe métier / PO (référence d'acceptance et suivi des tests) et développeurs (traçabilité scénarios ↔ tests).

> Ce document complète [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md) (narration des flux) : ici on liste **quoi tester**, pas comment l'utilisateur vit le parcours.

## Sommaire

1. [Comment ce cahier reste corrélé aux tests E2E](#1-comment-ce-cahier-reste-corrélé-aux-tests-e2e)
2. [Les fiches de cas (détail verbatim de l'Excel)](#2-les-fiches-de-cas-détail-verbatim-de-lexcel)
3. [Les feuilles de l'Excel, année par année](#3-les-feuilles-de-lexcel-année-par-année)
4. [Scénarios complémentaires hors Excel](#4-scénarios-complémentaires-hors-excel)
5. [Limites de l'automatisation](#5-limites-de-lautomatisation)
6. [Divergences Excel ↔ code à arbitrer](#6-divergences-excel--code-à-arbitrer)

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

Une fiche par cas, avec les étapes **verbatim** des cellules de l'Excel (feuilles « 100-149 », « 150-249 », « 250 et + » — les libellés y sont identiques). Les cas 1 et 2 existent en deux variantes selon l'année (voir §3) : années « 7 indicateurs » (`CAS-01`, `CAS-02`) et années « 6 premiers indicateurs » (`CAS-01-6IND`, `CAS-02-6IND`, sans indicateur G donc sans parcours de conformité possible). Les cas 3 à 12 n'existent qu'en année « 7 indicateurs ».

Correspondances de vocabulaire (Excel → application) : « 7ᵉ indicateur » = indicateur G, l'écart de rémunération par catégorie de salariés (étape 5 du funnel) ; « Déclaration des 6 premiers indicateurs » = funnel sans l'étape 5 (indicateurs A à F) ; « Parcours de conformité » = page `/declaration-remuneration/parcours-conformite` ; « Nouvelle déclaration du 7ème indicateur » = seconde déclaration (étapes 1 à 3 du parcours actions correctives) ; « Dépot avis CSE » = flux `/avis-cse/etape/1..2` (étape 1 : avis rendus, étape 2 : dépôt des fichiers et matrice d'association) ; « Dépôt du rapport de l'évaluation conjointe » = upload PDF sur `/evaluation-conjointe`.

---

<a name="cas-01"></a>

### CAS-01 — Cas 1 sans CSE et aucun écart ≥ 5% pour le 7ème indicateur

- CSE : non
- Déclaration des 7 indicateurs

**Test E2E** : `compliance.e2e.ts` — `[CAS-01] Path 2` : déclaration complète → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-01\]"`

---

<a name="cas-02"></a>

### CAS-02 — Cas 2 avec CSE et aucun écart ≥ 5% pour le 7ème indicateur

- CSE : oui
- Déclaration des 7 indicateurs
- Dépot avis CSE sur l'exactitude des données déclarées

**Test E2E** : `compliance.e2e.ts` — `[CAS-02] Path 1` : déclaration → `/avis-cse` → dépôt de l'avis → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-02\]"`

---

<a name="cas-03"></a>

### CAS-03 — Cas 3 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-03] Path 5.b` : choix justification sans CSE → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-03\]"`

---

<a name="cas-04"></a>

### CAS-04 — Cas 4 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : justification des écarts
- Dépot avis CSE sur l'exactitude des données déclarées et la justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-04] Path 3` : justification → avis CSE avec colonnes « Exactitude » + « Justification » → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-04\]"`

---

<a name="cas-05"></a>

### CAS-05 — Cas 5 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe

**Test E2E** : `compliance.e2e.ts` — `[CAS-05] Path 5` : éval. conjointe → upload du rapport → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-05\]"`

---

<a name="cas-06"></a>

### CAS-06 — Cas 6 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : évaluation conjointe
- Dépôt du rapport de l'évaluation conjointe
- Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-06] Path 4` : éval. conjointe → upload du rapport → avis CSE déposé → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-06\]"`

---

<a name="cas-07"></a>

### CAS-07 — Cas 7 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5%

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur

**Test E2E** : `compliance.e2e.ts` — `[CAS-07] Path 7` : 2ᵉ déclaration sans écart → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-07\]"`

---

<a name="cas-08"></a>

### CAS-08 — Cas 8 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5%

- CSE : oui
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Dépot avis CSE sur l'exactitude des données déclarées pour la 1ère et la 2ème déclaration, et éventuellement sur la justifications des écarts de la 1ère déclaration

**Test E2E** : `compliance.e2e.ts` — `[CAS-08] Path 6` : 2ᵉ déclaration sans écart → avis CSE en mode 2 déclarations (« Exactitude » 1ʳᵉ + 2ᵉ) → confirmation.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-08\]"`

---

<a name="cas-09"></a>

### CAS-09 — Cas 9 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts

- CSE : non
- Déclaration des 7 indicateurs
- Parcours de conformité : actions correctives et nouvelle déclaration
- Nouvelle déclaration du 7ème indicateur
- Parcours de conformité : justification des écarts

**Test E2E** : `compliance.e2e.ts` — `[CAS-09] Path 9` : 2ᵉ tour → justification sans CSE → fin de démarche directe → `/confirmation`.
**Exécuter** : `pnpm --filter app test:e2e --grep "\[CAS-09\]"`

---

<a name="cas-10"></a>

### CAS-10 — Cas 10 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts

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

### CAS-11 — Cas 11 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe

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

### CAS-12 — Cas 12 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe

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

### CAS-01-6IND — Cas 1 sans CSE *(années « 6 premiers indicateurs »)*

- CSE : non
- Déclaration des 6 premiers indicateurs

**Test E2E** : **aucun test** — la soumission complète en 6 indicateurs (étape catégories masquée, aucun parcours de conformité proposé) n'est pas déroulée ; la CI est rouge tant que ce test n'existe pas.

---

<a name="cas-02-6ind"></a>

### CAS-02-6IND — Cas 2 avec CSE *(années « 6 premiers indicateurs »)*

- CSE : oui
- Déclaration des 6 premiers indicateurs
- Dépot avis CSE sur l'exactitude des données déclarées

**Test E2E** : **aucun test** — la soumission complète en 6 indicateurs avec dépôt de l'avis CSE « exactitude » n'est pas déroulée ; la CI est rouge tant que ce test n'existe pas.

---

## 3. Les feuilles de l'Excel, année par année

Miroir des quatre onglets du fichier. Placez-vous sur votre feuille et votre année : la ligne donne les cas à dérouler (cliquables vers leur fiche §2) et la commande qui exécute exactement ces tests.

Les deux jeux de cas se répètent d'une cellule à l'autre ; leurs commandes :

- **Année « 7 indicateurs » (les 12 cas)** : `pnpm --filter app test:e2e --grep "\[CAS-(0[1-9]|1[0-2])\]"`
- **Année « 6 premiers indicateurs » (cas 1-2)** : `pnpm --filter app test:e2e --grep "\[CAS-0[12]-6IND\]"`

### Feuille « <50 et 50-99 »

Restitution verbatim (cette feuille ne prévoit ni cas CSE ni parcours de conformité — le CSE n'est requis qu'à partir de 100 salariés) :

| Taille entreprises | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
|---|---|---|---|---|---|---|---|
| Moins de 50 salariés (sur la base du volontariat) | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs | Déclaration des 7 indicateurs |
| 50 à 99 salariés | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | **Déclaration des 7 indicateurs** | Déclaration des 6 premiers indicateurs | Déclaration des 6 premiers indicateurs | **Déclaration des 7 indicateurs** |

⚠️ Ces deux lignes sont **suspendues aux arbitrages métier du §6** (divergences 1 à 3 : volontariat < 50 avec ou sans indicateur G, assujettissement des 50-99 hors années triennales, parcours de conformité des 50-99 en année 7 indicateurs). Elles n'ont pas de fiche testable tant que ces points ne sont pas tranchés — les trancher, puis créer les fiches et les tests.

### Feuille « 100-149 »

Les années « 6 premiers indicateurs » (2027, 2028, 2029, 2031, 2032) sont identiques entre elles ; les années « 7 indicateurs » (2030, 2033) aussi.

| Année | Déclaration | Cas à dérouler |
|---|---|---|
| 2027 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| 2028 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| 2029 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| **2030** | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |
| 2031 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| 2032 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| **2033** | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |

### Feuille « 150-249 »

Les années « 7 indicateurs » (2027, 2030, 2033) sont identiques entre elles ; les années « 6 premiers indicateurs » (2028, 2029, 2031, 2032) aussi.

| Année | Déclaration | Cas à dérouler |
|---|---|---|
| **2027** | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |
| 2028 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| 2029 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| **2030** | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |
| 2031 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| 2032 | 6 premiers indicateurs | [CAS-01-6IND](#cas-01-6ind) sans CSE — fin de démarche directe<br>[CAS-02-6IND](#cas-02-6ind) avec CSE — avis CSE « exactitude » |
| **2033** | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |

### Feuille « 250 et + »

Toutes les années sont identiques : les 12 cas, chaque année.

| Année | Déclaration | Cas à dérouler |
|---|---|---|
| 2027 → 2033 (chaque année) | **7 indicateurs** | Les 12 cas :<br>[CAS-01](#cas-01) sans CSE, aucun écart — fin de démarche<br>[CAS-02](#cas-02) avec CSE, aucun écart — avis CSE « exactitude »<br>[CAS-03](#cas-03) sans CSE — justification des écarts<br>[CAS-04](#cas-04) avec CSE — justification + avis CSE<br>[CAS-05](#cas-05) sans CSE — éval. conjointe + rapport<br>[CAS-06](#cas-06) avec CSE — éval. conjointe + rapport + avis CSE<br>[CAS-07](#cas-07) sans CSE — actions correctives, 2ᵉ décl. sans écart<br>[CAS-08](#cas-08) avec CSE — actions correctives, 2ᵉ décl. sans écart + avis CSE sur les 2 décl.<br>[CAS-09](#cas-09) sans CSE — 2ᵉ décl. avec écart → justification<br>[CAS-10](#cas-10) avec CSE — 2ᵉ décl. avec écart → justification + avis CSE sur les 2 décl.<br>[CAS-11](#cas-11) sans CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport<br>[CAS-12](#cas-12) avec CSE — 2ᵉ décl. avec écart → éval. conjointe + rapport + avis CSE sur les 2 décl. |

**Règles de cadencement sous-jacentes** (implémentées dans `packages/app/src/modules/domain/shared/indicatorG.ts` et `companyObligation.ts`, couvertes par les tests unitaires `indicatorG.test.ts` et `companyObligation.test.ts`) : indicateur G requis chaque année dès 250 salariés ; les années triennales (2027, 2030, 2033) dès 150 salariés avant 2030 puis dès 50 salariés à partir de 2030.

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
2. **La tranche d'effectif** — les specs conformité tournent en 250 et + (effectif GIP 250) ; les variantes 6 indicateurs doivent tourner avec un effectif GIP dans la tranche 100-149 pour être représentatives.
3. **Avis CSE défavorables** — tous les tests déposent des avis « favorable » ; les variantes « défavorable » (sans impact de routage attendu, mais affichées au récapitulatif) ne sont pas déroulées.

---

## 6. Divergences Excel ↔ code à arbitrer

Constats faits en transcrivant le fichier (état du code : branche `alpha`, juillet 2026). À trancher avec le métier, puis répercuter ici **et** dans le code/les tests :

1. **< 50 salariés** : l'Excel affiche « Déclaration des 7 indicateurs » (volontariat) chaque année ; le code n'inclut jamais l'indicateur G sous 50 salariés (`isIndicatorGRequired` → false, donc `getApplicableIndicators` renvoie 6 indicateurs). Un déclarant volontaire n'aurait donc que 6 indicateurs.
2. **50 – 99, années hors cadence** (2028, 2029, 2031, 2032) : l'Excel affiche « Déclaration des 6 premiers indicateurs » ; le code ne les assujettit pas du tout ces années-là (`isObligatedForYear` → false hors 2027/2030/2033). S'agit-il d'une déclaration volontaire possible chaque année ?
3. **50 – 99 en 2030/2033 avec écart ≥ 5 %** : l'Excel ne prévoit aucun parcours de conformité pour cette tranche ; côté code, le parcours se déclenche dès que l'indicateur G est requis et qu'un écart ≥ 5 % existe, sans condition de tranche (`Step6Review.tsx` → `isComplianceProcessRequired`). Confirmer le comportement attendu pour une 50-99 en année « 7 indicateurs ».
