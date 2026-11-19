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

Le service `files` lit ses identifiants basic-auth dans `packages/files/.htpasswd` (non versionné, format `htpasswd -B -C 12`). Ce fichier est généré par `scripts/files-htpasswd` (appelé par `yarn dev`, utilisateur/mot de passe `dev`/`dev` par défaut ; `scripts/files-htpasswd <user> <password>` pour le régénérer). En environnement Kubernetes, il est monté depuis le Secret `basic-auth` (clé `auth`), qui doit lui aussi contenir un hash bcrypt (`$2y$`) : un hash `$apr1$` n'est jamais accepté.

3. **Arrêter l'application**

-   Utiliser `Ctrl+C` dans chaque terminal
-   Pour l'API et maildev : `docker-compose down`

> PostgreSQL est épinglé en 18 et son volume `pgdata` est monté sur `/var/lib/postgresql` (et non plus `/var/lib/postgresql/data`). Une base locale créée avant ce changement n'est plus vue : la sauvegarder avec `pg_dump` avant de mettre à jour, puis la restaurer, ou repartir d'un volume neuf avec `docker volume rm`.

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

Le maildev (comme pgweb) n'est plus exposé publiquement. Il s'ouvre par un port-forward sur le namespace de l'environnement :

```bash
kubectl -n <namespace> port-forward svc/maildev 1080:1080
```

Le maildev se trouve alors à `http://localhost:1080`.

## Fichiers

Les six exports sont générés par l'API et servis par le composant `files`.

| Accès | Fichiers |
| :-- | :-- |
| Public, sans connexion | `index-egalite-fh.xlsx`, `dgt-export-representation.xlsx` |
| Authentification basique ou IP autorisée | `dgt.xlsx`, `dgt-representation.xlsx`, `full.ndjson`, `indexes.csv` |

En environnement déployé, le CronJob `exports` les régénère chaque jour à
**00:00 UTC** (voir `.kontinuous/templates/exports-cron.yaml`) et les publie dans
le stockage objet. `files` les lit depuis ce stockage, en flux, après les contrôles
d'accès : son pod ne monte plus de volume et peut être répliqué.

La bascule, le retour arrière et le diagnostic sont décrits dans le
[runbook des exports](packages/api/docs/exports.md).

### Développement local

`docker compose` démarre un MinIO local et crée le bucket `egapro-local-app` au
premier lancement. Les deux composants (`api` et `files`) reçoivent les mêmes
variables `S3_*`, avec le préfixe `dev` : rien à configurer.

```sh
pnpm dev        # ou docker compose up --build
```

Générer puis publier les six exports (c'est la commande du CronJob) :

```sh
docker compose exec api egapro publish-exports
```

- Sans configuration de stockage, la commande échoue **avant** de générer quoi que
  ce soit ; sur un export en échec (fichier vide, XLSX tronqué), elle sort en code
  1 et rien n'est publié pour cet export.
- Sur une base locale vide, `full.ndjson` fait 0 octet et est donc refusé. C'est
  voulu : créer au moins une déclaration dans l'app pour obtenir les six fichiers.
- Les journaux tracent chaque export :
  `--- Starting/Finished/FAILED export: <nom> ---`.

Contrôler le bucket et les objets publiés :

```sh
docker compose exec minio mc ls --recursive local/egapro-local-app
```

Télécharger depuis le serveur de fichiers local :

```sh
curl -fsSI http://127.0.0.1:8080/index-egalite-fh.xlsx
curl -fsSI http://127.0.0.1:8080/indexes.csv
```

En local, `FILES_PUBLIC` expose les six fichiers : les contrôles d'accès ne
s'appliquent qu'en environnement déployé. La console MinIO est sur
<http://127.0.0.1:9001> (`egapro` / `egapro-dev-password` par défaut).

Les commandes par fichier ci-dessous écrivent un fichier local dans `/mnt/files`
(volume `./mnt`) **sans le publier** ; pour alimenter le stockage, utiliser
`publish-exports`.

```sh
egapro export-public-data /mnt/files/index-egalite-fh.xlsx
egapro dump-dgt /mnt/files/dgt.xlsx
egapro dump-dgt-representation /mnt/files/dgt-representation.xlsx
egapro full /mnt/files/full.ndjson
egapro export-indexes /mnt/files/indexes.csv
egapro export-representation /mnt/files/dgt-export-representation.xlsx
```

### Stockage des fichiers

Les exports sont destinés à un stockage objet compatible S3 (#5236). Le générateur
(API) et le serveur `files` lisent **les mêmes variables**, sans préfixe `EGAPRO_` :

| Variable | Rôle |
| :-- | :-- |
| `S3_ENDPOINT` | URL du service de stockage |
| `S3_REGION` | Région signée des requêtes |
| `S3_BUCKET_NAME` | Bucket de l'environnement |
| `S3_PREFIX` | Préfixe optionnel dans le bucket (racine par défaut) |
| `S3_ACCESS_KEY_ID` | Identifiant d'accès |
| `S3_SECRET_ACCESS_KEY` | Clé secrète |

Les valeurs publiques vivent dans le ConfigMap `s3` de chaque environnement
(`.kontinuous/env/<env>/templates/s3.configmap.yaml`), injecté dans `api`, dans le
CronJob de génération quotidienne et dans `files`. Les deux identifiants viennent
du Secret `s3`, monté en optionnel : tant qu'il n'existe pas, les pods démarrent
normalement et c'est l'usage du stockage qui échoue, en nommant la variable
manquante.

Pour sceller les identifiants dans un cluster (le scellement est lié au cluster et
au namespace : un sealed secret n'est jamais réutilisable d'un environnement à
l'autre) :

```sh
kubectl -n <namespace> create secret generic s3 \
  --from-literal=S3_ACCESS_KEY_ID=<identifiant> \
  --from-literal=S3_SECRET_ACCESS_KEY=<clé> \
  --dry-run=client -o yaml \
  | kubeseal --format yaml > .kontinuous/env/<env>/templates/s3.sealed-secret.yaml
```

Aucun identifiant n'est jamais écrit en clair dans le dépôt. En local, `docker
compose` fournit les valeurs par défaut (voir `.env.dist` pour les surcharger).

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
