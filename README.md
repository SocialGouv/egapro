# EgaPro

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
POST    |`api/indicators-datas`             | `{ }`                        | `{id: string}`                |
PUT     |`api/indicators-datas/{id}`        | `{ id: string, data: string}`| `{id: string, data: string}`  |
GET     |`api/indicators-datas/{id}`        |                              | `{id: string, data: string}`  |
POST    |`api/indicators-datas/{id}/emails` | `{ email: string }`          | `status` = `200` ou `400`     |

