# Cahier de tests — parcours de déclaration des écarts de rémunération

Catalogue des scénarios métier à tester, maintenu **en corrélation avec les tests E2E** (issue [#3986](https://github.com/SocialGouv/egapro/issues/3986)).

Source métier : fichier `Parcours.xlsx` de Laetitia (juillet 2026), qui décrit pour chaque taille d'entreprise et chaque année de campagne (2027 → 2033) les parcours applicables. Ce document en est la transcription versionnée : **en cas d'évolution du fichier Excel, c'est ce document qu'il faut mettre à jour**, puis les statuts de couverture.

Audience : équipe métier / PO (référence d'acceptance) et développeurs (traçabilité scénarios ↔ tests).

> Ce document complète [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md) (narration des flux) : ici on liste **quoi tester**, pas comment l'utilisateur vit le parcours.

## Sommaire

1. [Comment ce cahier reste corrélé aux tests E2E](#1-comment-ce-cahier-reste-corrélé-aux-tests-e2e)
2. [Les 12 cas de parcours (entreprises ≥ 100 salariés)](#2-les-12-cas-de-parcours-entreprises--100-salariés)
3. [Matrice taille d'entreprise × année (2027–2033)](#3-matrice-taille-dentreprise--année-2027-2033)
4. [Scénarios complémentaires hors Excel](#4-scénarios-complémentaires-hors-excel)
5. [Trous de couverture connus](#5-trous-de-couverture-connus)
6. [Divergences Excel ↔ code à arbitrer](#6-divergences-excel--code-à-arbitrer)

---

## 1. Comment ce cahier reste corrélé aux tests E2E

Chaque scénario a un **identifiant stable** (`CAS-xx` pour les 12 cas métier, `ANX-xx` pour les scénarios complémentaires). La corrélation repose sur deux conventions :

1. **Côté tests** : le titre du `test.describe(...)` qui couvre un scénario porte le tag entre crochets, ex. `test.describe("[CAS-02] Path 1: no gap + hasCse → ...")`. Un même describe peut porter plusieurs tags.
2. **Côté cahier** : les tableaux ci-dessous donnent, pour chaque scénario, le statut de couverture :
   - ✅ **Couvert** — le flux principal est déroulé de bout en bout par au moins un test E2E ;
   - 🟡 **Partiel** — le routage est couvert mais une partie du flux (ex. dépôt d'avis CSE) n'est pas déroulée ;
   - ❌ **Non couvert** — aucun test E2E.

Le script [`packages/app/scripts/check-cahier.mjs`](../packages/app/scripts/check-cahier.mjs) (`pnpm --filter app check:cahier`, exécuté en CI) vérifie que :

- tout scénario marqué ✅ ou 🟡 est tagué dans au moins une spec `packages/app/src/e2e/*.e2e.ts` ;
- tout tag présent dans une spec correspond à un scénario déclaré ici, non marqué ❌ (si vous couvrez un scénario ❌, passez-le ✅/🟡 ici).

**Règles de mise à jour** : nouveau scénario métier → ajouter une ligne ici (❌ par défaut) ; nouveau test E2E couvrant un scénario → taguer le describe **et** passer le statut à ✅/🟡 ; test supprimé/renommé → répercuter ici. La CI échoue si les deux dérivent.

### Conditions de référence des specs E2E

Les specs conformité tournent avec l'entreprise de test SIREN `130025265`, **effectif GIP 250** (tranche « 250 et + », indicateur G requis toutes les années) sur l'année de campagne courante. La présence ou non d'un CSE est pilotée par `setCompanyHasCse(...)`. Voir `packages/app/src/e2e/constants.ts` et `helpers/db.ts`.

---

## 2. Les 12 cas de parcours (entreprises ≥ 100 salariés)

Les feuilles « 100-149 », « 150-249 » et « 250 et + » de l'Excel déclinent les mêmes 12 cas, croisant : présence d'un CSE × issue du 7ᵉ indicateur (indicateur G, écarts par catégorie) × parcours de conformité choisi.

Les années « 6 premiers indicateurs » (voir matrice §3) ne déclenchent que les cas 1 et 2 (pas d'indicateur G, donc pas de parcours de conformité).

| ID | CSE | Scénario | Dépôts attendus | Couverture E2E | Statut |
|---|---|---|---|---|---|
| CAS-01 | non | Aucun écart ≥ 5 % sur l'indicateur G → fin de démarche | — | `compliance.e2e.ts` Path 2 (déclaration complète → `/confirmation`) | ✅ Couvert |
| CAS-02 | oui | Aucun écart ≥ 5 % → avis CSE | Avis CSE « exactitude des données » | `compliance.e2e.ts` Path 1 (déclaration → `/avis-cse` → dépôt avis → confirmation) | ✅ Couvert |
| CAS-03 | non | ≥ 1 écart ≥ 5 % → justification des écarts | Justification des écarts | `compliance.e2e.ts` Path 5 (l'option « Justifier » est proposée sans CSE) ; le flux complet de justification sans CSE n'est pas déroulé | 🟡 Partiel |
| CAS-04 | oui | ≥ 1 écart ≥ 5 % → justification des écarts | Justification + avis CSE « exactitude + justification » | `compliance.e2e.ts` Path 3 (choix parcours → justification → `/avis-cse/etape/1`) ; dépôt de l'avis « exactitude + justification » non déroulé | 🟡 Partiel |
| CAS-05 | non | ≥ 1 écart ≥ 5 % → évaluation conjointe | Rapport d'évaluation conjointe | `compliance.e2e.ts` Path 5 (éval. conjointe → upload PDF → `/confirmation`) | ✅ Couvert |
| CAS-06 | oui | ≥ 1 écart ≥ 5 % → évaluation conjointe | Rapport + avis CSE « exactitude (± justification) » | `compliance.e2e.ts` Path 4 (éval. conjointe → upload → `/avis-cse`) ; dépôt de l'avis non déroulé | 🟡 Partiel |
| CAS-07 | non | Écart ≥ 5 % → actions correctives → 2ᵉ déclaration **sans** écart | Nouvelle déclaration de l'indicateur G | `compliance.e2e.ts` Path 7 (2ᵉ déclaration sans écart → `/confirmation`) | ✅ Couvert |
| CAS-08 | oui | Écart ≥ 5 % → actions correctives → 2ᵉ déclaration **sans** écart | 2ᵉ déclaration + avis CSE sur les 2 déclarations | `compliance.e2e.ts` Path 6 (2ᵉ déclaration sans écart → `/avis-cse`) ; dépôt de l'avis 2-déclarations non déroulé | 🟡 Partiel |
| CAS-09 | non | Actions correctives → 2ᵉ déclaration **avec** écart → justification | 2ᵉ déclaration + justification | Aucun test sans CSE au 2ᵉ tour (la mécanique du 2ᵉ tour n'est testée qu'avec CSE, voir CAS-10) | ❌ Non couvert |
| CAS-10 | oui | Actions correctives → 2ᵉ déclaration **avec** écart → justification | 2ᵉ déclaration + justification + avis CSE sur les 2 déclarations | `compliance.e2e.ts` Path 8 (retour au choix de parcours, options restreintes, justification → `/avis-cse/etape/1`) ; dépôt de l'avis non déroulé | 🟡 Partiel |
| CAS-11 | non | Actions correctives → 2ᵉ déclaration **avec** écart → évaluation conjointe | 2ᵉ déclaration + rapport d'évaluation conjointe | `compliance.e2e.ts` Path 11 (2ᵉ tour → éval. conjointe → upload → `/confirmation`) | ✅ Couvert |
| CAS-12 | oui | Actions correctives → 2ᵉ déclaration **avec** écart → évaluation conjointe | 2ᵉ déclaration + rapport + avis CSE sur les 2 déclarations | `compliance.e2e.ts` Path 10 (2ᵉ tour → éval. conjointe → upload → `/avis-cse`) ; dépôt de l'avis non déroulé | 🟡 Partiel |

**Rappel des correspondances métier** (terminologie Excel → app) : « 7ᵉ indicateur » = indicateur G (écarts de rémunération par catégorie) ; « Parcours de conformité » = page `/declaration-remuneration/parcours-conformite` ; « Dépôt avis CSE » = flux `/avis-cse/etape/1..2` ; « Dépôt du rapport de l'évaluation conjointe » = upload PDF sur `/evaluation-conjointe`.

---

## 3. Matrice taille d'entreprise × année (2027–2033)

Transcription des quatre feuilles de l'Excel. « 6 » = déclaration des 6 premiers indicateurs (cas 1–2 uniquement pour les ≥ 100) ; « 7 » = déclaration des 7 indicateurs (les 12 cas s'appliquent pour les ≥ 100).

| Tranche | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
|---|---|---|---|---|---|---|---|
| < 50 (volontariat) | 7 | 7 | 7 | 7 | 7 | 7 | 7 |
| 50 – 99 | 6 | 6 | 6 | **7** | 6 | 6 | **7** |
| 100 – 149 | 6 | 6 | 6 | **7** (12 cas) | 6 | 6 | **7** (12 cas) |
| 150 – 249 | **7** (12 cas) | 6 | 6 | **7** (12 cas) | 6 | 6 | **7** (12 cas) |
| 250 et + | **7** (12 cas) | **7** | **7** | **7** | **7** | **7** | **7** |

La feuille « <50 et 50-99 » ne prévoit **ni cas CSE ni parcours de conformité** pour ces tranches (le CSE n'est requis qu'à partir de 100 salariés).

**Couverture** : ces règles de cadencement sont implémentées dans `packages/app/src/modules/domain/shared/indicatorG.ts` (`isIndicatorGRequired`, `isTriennialYear`) et `companyObligation.ts` (`isObligatedForYear`), couvertes par les **tests unitaires** `indicatorG.test.ts` et `companyObligation.test.ts`. Aucun test E2E ne déroule le funnel en variante « 6 indicateurs » (étape catégories masquée) ni pour une tranche < 250 — voir §5.

---

## 4. Scénarios complémentaires hors Excel

Comportements testés en E2E qui ne figurent pas dans le fichier de Laetitia mais font partie du contrat du parcours :

| ID | Scénario | Couverture E2E | Statut |
|---|---|---|---|
| ANX-01 | Tâtonnement : changer de parcours de conformité avant toute action aval (le dernier choix gagne, les deux événements sont historisés) | `compliance-path-change.e2e.ts` | ✅ Couvert |
| ANX-02 | Démarche terminée → toute navigation vers le parcours de conformité redirige | `compliance.e2e.ts` Path 12 | ✅ Couvert |
| ANX-03 | Bouton « Précédent » sur `/avis-cse` : retour contextuel selon l'état (récap étape 6, choix de parcours, récap 2ᵉ déclaration) | `compliance.e2e.ts` Paths 13.a / 13.b / 13.c | ✅ Couvert |

Le socle déclaratif (étapes 1–6, brouillon, historique, panneau de démarche, deadlines de campagne, annulation…) est couvert par les autres specs (`declaration.e2e.ts`, `declarationDraft.e2e.ts`, `declaration-history.e2e.ts`, `declaration-process-panel.e2e.ts`, `campaign-deadlines-gating.e2e.ts`, `declaration-cancellation.e2e.ts`) — hors périmètre de ce cahier, qui trace les parcours du fichier Excel.

---

## 5. Trous de couverture connus

Par ordre de valeur métier décroissante :

1. **Dépôts d'avis CSE enrichis** — la matrice d'association des fichiers (colonnes « Justification », mode 2 déclarations) n'est déroulée par aucun test : tous les dépôts CSE testés sont « exactitude, 1 déclaration ». Concerne CAS-04, CAS-06, CAS-08, CAS-10, CAS-12. Le helper `submitCseStep2` supporte déjà `columns` et `hasSecondDeclaration`.
2. **CAS-09** — 2ᵉ tour sans CSE avec justification : aucun test.
3. **CAS-03** — flux complet de justification sans CSE : seule l'exposition de l'option est vérifiée.
4. **Variante « 6 indicateurs »** — aucun test E2E ne vérifie que l'étape catégories est masquée (redirection `etape/5` → `etape/6`) et qu'aucun parcours de conformité n'est proposé quand l'indicateur G n'est pas requis (tranche/année hors cadence, cf. §3).
5. **Tranches < 250** — toutes les specs conformité tournent en tranche 250+ ; le comportement 150-249 / 100-149 / 50-99 (dont années « 6 indicateurs ») n'est vérifié qu'en tests unitaires de domaine.

---

## 6. Divergences Excel ↔ code à arbitrer

Constats faits en transcrivant le fichier (état du code : branche `alpha`, juillet 2026). À trancher avec le métier, puis répercuter ici **et** dans le code/les tests :

1. **< 50 salariés** : l'Excel affiche « Déclaration des 7 indicateurs » (volontariat) chaque année ; le code n'inclut jamais l'indicateur G sous 50 salariés (`isIndicatorGRequired` → false, donc `getApplicableIndicators` renvoie 6 indicateurs). Un déclarant volontaire n'aurait donc que 6 indicateurs.
2. **50 – 99, années hors cadence** (2028, 2029, 2031, 2032) : l'Excel affiche « Déclaration des 6 premiers indicateurs » ; le code ne les assujettit pas du tout ces années-là (`isObligatedForYear` → false hors 2027/2030/2033). S'agit-il d'une déclaration volontaire possible chaque année ?
3. **50 – 99 en 2030/2033 avec écart ≥ 5 %** : l'Excel ne prévoit aucun parcours de conformité pour cette tranche ; côté code, le parcours se déclenche dès que l'indicateur G est requis et qu'un écart ≥ 5 % existe, sans condition de tranche (`Step6Review.tsx` → `isComplianceProcessRequired`). Confirmer le comportement attendu pour une 50-99 en année « 7 indicateurs ».
