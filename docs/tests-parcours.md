# Parcours métier et couverture de tests

> **Miroir du classeur « Parcours » (Excel).** Ce document remplace le classeur comme outil de suivi : il reprend ses quatre onglets (tranches d'effectif), ses cas par année et le détail de leurs étapes, et ajoute pour chaque cas **les tests automatisés qui le couvrent** et **ce qui reste à tester**. Le listing brut de toute la suite vit dans [l'inventaire des tests](tests-inventory.md).
>
> Partie « onglets et cas » : à mettre à jour à la main quand le classeur évolue. Partie « couverture » : vérifiée contre le code des tests le 2026-07-22 — chaque titre cité existe mot pour mot dans le fichier indiqué.

## Comment lire ce document

- **✅ Couvert** — toutes les étapes du cas sont réellement **traversées dans l'interface** par au moins un scénario Playwright (éventuellement plusieurs mis bout à bout).
- **🟠 Partiel** — certaines étapes seulement ; les manques sont listés cas par cas.
- **❌ Non couvert** — aucune étape traversée. *(Aucun cas n'est dans cette situation à ce jour.)*
- Une étape « pré-remplie en base » par un test (pour aller plus vite au point testé) ne compte **pas** comme couverte : seul compte ce que le test fait faire à l'utilisateur.
- En complément des scénarios e2e, chaque cas cite les **tests de règles** (unitaires) qui verrouillent sa logique : la [table de décision](tests-inventory/regles-metier-domaine.md) (`demarcheDecisionTable.test.ts`), la matrice de transitions du moteur (`matrix.v2027.1.test.ts`) et la conformité des écrans au moteur (`fsmMirrors.conformance.test.ts`). Ils garantissent les règles (qui est assujetti, quel chemin s'ouvre), pas le parcours à l'écran.

## Synthèse

| Cas | Intitulé court | Couverture e2e |
| --- | --- | --- |
| [Onglet <50 et 50-99](#onglet--50-et-50-99-) | Déclaration seule | 🟠 Partiel |
| [Cas 1](#cas-1--sans-cse-aucun-écart--5-) | Sans CSE, aucun écart | 🟠 Partiel |
| [Cas 2](#cas-2--avec-cse-aucun-écart--5-) | Avec CSE, aucun écart | ✅ Couvert |
| [Cas 3](#cas-3--sans-cse-écart--5--justification) | Sans CSE, écart, justification | 🟠 Partiel |
| [Cas 4](#cas-4--avec-cse-écart--5--justification) | Avec CSE, écart, justification | 🟠 Partiel |
| [Cas 5](#cas-5--sans-cse-écart--5--évaluation-conjointe) | Sans CSE, écart, évaluation conjointe | ✅ Couvert |
| [Cas 6](#cas-6--avec-cse-écart--5--évaluation-conjointe) | Avec CSE, écart, évaluation conjointe | 🟠 Partiel |
| [Cas 7](#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart) | Sans CSE, actions correctives, 2ᵉ décl. sans écart | ✅ Couvert |
| [Cas 8](#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart) | Avec CSE, actions correctives, 2ᵉ décl. sans écart | 🟠 Partiel |
| [Cas 9](#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification) | Sans CSE, 2ᵉ décl. avec écart, justification | 🟠 Partiel |
| [Cas 10](#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification) | Avec CSE, 2ᵉ décl. avec écart, justification | 🟠 Partiel |
| [Cas 11](#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe) | Sans CSE, 2ᵉ décl. avec écart, évaluation conjointe | ✅ Couvert |
| [Cas 12](#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe) | Avec CSE, 2ᵉ décl. avec écart, évaluation conjointe | 🟠 Partiel |

Les manques qui reviennent sur presque tous les cas sont regroupés dans [Manques transversaux](#manques-transversaux--ce-quaucun-test-e2e-nexerce-aujourdhui) — c'est la liste des tests restant à faire.

---

## Onglet « <50 et 50-99 »

Aucun parcours de conformité ni avis CSE pour ces tranches : la démarche se limite à la déclaration.

| Tranche | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Moins de 50 salariés (volontariat) | 7 indicateurs | 7 | 7 | 7 | 7 | 7 | 7 |
| 50 à 99 salariés | 6 premiers indicateurs | 6 | 6 | **7** | 6 | 6 | **7** |

**Couverture e2e : 🟠 Partiel.**

Scénarios couvrants :

- `declaration.e2e.ts` — « banners display the GIP workforce and drop the CSE field » *(bannières et absence du champ CSE pour un effectif GIP 70)*
- `declaration.e2e.ts` — « the funnel drops the indicator G step » *(le tunnel raccourci sans 7ᵉ indicateur)*
- `declaration.e2e.ts` — « mon espace shows "< 50" and drops the CSE field and the edit button » *(affichage « < 50 » quand l'entreprise est absente du fichier GIP)*
- `declaration.e2e.ts` — « submitting the quartile step lands on the review step (S1 of #3934) » *(régression #3934 : pas de 7ᵉ indicateur exigé sous 100)*
- `declaration-cancellation.e2e.ts` — « submit → cancel → resubmit → cancel → resubmit, then verify admin list and cancelled badge »
- `notifications-email-flow.e2e.ts` — « declaration submission delivers a confirmation email to MailDev »

Ce qui manque :

- La **soumission finale** (récapitulatif + certification) d'une déclaration en tranche 50-99 réelle (effectif GIP < 100) n'est traversée par aucun test — les scénarios s'arrêtent avant la certification.
- Tranche **< 50 (volontariat)** : aucune saisie d'indicateur ni soumission via l'interface — seuls les affichages « Mon espace » sont vérifiés.
- La variante **7 indicateurs en 2030 et 2033** pour la tranche 50-99 n'est exercée par aucun e2e (aucun test ne fait varier l'année).
- Aucun test ne vérifie explicitement l'**absence** de parcours de conformité et d'avis CSE après une soumission dans ces tranches.
- ⚠️ **Écart classeur ↔ implémentation à arbitrer** : le classeur indique « 7 indicateurs » pour la tranche < 50 (volontariat), mais les règles implémentées excluent le tier < 50 du 7ᵉ indicateur, y compris à partir de 2030 (test « keeps the voluntary tier (< 50) out of the obligation even from 2030 »). L'un des deux doit être corrigé.

---

## Onglet « 100-149 »

Cette tranche n'est assujettie au 7ᵉ indicateur qu'à partir de 2030, les années triennales (2030, 2033). Les autres années : 6 premiers indicateurs, seuls les cas 1 et 2 existent.

| Cas | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cas 1 — sans CSE | ✓ (6 ind.) | ✓ | ✓ | ✓ (7 ind.) | ✓ | ✓ | ✓ (7 ind.) |
| Cas 2 — avec CSE | ✓ (6 ind.) | ✓ | ✓ | ✓ (7 ind.) | ✓ | ✓ | ✓ (7 ind.) |
| Cas 3 à 12 (écart ≥ 5 %) | — | — | — | ✓ | — | — | ✓ |

## Onglet « 150-249 »

Cette tranche est assujettie au 7ᵉ indicateur les années triennales (2027, 2030, 2033). Les autres années : 6 premiers indicateurs, seuls les cas 1 et 2 existent.

| Cas | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cas 1 — sans CSE | ✓ (7 ind.) | ✓ (6 ind.) | ✓ (6 ind.) | ✓ (7 ind.) | ✓ (6 ind.) | ✓ (6 ind.) | ✓ (7 ind.) |
| Cas 2 — avec CSE | ✓ (7 ind.) | ✓ (6 ind.) | ✓ (6 ind.) | ✓ (7 ind.) | ✓ (6 ind.) | ✓ (6 ind.) | ✓ (7 ind.) |
| Cas 3 à 12 (écart ≥ 5 %) | ✓ | — | — | ✓ | — | — | ✓ |

## Onglet « 250 et + »

Cette tranche est assujettie au 7ᵉ indicateur **toutes les années** : les 12 cas existent chaque année, toujours avec les 7 indicateurs.

| Cas | 2027 → 2033 |
| --- | --- |
| Cas 1 à 12 | ✓ toutes les années (7 ind.) |

---

## Détail des cas et de leur couverture

Les étapes reprennent le texte du classeur. Sauf mention contraire, les scénarios cités sont dans `packages/app/src/e2e/`.

### Cas 1 — sans CSE, aucun écart ≥ 5 %

Étapes : déclaration des 6 ou 7 indicateurs (selon tranche/année) → fin de démarche (aucun parcours de conformité, aucun avis CSE).

**🟠 Partiel.**

- `compliance.e2e.ts` — « complete declaration without gap, redirects to confirmation » *(déclaration 7 indicateurs sans écart → redirection directe vers la confirmation, sans page de choix de conformité)*
- `notifications-email-flow.e2e.ts` — « declaration submission delivers a confirmation email to MailDev »
- `declaration-cancellation.e2e.ts` — « submit → cancel → resubmit → cancel → resubmit, then verify admin list and cancelled badge »

Ce qui manque : la variante **6 indicateurs soumise jusqu'au bout** ; l'absence d'avis CSE n'est vérifiée qu'indirectement (par la redirection) ; et les manques transversaux (tranches, années).

### Cas 2 — avec CSE, aucun écart ≥ 5 %

Étapes : déclaration → dépôt avis CSE sur l'exactitude des données déclarées.

**✅ Couvert.**

- `compliance.e2e.ts` — « complete declaration without gap, then CSE opinion flow » *(déclaration sans écart puis dépôt complet de l'avis CSE : étape 1, étape 2 avec upload, confirmation)*
- `compliance.e2e.ts` — « complete full flow, then verify compliance path redirects away » *(après la fin de démarche, la page de choix de conformité n'est plus accessible)*
- `compliance.e2e.ts` — « after no-gap submission, Précédent on /avis-cse goes to step 6 » *(navigation retour cohérente)*

Restent les manques transversaux (variante 6 indicateurs avec CSE, tranches, années).

### Cas 3 — sans CSE, écart ≥ 5 %, justification

Étapes : déclaration des 7 indicateurs → parcours de conformité : justification des écarts.

**🟠 Partiel.**

- `compliance.e2e.ts` — « complete declaration with gap, shows 3 compliance options » *(déclaration avec écart → arrivée sur la page de choix avec les 3 options)*
- `compliance.e2e.ts` — « shows all 3 options including justify (hasCse=false) » *(l'option « Justifier » visible pour une entreprise sans CSE)*
- `compliance.e2e.ts` — « justify → navigates to /avis-cse/etape/1 » *(⚠️ exercé en variante **avec** CSE)*

Ce qui manque : le **choix effectif « justification » par une entreprise sans CSE** n'est cliqué dans aucun test (les trois clics « path-justify » de la suite se font tous avec CSE) ; le message de fin de parcours après justification sans CSE n'est vérifié nulle part ; même chose au 2ᵉ tour.

### Cas 4 — avec CSE, écart ≥ 5 %, justification

Étapes : déclaration des 7 indicateurs → justification des écarts → dépôt avis CSE sur l'exactitude **et la justification**.

**🟠 Partiel.**

- `compliance.e2e.ts` — « complete declaration with gap, shows 3 compliance options »
- `compliance.e2e.ts` — « justify → navigates to /avis-cse/etape/1 » *(choix « justification » avec CSE → arrivée sur l'avis CSE)*
- `compliance.e2e.ts` — « after justify choice, Précédent on /avis-cse goes back to compliance choice »
- `compliance.e2e.ts` — « second round: justify → navigates to /avis-cse/etape/1 »
- `compliance.e2e.ts` — « complete declaration without gap, then CSE opinion flow » *(seul dépôt complet d'avis CSE existant — mais atteint SANS écart)*

Ce qui manque : **le dépôt de l'avis CSE n'est jamais complété après un choix « justification »** — les tests s'arrêtent à l'arrivée sur `/avis-cse/etape/1` ; la case « Justification » de la matrice d'association de l'étape 2 n'est cochée par aucun test ; l'avis CSE signalant lui-même un écart (radio « oui ») n'est jamais exercé (le helper répond « non » en dur).

### Cas 5 — sans CSE, écart ≥ 5 %, évaluation conjointe

Étapes : déclaration des 7 indicateurs → évaluation conjointe → dépôt du rapport.

**✅ Couvert.**

- `compliance.e2e.ts` — « joint evaluation → upload PDF → /confirmation » *(choix évaluation conjointe sans CSE, dépôt du rapport PDF, arrivée sur la confirmation)*
- `compliance.e2e.ts` — « shows all 3 options including justify (hasCse=false) »
- `compliance.e2e.ts` — « full flow → second round → joint evaluation → /confirmation » *(même chemin au 2ᵉ tour)*

Restent les manques transversaux, plus deux points mineurs : la page de confirmation n'est vérifiée que par son URL (pas le message « votre parcours est terminé »), et la persistance du fichier n'est assertée que dans `fileUpload.e2e.ts`.

### Cas 6 — avec CSE, écart ≥ 5 %, évaluation conjointe

Étapes : déclaration des 7 indicateurs → évaluation conjointe → dépôt du rapport → dépôt avis CSE (exactitude, éventuellement justification).

**🟠 Partiel.**

- `compliance.e2e.ts` — « complete declaration with gap, joint evaluation → CSE » *(écart → évaluation conjointe → rapport → arrivée sur /avis-cse)*
- `compliance.e2e.ts` — « full flow → second round → joint evaluation → /avis-cse »
- `fileUpload.e2e.ts` — « uploads a joint evaluation PDF through the real pipeline and returns a fileId » *(pipeline réel d'upload du rapport, antivirus compris)*
- `compliance-path-change.e2e.ts` — « user explores corrective_action then switches to joint_evaluation: both events persisted, latest wins » *(changement d'avis entre chemins, événements persistés)*
- `compliance.e2e.ts` — « complete declaration without gap, then CSE opinion flow » *(dépôt complet d'avis CSE — mais atteint sans écart)*

Ce qui manque : **l'enchaînement bout à bout** (écart → évaluation conjointe → rapport → **avis CSE complété** → fin de démarche) n'existe dans aucun test — le dépôt d'avis complet n'est traversé que dans le cas sans écart ; la facette « avis portant sur la justification » n'est pas exerçable avec le helper actuel.

### Cas 7 — sans CSE, actions correctives, 2ᵉ déclaration SANS écart

Étapes : déclaration des 7 indicateurs → actions correctives → nouvelle déclaration du 7ᵉ indicateur sans écart (démarche résolue).

**✅ Couvert.**

- `compliance.e2e.ts` — « declaration → corrective action → correct without gap → /confirmation » *(le chemin complet : écart, actions correctives, 2ᵉ déclaration corrigée, confirmation)*
- `notifications-email-flow.e2e.ts` — « second declaration submission (corrective action) delivers a second-declaration receipt » *(accusé de réception de la 2ᵉ déclaration — exercé en variante avec CSE)*

Restent les manques transversaux, plus : l'accusé email de 2ᵉ déclaration n'est vérifié qu'avec CSE ; la page de confirmation n'est vérifiée que par son URL.

### Cas 8 — avec CSE, actions correctives, 2ᵉ déclaration SANS écart

Étapes : déclaration des 7 indicateurs → actions correctives → 2ᵉ déclaration sans écart → dépôt avis CSE **sur les deux déclarations** (éventuellement justification de la 1ʳᵉ).

**🟠 Partiel.**

- `compliance.e2e.ts` — « declaration → corrective action → correct without gap → /avis-cse » *(chemin complet jusqu'à l'arrivée sur l'avis CSE)*
- `compliance.e2e.ts` — « after second-decl resolved, Précédent on /avis-cse goes to second-decl recap »
- `notifications-email-flow.e2e.ts` — « second declaration submission (corrective action) delivers a second-declaration receipt »

Ce qui manque : **le dépôt d'avis CSE en mode deux déclarations** (l'étape distinctive de ce cas) n'est traversé par aucun test — les helpers le supportent (`hasSecondDeclaration=true`, champs dédiés) mais aucun test ne les utilise ; le parcours bout en bout jusqu'à la fin de démarche n'existe pas.

### Cas 9 — sans CSE, actions correctives, 2ᵉ déclaration AVEC écart, justification

Étapes : déclaration → actions correctives → 2ᵉ déclaration avec écart persistant → justification des écarts (2ᵉ tour).

**🟠 Partiel.**

- `compliance.e2e.ts` — « declaration → corrective action → correct WITH gap → back to compliance choice » *(écart persistant → retour sur la page de choix)*
- `compliance.e2e.ts` — « second round shows only justify and joint evaluation (no corrective action) » *(au 2ᵉ tour, l'option actions correctives a disparu)*
- `compliance.e2e.ts` — « second round: justify → navigates to /avis-cse/etape/1 » *(⚠️ exercé en variante avec CSE)*
- `compliance.e2e.ts` — « full flow → second round → joint evaluation → /confirmation »

Ce qui manque : la **justification au 2ᵉ tour en variante sans CSE** (le cœur de ce cas) n'est traversée par aucun test ; aucun test unique n'enchaîne la chaîne complète du cas ; après le choix « justification » au 2ᵉ tour, le parcours n'est jamais poursuivi jusqu'au message de fin.

### Cas 10 — avec CSE, actions correctives, 2ᵉ déclaration AVEC écart, justification

Étapes : comme le cas 9, plus dépôt avis CSE (exactitude et justification, sur les deux déclarations).

**🟠 Partiel.**

- `compliance.e2e.ts` — « declaration → corrective action → correct WITH gap → back to compliance choice »
- `compliance.e2e.ts` — « second round shows only justify and joint evaluation (no corrective action) »
- `compliance.e2e.ts` — « second round: justify → navigates to /avis-cse/etape/1 »
- `compliance.e2e.ts` — « complete declaration without gap, then CSE opinion flow » *(dépôt complet d'avis — sans écart)*

Ce qui manque : identiques aux cas 4 et 8 combinés — **l'avis CSE n'est jamais complété après une justification**, et **jamais en mode deux déclarations** ; la fin de parcours par ce chemin n'est jamais vérifiée.

### Cas 11 — sans CSE, actions correctives, 2ᵉ déclaration AVEC écart, évaluation conjointe

Étapes : déclaration → actions correctives → 2ᵉ déclaration avec écart persistant → évaluation conjointe (2ᵉ tour) → dépôt du rapport.

**✅ Couvert.**

- `compliance.e2e.ts` — « full flow → second round → joint evaluation → /confirmation » *(la chaîne complète du cas, du premier écart à la confirmation, en un seul test)*
- `compliance.e2e.ts` — « declaration → corrective action → correct WITH gap → back to compliance choice »
- `compliance.e2e.ts` — « second round shows only justify and joint evaluation (no corrective action) » *(⚠️ vérifié en variante avec CSE)*

Restent les manques transversaux ; l'assertion « l'option actions correctives a disparu au 2ᵉ tour » n'existe qu'en variante avec CSE.

### Cas 12 — avec CSE, actions correctives, 2ᵉ déclaration AVEC écart, évaluation conjointe

Étapes : comme le cas 11, plus dépôt avis CSE sur les deux déclarations.

**🟠 Partiel.**

- `compliance.e2e.ts` — « full flow → second round → joint evaluation → /avis-cse » *(la chaîne complète jusqu'à l'arrivée sur l'avis CSE)*
- `compliance.e2e.ts` — « declaration → corrective action → correct WITH gap → back to compliance choice »
- `compliance.e2e.ts` — « second round shows only justify and joint evaluation (no corrective action) »
- `notifications-email-flow.e2e.ts` — « second declaration submission (corrective action) delivers a second-declaration receipt »
- `compliance.e2e.ts` — « complete full flow, then verify compliance path redirects away »

Ce qui manque : comme les cas 6 et 8 — **le dépôt d'avis CSE après ce parcours** (et en mode deux déclarations) n'est traversé par aucun test.

---

## Manques transversaux — ce qu'aucun test e2e n'exerce aujourd'hui

Cette liste est la vue « tests restant à faire » au niveau de la suite entière. Chaque point revient dans plusieurs cas ci-dessus.

1. **Tranches d'effectif 100-149 et 150-249** — tous les scénarios de conformité tournent avec l'effectif GIP de référence **250** (tranche 250 et +). Les seules autres valeurs exercées sont 70 et « absent du fichier GIP » (tunnel raccourci). Aucun parcours de conformité n'est donc testé dans les tranches 100-149 et 150-249.
2. **La dimension année** — aucun test ne fait varier l'année de campagne : ni année triennale vs non-triennale (150-249), ni la bascule de 2030 (100-149 et 50-99). Les règles correspondantes sont verrouillées par les tests unitaires, mais aucun parcours à l'écran ne les exerce.
3. **Avis CSE après justification** — les tests s'arrêtent tous à l'**arrivée** sur `/avis-cse/etape/1` après un choix « justification » ; le seul dépôt complet d'avis CSE traversé part d'une déclaration **sans** écart. Concerne les cas 4, 6, 10, 12.
4. **Avis CSE en mode deux déclarations** — jamais traversé (helpers prêts, aucun test ne les utilise). Concerne les cas 8, 10, 12.
5. **Case « Justification » de la matrice d'association (avis CSE, étape 2)** — jamais cochée par aucun test ; de plus, le helper répond « non » en dur à la question « le CSE signale-t-il un écart ? », rendant la variante « oui » non exerçable sans le faire évoluer.
6. **Tunnel 6 indicateurs jusqu'à la soumission** — les tests du tunnel raccourci s'arrêtent avant le récapitulatif et la certification.
7. **Messages de fin de parcours** — « Votre parcours … est terminé » n'est vérifié que sur certains chemins ; plusieurs tests ne vérifient que l'URL de la confirmation.
8. **Tranche < 50 (volontariat)** — aucune saisie ni soumission via l'interface ; et un écart classeur ↔ implémentation sur les « 7 indicateurs » à arbitrer (voir l'onglet).
