# EgaPro

> Calcul de l'indexe d'égalité homme / femme dans les entreprises

## Environnement de développement

###  Kinto, la base de données

ajouter le fichier `.env` dans `packages/kinto`

```bash
cp .env.sample .env
```

lancer `kinto`

```bash
yarn db:start

// la première fois, initialiser kinto
yarn db:init
```

pour arrêter `kinto`

```bash
yarn db:stop
```

### le back-end

ajouter le fichier `.env` dans `packages/api`

```bash
cp .env.sample .env
```

### les commandes 

pour démarrer, le front-end et le back-end

```bash
yarn start
```

## Lancer en local

### avec docker

lancer kinto,

builder les images docker

```bash
docker build -t egapro-app -f packages/app/Dockerfile .

docker build -t egapro-api -f packages/api/Dockerfile .
```

lancer les containeurs

```bash

docker run -p 8080:9000 egapro-app 

docker run -p 4000:4000 egapro-api 
```

## End Points

Action  |API                                | body                         |Réponse                        |
--------|-----------------------------------|------------------------------|-------------------------------|
POST    |`api/indicators_datas`             | `{ }`                        | `{id: string}`                |
PUT     |`api/indicators_datas`             | `{id: string, data: string}` | `status` = `200` ou `400`     |
GET     |`api/indicators_datas/{id}`        |                              | `{id: string, data: string}`  |
POST    |`api/indicators_datas/{id}/emails` | `{ email: string }`          | `status` = `200` ou `400`     |

