# EgaPro

## URL

Prod : <https://egapro.travail.gouv.fr/>

Préprod : <https://egapro-preprod.dev.fabrique.social.gouv.fr/>

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
yarn dev:simulateur
yarn dev:declaration
yarn dev:maildev
```

- [api         -> http://localhost:2626](http://localhost:2626)
- [app         -> http://localhost:3000](http://localhost:3000)
- `simulateur` a besoin de `api` en local ou de `REACT_APP_EGAPRO_API_URL` d'être renseigné dans le fichier `packages/simulateur/.env` :
  - [simulateur  -> http://localhost:3001/simulateur/nouvelle-simulation](http://localhost:3001/simulateur/nouvelle-simulation)
- [declaration -> http://localhost:4000](http://localhost:4000)
- [maildev     -> http://localhost:1080](http://localhost:1080)

Tout en un :
```bash
yarn dev
```

## Reverse proxy iso prod
Il est possible de configurer son environnement local eviter d'utiliser les ports et passer toutes les applications sous le même domaine.  
Le reverse proxy est configuré à travers un nginx, mais a besoin que les composants voulu soient configurés en conséquence :
- `api` => pas de config a ajouter
- `app`
  - `packages/app/.env.development.local` => `NEXT_PUBLIC_API_URL=http://localhost/api`
  - apiv2 non supportée pour l'instant (si besoin de dev sur apiv2, passer directement par l'url classique http://localhost:3000)
- `declaration` => copier le `.env.dist` vers `.env` (racine) si besoin, puis
  - `BASE_URL="/index-egapro/declaration"`
  - `EGAPRO_API_URL="https://localhost/api"` (si api locale)
  - `EGAPRO_SIMU_URL="http://localhost/index-egapro"` (si besoin de la simu)
- `simulateur` => copier le `packages/simulateur/.env.dist` vers `packages/simulateur/.env` si besoin, puis
  - `REACT_APP_DECLARATION_URL="http://localhost/index-egapro/declaration"` (si besoin de la decla)
  - `REACT_APP_EGAPRO_API_URL="https://localhost/api"` (si api locale)


Enfin, il suffit de lancer dans une fenêtre le serveur nginx prévu :
```bash
yarn reverse-proxy
```
(maildev et la base de données ne sont pas affectés par le reverse proxy)

Les adresses deviennent alors :
- [api         -> http://localhost/api](http://localhost/api)
- [app         -> http://localhost](http://localhost)
- [simulateur  -> http://localhost/index-egapro/simulateur/nouvelle-simulation](http://localhost/index-egapro/simulateur/nouvelle-simulation)
- [declaration -> http://localhost/index-egapro/declaration](http://localhost/index-egapro/declaration)

## Pour tout arrêter

Faire `Ctl-C` sur tous les terminaux

Remarque : pour l'API, la déclaration et maildev, on peut faire `docker-compose down`.

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
yarn workspace simulateur add moment
````

### Comment lancer un script dans un package ?

````bash
yarn workspace simulateur run test
````

### Comment lancer la déclaration en local ?

```bash
yarn dev:api
yarn dev:maildev
yarn dev:declaration
```

### Comment lancer un script dans tous les workspaces ?

````bash
yarn workspaces run lint
````

### Comment ajouter un membre dans le groupe Staff en développement ?

Pour l'API v1, aller dans `.env` à la racine et renseigner la variable `EGAPRO_STAFF` (emails séparés par des virgules sans espace).

Pour l'API v2, aller dans `packages/app/.env.development` et renseigner la variable `EGAPRO_STAFF` (emails séparés par des virgules sans espace).

### Quel est le maildev pour un environnement de recette ?

Ajouter le préfixe `maildev-` devant l'URL.

Si l'environnement est `https://egapro-feat-limit-char-11oson.dev.fabrique.social.gouv.fr/`.

Le maildev se trouvera alors à `https://maildev-egapro-feat-limit-char-11oson.dev.fabrique.social.gouv.fr/`

## Fichiers

Certains fichiers sont exposés par le serveur web pour différents acteurs.

Le fichier index-egalite-fh.csv est généré tous les jours et accessible sans restriction.

Les fichiers suivants, sont accessibles uniquement si authentifié ou pour certaines adresses IP (voir la liste blanche dans `.kontinuous/values.yaml`).

- dgt.xlsx
- dgt-representation.xlsx
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

