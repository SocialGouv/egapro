# EgaPro


## URL

Prod : <https://egapro.travail.gouv.fr/>

Préprod : <https://egapro-preprod.ovh.fabrique.social.gouv.fr/>

## Installation

### Prérequis

-   Node.js >= 18
-   Yarn
-   Python (pour les scripts optionnels)

### Installation des dépendances

```bash
# Installation des dépendances Node.js
yarn install

# Si développement Python en local (optionnel)
yarn setup-python
```

### Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
# Configuration de la base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/egapro

# Configuration de l'API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Lancer l'application

1. **Mode développement par composant**

```bash
# API
yarn dev:api

# Application Next.js
yarn dev:app

# Serveur de mail de développement
yarn dev:maildev
```

Accès aux services :

-   Application : [http://localhost:3000](http://localhost:3000)
-   API : [http://localhost:2626](http://localhost:2626)
-   MailDev : [http://localhost:1080](http://localhost:1080)

2. **Mode développement complet**

```bash
# Lance tous les services en parallèle
yarn dev
```

3. **Arrêter l'application**

-   Utiliser `Ctrl+C` dans chaque terminal
-   Pour l'API et maildev : `docker-compose down`

### Tests et vérifications

```bash
# Lancer tous les tests
yarn test

# Vérifier le code
yarn check-all
```

## Configuration

### Variables annuelles importantes

-   `CURRENT_YEAR` (définie dans `packages/app/src/common/dict.ts`) :

    -   Année de déclaration courante ouverte
    -   Détermine les années disponibles pour les déclarations

-   `PUBLIC_CURRENT_YEAR` (définie dans `packages/app/src/common/dict.ts`) :
    -   Année de référence pour les calculs de statistiques publiques
    -   Utilisée pour l'affichage des données publiques et des indicateurs

## Architecture

### Structure des fichiers

```
packages/app/src/
├── app/                            # Routes et UI Next.js
│   ├── (default)/                  # Layout principal
│   │   ├── index-egapro/
│   │   │   ├── declaration/
│   │   │   │   └── actions.ts      # Server actions
├── api/
│   └── core-domain/               # Logique métier
│       ├── useCases/              # Cas d'utilisation
│       │   └── SaveDeclaration.ts
│       └── infra/                 # Infrastructure
├── common/
    └── core-domain/              # Domain partagé
        └── computers/            # Calculs d'index
```

### Concepts clés

1. **Forms et Validation** :

    - React Hook Form pour la gestion des formulaires
    - Zod pour la validation des données côté client
    - Exemple :

    ```tsx
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
    });
    ```

2. **Server Actions** :

    - Actions serveur dans `app/(default)/*/actions.ts`
    - Utilisation des use cases du domaine
    - Exemple :

    ```ts
    // app/(default)/index-egapro/declaration/actions.ts
    export async function saveDeclaration(declaration: CreateDeclarationDTO) {
        const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
        return useCase.execute(declaration);
    }
    ```

3. **Use Cases** :

    - Implémentation des cas d'utilisation métier
    - Validation des règles de gestion
    - Exemple :

    ```ts
    // api/core-domain/useCases/SaveDeclaration.ts
    export class SaveDeclaration implements UseCase {
        constructor(
            private readonly declarationRepo: IDeclarationRepo,
            private readonly entrepriseService: IEntrepriseService,
        ) {}
    }
    ```

4. **Domain et Calculs** :
    - Logique métier dans `core-domain`
    - Calculs d'index dans `computers/`
    - Indicateurs spécifiques :
        - IndicateurUnComputer : Calcul écart rémunération
        - IndicateurDeuxComputer : Calcul écart augmentations
        - IndicateurTroisComputer : Calcul écart promotions

## FAQ

### Comment lancer la compilation TS ?

```bash
cd packages/app
yarn workspace app run tsc
```

### Comment ajouter une librairie dans un workspace ?

```bash
yarn workspace app add moment
```

### Comment lancer un script dans un package ?

```bash
yarn workspace app run test
```

### Comment lancer un script dans tous les workspaces ?

```bash
yarn workspaces run lint
```

### Quel est le maildev pour un environnement de recette ?

Ajouter le préfixe `maildev-` devant l'URL.

Si l'environnement est `https://egapro-feat-limit-char-11oson.ovh.fabrique.social.gouv.fr/`.

Le maildev se trouvera alors à `https://maildev-egapro-feat-limit-char-11oson.ovh.fabrique.social.gouv.fr/`

## Fichiers

Certains fichiers sont exposés par le serveur web pour différents acteurs.

Le fichier index-egalite-fh.csv est généré tous les jours et accessible sans restriction.

Les fichiers suivants, sont accessibles uniquement si authentifié ou pour certaines adresses IP (voir la liste blanche dans `.kontinuous/values.yaml`).

-   dgt.xlsx
-   dgt-representation.xlsx
-   full.ndjson
-   indexes.csv

### Commandes pour générer les fichiers manuellement

```sh
egapro export-public-data /mnt/files/index-egalite-fh.xlsx
egapro dump-dgt /mnt/files/dgt.xlsx
egapro dump-dgt-representation /mnt/files/dgt-representation.xlsx
egapro full /mnt/files/full.ndjson
egapro export-indexes /mnt/files/indexes.csv
egapro export-representation /mnt/files/dgt-export-representation.xlsx
```

## Helpers egapro

L'API contient un CLI avec certaines commandes utiles :

Pour les lancer :

```sh
yarn egapro --help
```

Les commandes vont se lancer dans l'environnement local.

Si l'on veut lancer ces commandes dans un container (ex: en prod, en préprod ou dans un environnement lié à une PR), il faut se connecter au container et lancer la commande egapro.

## Période de Campagne

Chaque année une campagne de déclaration a lieu durant laquelle les entreprises de France de plus de 50 employés doivent effectuer une déclaration permettant de calculer leur index d'égalité femme-homme.
La campage de déclaration se déroule entre Février et Mars et pendant cette période la fréquentation du site Egapro augmente fortement.

![alt text](assets/image.png)

Nous constatons également que lors de la dernière semaine de la campage, la fréquentation double en comparaison de la semaine précédente.

Il est donc recommandé d'augmenter les ressources allouées à l'application Egapro en production avant le pic de la dernière semaine de la campagne de déclaration de l'index.

| Période           | Nombre de réplicas Min | Nombre de réplicas Max |
| :---------------- | :--------------------: | :--------------------: |
| hors campagne     |           2            |           6            |
| début de campagne |           4            |           8            |
| fin de campagne   |           6            |           12           |

> ⚠️ Il est préférable de tester le mécanisme de scale-up de l'application en production avant le commencement de la campagne. Il faut s'assurer qu'au moment du scale-up l'application pourra continuer à répondre aux requêtes des clients le temps que les nouveaux pods soient disponibles.
