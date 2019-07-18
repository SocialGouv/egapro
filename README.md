# EgaPro

[![pipeline status](https://gitlab.factory.social.gouv.fr/SocialGouv/egapro/badges/master/pipeline.svg)](https://gitlab.factory.social.gouv.fr/SocialGouv/egapro/commits/master)
[![Build Status](https://travis-ci.com/SocialGouv/egapro.svg?branch=master)](https://travis-ci.com/SocialGouv/egapro)
[![codecov](https://codecov.io/gh/SocialGouv/egapro/branch/master/graph/badge.svg)](https://codecov.io/gh/SocialGouv/egapro)

> Calcul de l'indexe d'égalité homme / femme dans les entreprises

## Environnement de développement

ajouter le fichier `.env` à la racine du projet

```bash
cp .env.sample .env
```

lancer le projet:

```bash
yarn start
```

## Lancer en local

### avec docker

```bash
docker-compose up --build
```


## End Points

Action  |API                                | body                         |Réponse                        |
--------|-----------------------------------|------------------------------|-------------------------------|
GET     |`api/version`                      |                              | `{ version: string }`         |
POST    |`api/indicators-datas`             | `{ }`                        | `{id: string}`                |
PUT     |`api/indicators-datas/{id}`        | `{ id: string, data: string}`| `{id: string, data: string}`  |
GET     |`api/indicators-datas/{id}`        |                              | `{id: string, data: string}`  |
POST    |`api/indicators-datas/{id}/emails` | `{ email: string }`          | `status` = `200` ou `400`     |

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
