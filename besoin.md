Le figma est la référence, il porte la vérité métier et design (pixel perfect), base toi dessus.

Le but de la refonte est de permettre d'associer les fichiers CSE à leur type de contenu. (exactitude et justification)

On a donc ajouté un système de checkbox (un type = une colonne) à côté des fichiers importés (qui sont sur des lignes)

Il est important de bien gérer les validations de ce système de checkbox:

On ne pourra avoir qu'une seule checkbox de chaque type sélectionné sur l'ensemble des fichiers.
Donc lorsque l'utilisateur coche un type des checkbox pour un fichier, les autres checkbox de ce même type sont disabled (sur la colonne donc).
Il faut bloquer le submit du bouton "Soumettre" si un des types de contenu n'a pas été coché dans aucun des fichiers
l'affichage du header de colonne n'affichera pas "1re déclaration" si il n'y a pas de 2e déclaration dans le parcours
à noter aussi que l'affichage des colonnes dépend du parcours effectués par l'utilisateur:
L'utilisateur peut faire 2 déclarations.
Pour arriver à cet écran, il est soit à la première déclaration, soit à la deuxième (il en existe 2)
liste des différents types de contenus :

Exactitude 1re déclaration : toujours là
Justification 1re déclaration : si il y a écart et que l'utilisateur a répondu oui à la question "Avez-vous informé et consulté le CSE sur la justification des écarts ≥ 5 % ?" du formulaire "Transmettre l’avis ou les avis du CSE"
Exactitude 2e déclaration : si il y a une deuxième déclaration
Justification 2e déclaration : si il y a une deuxième déclaration et si il y a écart et que l'utilisateur a répondu oui à la question "Avez-vous informé et consulté le CSE sur la justification des écarts ≥ 5 % ?" du formulaire "Transmettre l’avis ou les avis du CSE" sur la partie 2e déclartion


_____



Besoin métier:
Qui : la personne déclarante d'une entreprise soumise à l'obligation CSE (≥ 100 salariés), au moment de transmettre les avis du CSE via le parcours /avis-cse.

Problème : aujourd'hui les PDF d'avis sont importés « en vrac », sans lien explicite entre un fichier et l'obligation qu'il couvre. L'administration ne peut pas savoir quel document justifie l'exactitude des indicateurs ou la justification des écarts ≥ 5 %, ni pour quelle déclaration (1re / 2e).

Règle métier : chaque type de contenu requis par le parcours doit être couvert par exactement un fichier ; un même fichier peut couvrir plusieurs types. Les types requis dépendent du parcours : Exactitude est toujours requise ; Justification ne l'est que s'il y a un écart ≥ 5 % et que la consultation du CSE sur cet écart a été déclarée « oui » à l'étape précédente ; les types « 2e déclaration » n'existent que si une 2e déclaration a été faite.

