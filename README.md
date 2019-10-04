# EgaPro

[![pipeline status](https://gitlab.factory.social.gouv.fr/SocialGouv/egapro/badges/master/pipeline.svg)](https://gitlab.factory.social.gouv.fr/SocialGouv/egapro/commits/master)
[![Build Status](https://travis-ci.com/SocialGouv/egapro.svg?branch=master)](https://travis-ci.com/SocialGouv/egapro)
[![codecov](https://codecov.io/gh/SocialGouv/egapro/branch/master/graph/badge.svg)](https://codecov.io/gh/SocialGouv/egapro)

> Calcul de l'indexe d'égalité homme / femme dans les entreprises

## Lancer le projet avec docker

Ajouter le fichier `.env` à la racine du projet:

```bash
cp .env.sample .env
```

Y modifier les variables d'environnement nécessaires, comme par exemple les
accès au serveur kinto, au serveur de mail...

Puis lancer les conteneurs:

```bash
docker-compose up --build
```

Une fois que le message `egapro_init-kinto_1 exited with code 0` est affiché dans le terminal, le site est accessible sur http://localhost:8080.

## Contribuer au projet

Pour contribuer au projet et avoir de l'auto-reload de
l'[application](./packages/app) et de l'[API](./packages/api) lors d'un
changement de fichier, ils ne sont pas lancés via docker, mais directement
avec `yarn`. [Kinto](https://kinto.readthedocs.io), la base de donnée et
memcache sont eux toujours lancés (automatiquement) via docker-compose:

```bash
yarn install
```

Ensuite pour démarrer le frontend :

```bash
yarn start
```

Et le site est accessible sur http://localhost:3000

## End Points

| Action | API                                | body                          | Réponse                      |
| ------ | ---------------------------------- | ----------------------------- | ---------------------------- |
| GET    | `api/version`                      |                               | `{ version: string }`        |
| POST   | `api/indicators-datas`             | `{ }`                         | `{id: string}`               |
| PUT    | `api/indicators-datas/{id}`        | `{ id: string, data: string}` | `{id: string, data: string}` |
| GET    | `api/indicators-datas/{id}`        |                               | `{id: string, data: string}` |
| POST   | `api/indicators-datas/{id}/emails` | `{ email: string }`           | `status` = `200` ou `400`    |

## Release policy

### Auto

Trigger a custom build on [Travis](https://travis-ci.com/SocialGouv/egapro) (in the "More options" right menu) on the `master` branch with a custom config:

```yml
env:
  global:
    - RELEASE=true
```

You can change the lerna arguments though the `LERNA_ARGS` variable.

```yml
env:
  global:
    - LERNA_ARGS="major --force-publish --yes"
    - RELEASE=true
```

### Manual

You need an [Github token](https://github.com/settings/tokens/new) to release.

```sh
#
# Bump, push to git and publish to npm
$ GH_TOKEN=${GITHUB_TOKEN} yarn lerna version

#
# You might want to add a Gif to your release to make it groovy ;)
```
