# Reprise des données V1

Deux scripts d’exploitation reprennent les données encore portées par la base
V1 vers la base V2 :

- les déclarations de représentation équilibrée ;
- l’annuaire des référents.

Ils lisent la base source au moment exact de leur exécution. Un `--dry-run`
valide les données disponibles à cet instant, mais ne fige pas un instantané
pour l’exécution réelle suivante.

## Prérequis

Définir `LEGACY_DATABASE_URL` pour la base V1. La base V2 est configurée avec
`DATABASE_URL` ou avec les variables `POSTGRES_HOST`, `POSTGRES_DB` et, selon
l’environnement, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` et
`POSTGRES_SSLMODE`.

Ne jamais passer ces valeurs dans la ligne de commande ni les ajouter aux logs.

## Représentation équilibrée

Commencer par une simulation sur une plage dont la borne de début est incluse
et la borne de fin exclue :

```bash
pnpm --filter app import:v1-representation -- --from 2023-01-01 --to 2024-01-01 --dry-run
```

Puis exécuter la reprise avec les mêmes bornes :

```bash
pnpm --filter app import:v1-representation -- --from 2023-01-01 --to 2024-01-01
```

Sans `--to`, la borne de fin est l’heure courante. Le script crée les entreprises
manquantes, mais n’écrase jamais une entreprise ni une déclaration créée
nativement en V2. Une déclaration déjà importée n’est mise à jour que si sa
version V1 est plus récente.

## Référents

La reprise des référents remplace l’annuaire V2 complet par l’annuaire V1 lu au
moment de l’exécution. Elle conserve les identifiants V1 ; le script renseigne
les champs `created_at` et `updated_at`, absents de la V1, avec une même heure
d’import lue sur la base V2.

Commencer par valider l’instantané sans écriture :

```bash
pnpm --filter app import:v1-referents -- --dry-run
```

Puis lancer le remplacement :

```bash
pnpm --filter app import:v1-referents
```

Toutes les lignes sont validées avant la première écriture. Une source vide, une
ligne invalide ou un identifiant dupliqué interrompt toute l’opération. Le
remplacement est ensuite réalisé dans une transaction avec verrouillage de la
table cible : une erreur d’insertion restaure l’annuaire précédent.

Planifier la bascule pendant une fenêtre où personne ne modifie les référents et
n’utilise l’import CSV d’administration. Entre le `--dry-run` et l’exécution,
éviter également toute modification côté V1, ou relancer le `--dry-run`.

## Contrôle après exécution

Chaque script affiche uniquement des compteurs opérationnels. Vérifier qu’il se
termine avec un code de sortie nul et que le nombre de lignes importées correspond
au nombre attendu avant de rouvrir les écritures sur la V2.
