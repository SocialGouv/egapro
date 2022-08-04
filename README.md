# EgaPro

## URL

Prod : <https://index-egapro.travail.gouv.fr/>

Préprod : <https://egapro-preprod.dev.fabrique.social.gouv.fr/>

## Installer

```bash
yarn
```

## Lancer

One component at time

```bash
yarn dev:api
yarn dev:app
yarn dev:simulateur
yarn dev:declaration
yarn dev:maildev
```

- [api         -> http://localhost:2626](http://localhost:2626)
- [app         -> http://localhost:3000/consulter-index/](http://localhost:3000/consulter-index/)
- [simulateur  -> http://localhost:3001](http://localhost:3001)
- [declaration -> http://localhost:4000](http://localhost:4000)
- [maildev     -> http://localhost:1080](http://localhost:1080)

All in one

```bash
yarn dev
```

## Pour tout arrêter

Faire `Ctl-C` sur tous les terminaux

Remarque : pour l'API, la déclaration et maildev, on peut faire `docker-compose down`.

## Tests

```bash
yarn check-all
```

Cette commande lance le linter, la compilation des types TS et les tests.

## FAQ

### Comment ajouter une librairie dans un workspace

````bash
yarn workspace simulateur add moment
````

### Comment lancer un script dans un package

````bash
yarn workspace simulateur run test
````

### Comment lancer un script dans tous les workspaces

````bash
yarn workspaces run lint
````

## Fichiers

Certains fichiers sont exposés par le serveur web pour différents acteurs.

Le fichier index-egalite-fh.csv est généré tous les jours et accessible sans restriction.

Les fichiers suivants, sont accessibles uniquement si authentifié ou pour certaines adresses IP (voir la liste blanche dans `.kontinuous/values.yaml`).

- dgt.xlsx
- full.ndjson
- indexes.csv

## Helpers egapro

L'API contient un CLI avec certaines commandes utiles :

Pour les lancer :

```sh
yarn egapro --help
```

Les commandes vont se lancer dans l'environnement local.

Si l'on veut lancer ces commandes dans un container (ex: en prod, en préprod ou dans un environnement lié à une PR), il faut se connecter au container et lancer la commande egapro.