Rattachement : étape d'import du parcours « Transmettre l'avis ou les avis du CSE » (étape 2, page d'upload), en aval de l'étape 1 où sont saisis les avis et la réponse à la question de consultation des écarts. L'étape 1 reste inchangée.


____


User stories
US1 — En tant que déclarante, je veux associer chaque avis CSE importé à un ou plusieurs types de contenu (Exactitude / Justification, par déclaration), afin que l'administration sache quel document couvre quelle obligation.
US2 — En tant que déclarante, je veux être empêchée de soumettre tant qu'un type de contenu requis n'est associé à aucun fichier, afin de ne pas transmettre un dossier incomplet.
US3 — En tant que déclarante sans 2e déclaration / sans écart, je veux ne voir que les colonnes pertinentes à mon parcours, afin de ne pas être confrontée à des types qui ne me concernent pas.
Règle d'affichage des colonnes (référentiel)
Type de contenu	Affiché si…
Exactitude (1re décl.)	toujours
Justification (1re décl.)	écart ≥ 5 % sur la 1re décl. ET consultation CSE = « oui » (1re décl.)
Exactitude 2e décl.	une 2e déclaration existe
Justification 2e décl.	2e décl. existe ET écart ≥ 5 % (2e décl.) ET consultation CSE = « oui » (2e décl.)
Quand il n'y a qu'une déclaration, les libellés omettent le suffixe : « Exactitude » / « Justification ». Avec 2 déclarations, les 4 libellés portent « 1re déclaration » / « 2e déclaration ».

Scénarios de test
S1 — Une seule déclaration, sans écart

Étant donné une entreprise avec une seule déclaration et aucun écart ≥ 5 %
Quand la déclarante arrive sur la page d'import des avis
Alors une seule colonne est affichée, libellée « Exactitude » (sans suffixe de déclaration)
S2 — Une déclaration, écart consulté

Étant donné une seule déclaration, un écart ≥ 5 %, et « oui » à la consultation CSE à l'étape 1
Quand la déclarante arrive sur la page
Alors deux colonnes sont affichées : « Exactitude » et « Justification » (sans suffixe)
S3 — Deux déclarations, 4 types

Étant donné une entreprise ayant fait 2 déclarations, avec écart ≥ 5 % consulté sur chacune
Quand la déclarante arrive sur la page
Alors quatre colonnes avec suffixe sont affichées : « Exactitude 1re déclaration », « Justification 1re déclaration », « Exactitude 2e déclaration », « Justification 2e déclaration »
S4 — Justification 2e déclaration masquée

Étant donné 2 déclarations, écart consulté sur la 1re, mais pas d'écart (ou consultation « non ») sur la 2e
Quand la déclarante arrive sur la page
Alors les colonnes sont « Exactitude 1re déclaration », « Justification 1re déclaration », « Exactitude 2e déclaration » ; « Justification 2e déclaration » n'apparaît pas
S5 — Exclusivité par type (colonne)

Étant donné plusieurs fichiers importés et la colonne « Exactitude » non cochée
Quand la déclarante coche « Exactitude » sur le fichier A
Alors la checkbox « Exactitude » des autres fichiers devient désactivée
S6 — Décocher réactive la colonne

Étant donné « Exactitude » cochée sur le fichier A (désactivée ailleurs)
Quand la déclarante décoche « Exactitude » sur le fichier A
Alors « Exactitude » redevient activable sur tous les fichiers
S7 — Plusieurs types sur un même fichier

Étant donné plusieurs colonnes affichées
Quand la déclarante coche « Exactitude » et « Justification » sur le même fichier A
Alors les deux associations sont enregistrées sur le fichier A
S8 — Soumission bloquée (type requis non couvert)

Étant donné les colonnes « Exactitude » et « Justification » affichées, seule « Exactitude » cochée
Quand la déclarante tente de soumettre
Alors la soumission est bloquée et un message indique que chaque type de contenu doit être associé à un fichier (cas Figma « erreur »)
S9 — Soumission acceptée (tous les types requis couverts)

Étant donné chaque colonne affichée cochée sur exactement un fichier
Quand la déclarante soumet
Alors la soumission est acceptée et les associations fichier ↔ type sont persistées
S10 — Reprise

Étant donné des associations déjà enregistrées
Quand la déclarante revient sur la page
Alors les checkbox sont ré-affichées dans leur état précédent
Hors scope
L'étape 1 (avis favorable/défavorable, dates, question de consultation des écarts) — inchangée
Le calcul des indicateurs et du seuil d'écart ≥ 5 % (déjà dans le domaine)
La limite du nombre de fichiers (MAX_CSE_FILES), le format/poids PDF (10 Mo) — inchangés
Le design pixel des composants (porté par Figma, traité par architect / code-dev)
Critères d'acceptation de l'epic

Fichiers en lignes, types de contenu requis en colonnes de checkbox

Jeu de colonnes conforme au parcours (1/2 déclarations, écart, consultation) selon le référentiel ci-dessus

Libellés sans suffixe « 1re déclaration » quand une seule déclaration

Un type ↔ un seul fichier (autres checkbox de la colonne désactivées)

Un fichier ↔ plusieurs types possible

Soumission bloquée tant qu'un type requis n'est pas couvert, avec message d'erreur

Associations persistées et ré-affichées au retour

Fidélité Figma sur les 3 cas (4 types / 2 types / erreur)

RGAA : matrice de checkbox accessible (entêtes de colonnes liées, labels, état désactivé annoncé)