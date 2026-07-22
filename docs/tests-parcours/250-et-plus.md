# Onglet « 250 et + » — 250 salariés et plus

> Miroir de l'onglet du classeur « Parcours ». **Mode d'emploi testeur** : aller à l'année de campagne testée, puis dérouler chaque cas dans l'ordre — chaque cas liste les étapes à réaliser dans l'application. La ligne « couverture automatisée » indique si un test Playwright traverse déjà ce cas (le détail, manques compris, est dans [tests-parcours.md](../tests-parcours.md)).

## Année 2027 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2028 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2029 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2030 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2031 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2032 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

## Année 2033 — 7 indicateurs

### Cas 1 — sans CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : non

1. Déclaration des 7 indicateurs

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-1--sans-cse-aucun-écart--5-)

### Cas 2 — avec CSE et aucun écart ≥ 5 % pour le 7ᵉ indicateur

CSE : oui

1. Déclaration des 7 indicateurs
2. Dépôt avis CSE sur l'exactitude des données déclarées

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-2--avec-cse-aucun-écart--5-)

### Cas 3 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-3--sans-cse-écart--5--justification)

### Cas 4 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : justification des écarts
3. Dépôt avis CSE sur l'exactitude des données déclarées et la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-4--avec-cse-écart--5--justification)

### Cas 5 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-5--sans-cse-écart--5--évaluation-conjointe)

### Cas 6 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : évaluation conjointe
3. Dépôt du rapport de l'évaluation conjointe
4. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-6--avec-cse-écart--5--évaluation-conjointe)

### Cas 7 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-7--sans-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 8 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec aucun écart ≥ 5 %

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Dépôt avis CSE sur l'exactitude des données déclarées pour la 1ʳᵉ et la 2ᵉ déclaration, et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-8--avec-cse-actions-correctives-2e-déclaration-sans-écart)

### Cas 9 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-9--sans-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 10 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et justification des écarts

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : justification des écarts
5. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts de la 1ʳᵉ déclaration, sur l'exactitude des données déclarées et la justification des écarts pour la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-10--avec-cse-actions-correctives-2e-déclaration-avec-écart-justification)

### Cas 11 — sans CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : non

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe

Couverture automatisée : ✅ couverte — [détail et manques](../tests-parcours.md#cas-11--sans-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)

### Cas 12 — avec CSE, au moins un écart ≥ 5 % pour le 7ᵉ indicateur, actions correctives, nouvelle déclaration avec au moins un écart ≥ 5 % et évaluation conjointe

CSE : oui

1. Déclaration des 7 indicateurs
2. Parcours de conformité : actions correctives et nouvelle déclaration
3. Nouvelle déclaration du 7ᵉ indicateur
4. Parcours de conformité : évaluation conjointe
5. Dépôt du rapport de l'évaluation conjointe
6. Dépôt avis CSE sur l'exactitude des données déclarées et éventuellement sur la justification des écarts pour la 1ʳᵉ et la 2ᵉ déclaration

Couverture automatisée : 🟠 partielle — [détail et manques](../tests-parcours.md#cas-12--avec-cse-actions-correctives-2e-déclaration-avec-écart-évaluation-conjointe)
