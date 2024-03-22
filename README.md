# EgaPro

## URL

Prod : <https://egapro.travail.gouv.fr/>

Préprod : <https://egapro-preprod.ovh.fabrique.social.gouv.fr/>

## Installer

```bash
yarn
```

Si developpement Python en local :

```bash
yarn setup-python
```

## Lancer

Un composant à la fois :

```bash
yarn dev:api
yarn dev:app
yarn dev:maildev
```

- [api         -> http://localhost:2626](http://localhost:2626)
    - la configuration vers la DB se fait dans le fichier .env de la racine du monorepo
- [app         -> http://localhost:3000](http://localhost:3000)
- [maildev     -> http://localhost:1080](http://localhost:1080)

Tout en un :

```bash
yarn dev
```

## Pour tout arrêter

Faire `Ctl-C` sur tous les terminaux

Remarque : pour arrêter l'API, la déclaration ou maildev, on peut faire `docker-compose down`.

## Tests

```bash
yarn check-all
```

Cette commande lance le linter, la compilation des types TS et les tests.

## FAQ

### Comment lancer la compilation TS ?

```bash
cd packages/app
yarn workspace app run tsc
```

### Comment ajouter une librairie dans un workspace ?

````bash
yarn workspace app add moment
````

### Comment lancer un script dans un package ?

````bash
yarn workspace app run test
````

### Comment lancer un script dans tous les workspaces ?

````bash
yarn workspaces run lint
````

### Quel est le maildev pour un environnement de recette ?

Ajouter le préfixe `maildev-` devant l'URL.

Si l'environnement est `https://egapro-feat-limit-char-11oson.ovh.fabrique.social.gouv.fr/`.

Le maildev se trouvera alors à `https://maildev-egapro-feat-limit-char-11oson.ovh.fabrique.social.gouv.fr/`

## Fichiers

Certains fichiers sont exposés par le serveur web pour différents acteurs.

Le fichier index-egalite-fh.csv est généré tous les jours et accessible sans restriction.

Les fichiers suivants, sont accessibles uniquement si authentifié ou pour certaines adresses IP (voir la liste blanche dans `.kontinuous/values.yaml`).

- dgt.xlsx
- dgt-representation.xlsx
- full.ndjson
- indexes.csv

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
