# Cahier de tests — parcours de déclaration des écarts de rémunération

Cahier de tests métier, maintenu **en corrélation avec les tests E2E** (issue [#3986](https://github.com/SocialGouv/egapro/issues/3986)).

Ce document est le **miroir versionné du fichier `Parcours.xlsx` de Laetitia** (juillet 2026) : chaque feuille, chaque année de campagne (2027 → 2033) et chaque cellule du fichier s'y retrouve, avec ses libellés d'origine. Il remplace l'Excel comme outil de suivi : le métier y lit les parcours à tester, et chaque parcours pointe vers le test E2E qui l'automatise. **En cas d'évolution de l'Excel, c'est ce document qu'il faut mettre à jour**, puis les tests.

Audience : équipe métier / PO (référence d'acceptance et suivi des tests) et développeurs (traçabilité scénarios ↔ tests).

> Ce document complète [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md) (narration des flux) : ici on liste **quoi tester**, pas comment l'utilisateur vit le parcours.

## Sommaire

1. [Comment ce cahier reste corrélé aux tests E2E](#1-comment-ce-cahier-reste-corrélé-aux-tests-e2e)
2. [Référentiel des parcours à tester (détail des cas de l'Excel)](#2-référentiel-des-parcours-à-tester-détail-des-cas-de-lexcel)
3. [Les feuilles de l'Excel, année par année](#3-les-feuilles-de-lexcel-année-par-année)
4. [Scénarios complémentaires hors Excel](#4-scénarios-complémentaires-hors-excel)
5. [Limites de l'automatisation](#5-limites-de-lautomatisation)
6. [Divergences Excel ↔ code à arbitrer](#6-divergences-excel--code-à-arbitrer)

---

## 1. Comment ce cahier reste corrélé aux tests E2E

Chaque parcours à tester a un **identifiant stable** (`CAS-xx` pour les cas de l'Excel, avec le suffixe `-6IND` pour leurs variantes « 6 premiers indicateurs » ; `ANX-xx` pour les scénarios complémentaires). Le contrat est simple :

> **Tous les parcours du fichier Excel sont dans ce cahier, et la CI n'est verte que quand chaque ligne du référentiel (§2) a son test E2E.**

Les cellules de l'Excel se **regroupent** : un même cas se répète dans plusieurs feuilles et plusieurs années (ex. le cas 4 apparaît en 2027/2030/2033 pour les 150-249, en 2030/2033 pour les 100-149, et toutes les années pour les 250 et +). Le référentiel (§2) définit chaque parcours **une seule fois**, avec son test ; les sections par feuille (§3) relient chaque cellule de l'Excel à son ID. Le métier peut ainsi lire : « campagne 2030, tranche 100-149 → CAS-01 à CAS-12, automatisés par tels tests ».

1. **Côté tests** : le titre du `test.describe(...)` qui couvre un parcours porte le tag entre crochets, ex. `test.describe("[CAS-02] Path 1: no gap + hasCse → ...")`. Un même describe peut porter plusieurs tags.
2. **Côté cahier** : la colonne « Test E2E » du référentiel décrit ce que le test déroule réellement — y compris, honnêtement, ce qu'il ne déroule pas encore. Cette profondeur se juge en revue de PR ; l'outillage, lui, ne vérifie que l'existence.

Le script [`packages/app/scripts/check-cahier.mjs`](../packages/app/scripts/check-cahier.mjs) (`pnpm --filter app check:cahier`, exécuté en CI) vérifie que :

- toute ligne `CAS-xx` / `ANX-xx` du référentiel est taguée dans au moins une spec `packages/app/src/e2e/*.e2e.ts` — **une ligne sans test fait échouer la CI** : un trou de couverture est visible en rouge, jamais caché ;
- tout tag présent dans une spec correspond à une ligne du cahier.

**Règles de mise à jour** : nouveau parcours métier (évolution de l'Excel) → ajouter la ligne au référentiel et la référencer dans les feuilles concernées ; la CI reste rouge jusqu'à l'arrivée du test qui la couvre. Test supprimé ou renommé → répercuter ici. La CI échoue si les deux dérivent.

### Conditions de référence des specs E2E

Les specs conformité tournent avec l'entreprise de test SIREN `130025265`, **effectif GIP 250** (tranche « 250 et + », indicateur G requis toutes les années) sur l'année de campagne courante. La présence ou non d'un CSE est pilotée par `setCompanyHasCse(...)`, l'effectif GIP par `setGipWorkforce(...)`. Voir `packages/app/src/e2e/constants.ts` et `helpers/db.ts`. Sur le cadencement par année, voir §5.

---

## 2. Référentiel des parcours à tester (détail des cas de l'Excel)

Chaque ligne reprend **verbatim** les étapes de la cellule correspondante de l'Excel (feuilles « 100-149 », « 150-249 », « 250 et + » — les libellés y sont identiques). Les correspondances de vocabulaire Excel → application sont rappelées en bas de section.

Les cas 1 et 2 existent en deux variantes selon l'année (voir §3) : années « 7 indicateurs » (`CAS-01`, `CAS-02`) et années « 6 premiers indicateurs » (`CAS-01-6IND`, `CAS-02-6IND`, sans indicateur G donc sans parcours de conformité possible). Les cas 3 à 12 n'existent qu'en année « 7 indicateurs ».

| ID | Cas de l'Excel | Parcours à dérouler (verbatim Excel) | Test E2E |
|---|---|---|---|
| CAS-01 | Cas 1 sans CSE et aucun écart ≥ 5% pour le 7ème indicateur | CSE : non<br>• Déclaration des 7 indicateurs | `compliance.e2e.ts` — `[CAS-01] Path 2` : déclaration complète → `/confirmation` |
| CAS-02 | Cas 2 avec CSE et aucun écart ≥ 5% pour le 7ème indicateur | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Dépot avis CSE sur l'exactitude des données déclarées | `compliance.e2e.ts` — `[CAS-02] Path 1` : déclaration → `/avis-cse` → dépôt de l'avis → confirmation |
| CAS-03 | Cas 3 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts | CSE : non<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : justification des écarts | `compliance.e2e.ts` — `[CAS-03] Path 5` : l'option « Justifier » est proposée sans CSE ; le flux complet n'est pas déroulé |
| CAS-04 | Cas 4 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et justification des écarts | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : justification des écarts<br>• Dépot avis CSE sur l'exactitude des données déclarées et la justification des écarts | `compliance.e2e.ts` — `[CAS-04] Path 3` : choix justification → `/avis-cse/etape/1` ; dépôt de l'avis « exactitude + justification » non déroulé |
| CAS-05 | Cas 5 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe | CSE : non<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : évaluation conjointe<br>• Dépôt du rapport de l'évaluation conjointe | `compliance.e2e.ts` — `[CAS-03][CAS-05] Path 5` : éval. conjointe → upload du rapport → `/confirmation` |
| CAS-06 | Cas 6 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur et évaluation conjointe | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : évaluation conjointe<br>• Dépôt du rapport de l'évaluation conjointe<br>• Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts | `compliance.e2e.ts` — `[CAS-06] Path 4` : éval. conjointe → upload → `/avis-cse` ; dépôt de l'avis non déroulé |
| CAS-07 | Cas 7 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5% | CSE : non<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur | `compliance.e2e.ts` — `[CAS-07] Path 7` : 2ᵉ déclaration sans écart → `/confirmation` |
| CAS-08 | Cas 8 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec aucun écart ≥ 5% | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur<br>• Dépot avis CSE sur l'exactitude des données déclarées pour la 1ère et la 2ème déclaration, et éventuellement sur la justifications des écarts de la 1ère déclaration | `compliance.e2e.ts` — `[CAS-08] Path 6` : 2ᵉ déclaration sans écart → `/avis-cse` ; dépôt de l'avis 2-déclarations non déroulé |
| CAS-09 | Cas 9 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts | CSE : non<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur<br>• Parcours de conformité : justification des écarts | **Aucun test** — le 2ᵉ tour n'est testé qu'avec CSE (CAS-10) ; la CI est rouge tant que ce test n'existe pas |
| CAS-10 | Cas 10 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et justification des écarts | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur<br>• Parcours de conformité : justification des écarts<br>• Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ère déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ème déclaration | `compliance.e2e.ts` — `[CAS-10] Path 8` : 2ᵉ tour, options restreintes, justification → `/avis-cse/etape/1` ; dépôt de l'avis non déroulé |
| CAS-11 | Cas 11 sans CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe | CSE : non<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur<br>• Parcours de conformité : évaluation conjointe<br>• Dépôt du rapport de l'évaluation conjointe | `compliance.e2e.ts` — `[CAS-11] Path 11` : 2ᵉ tour → éval. conjointe → upload → `/confirmation` |
| CAS-12 | Cas 12 avec CSE, au moins un écart ≥ 5% pour le 7ème indicateur, actions correctives-nouvelle déclaration avec au moins un écart ≥ 5% et évaluation conjointe | CSE : oui<br>• Déclaration des 7 indicateurs<br>• Parcours de conformité : actions correctives et nouvelle déclaration<br>• Nouvelle déclaration du 7ème indicateur<br>• Parcours de conformité : évaluation conjointe<br>• Dépôt du rapport de l'évaluation conjointe<br>• Dépot avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ère et la 2ème déclaration | `compliance.e2e.ts` — `[CAS-12] Path 10` : 2ᵉ tour → éval. conjointe → upload → `/avis-cse` ; dépôt de l'avis non déroulé |
| CAS-01-6IND | Cas 1 sans CSE *(années « 6 premiers indicateurs »)* | CSE : non<br>• Déclaration des 6 premiers indicateurs | **Aucun test** — la soumission complète en 6 indicateurs (étape catégories masquée, aucun parcours de conformité proposé) n'est pas déroulée ; la CI est rouge tant que ce test n'existe pas |
| CAS-02-6IND | Cas 2 avec CSE *(années « 6 premiers indicateurs »)* | CSE : oui<br>• Déclaration des 6 premiers indicateurs<br>• Dépot avis CSE sur l'exactitude des données déclarées | **Aucun test** — idem, variante avec dépôt d'avis CSE ; la CI est rouge tant que ce test n'existe pas |

**Correspondances de vocabulaire** (Excel → application) : « 7ᵉ indicateur » = indicateur G, l'écart de rémunération par catégorie de salariés (étape 5 du funnel) ; « Déclaration des 6 premiers indicateurs » = funnel sans l'étape 5 (indicateurs A à F) ; « Parcours de conformité » = page `/declaration-remuneration/parcours-conformite` ; « Nouvelle déclaration du 7ème indicateur » = seconde déclaration (étapes 1 à 3 du parcours actions correctives) ; « Dépot avis CSE » = flux `/avis-cse/etape/1..2` (étape 1 : avis rendus, étape 2 : dépôt des fichiers et matrice d'association) ; « Dépôt du rapport de l'évaluation conjointe » = upload PDF sur `/evaluation-conjointe`.

---

## 3. Les feuilles de l'Excel, année par année

Miroir des quatre onglets du fichier. Chaque cellule est restituée par l'ID du parcours correspondant du référentiel (§2) — c'est le lien cellule → test.

### Feuille « <50 et 50-99 »

Restitution verbatim (cette feuille ne prévoit ni cas CSE ni parcours de conformité — le CSE n'est requis qu'à partir de 100 salariés) :

| Taille entreprises | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
|---|---|---|---|---|---|---|---|
| Moins de 50 salariés (sur la base du volontariat) | Déclaration des 7 indicateurs | idem | idem | idem | idem | idem | idem |
| 50 à 99 salariés | Déclaration des 6 premiers indicateurs | idem | idem | **Déclaration des 7 indicateurs** | 6 premiers | 6 premiers | **7 indicateurs** |

⚠️ Ces deux lignes sont **suspendues aux arbitrages métier du §6** (divergences 1 à 3 : volontariat < 50 avec ou sans indicateur G, assujettissement des 50-99 hors années triennales, parcours de conformité des 50-99 en année 7 indicateurs). Elles n'ont pas d'ID de parcours testable tant que ces points ne sont pas tranchés — les trancher, puis créer les IDs et les tests.

### Feuille « 100-149 »

| Année | Déclaration | Parcours à tester (IDs du §2) |
|---|---|---|
| 2027 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| 2028 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| 2029 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| **2030** | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas) |
| 2031 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| 2032 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| **2033** | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas) |

### Feuille « 150-249 »

| Année | Déclaration | Parcours à tester (IDs du §2) |
|---|---|---|
| **2027** | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas) |
| 2028 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| 2029 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| **2030** | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas) |
| 2031 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| 2032 | 6 premiers indicateurs | CAS-01-6IND, CAS-02-6IND |
| **2033** | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas) |

### Feuille « 250 et + »

| Année | Déclaration | Parcours à tester (IDs du §2) |
|---|---|---|
| 2027 → 2033 (chaque année) | **7 indicateurs** | **CAS-01 à CAS-12** (les 12 cas, à l'identique toutes les années) |

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
