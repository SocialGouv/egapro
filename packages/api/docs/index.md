# API Egapro

## Schéma

- jsonschema : [https://egapro.travail.gouv.fr/api/jsonschema.json](https://egapro.travail.gouv.fr/api/jsonschema.json)
- Une version un peu plus "human readable" du schéma: [https://github.com/SocialGouv/egapro-api/blob/schema/egapro/schema/raw.yml](https://github.com/SocialGouv/egapro-api/blob/schema/egapro/schema/raw.yml)

À noter:

- pour les appels API, la source **doit** être `api`

## Racine de l'API

- Dev: `https://dev.egapro.fabrique.social.gouv.fr/api`
- Prod: `https://egapro.travail.gouv.fr/api`

## Endpoints

### /token (POST)
Pour demander un token.

Body attendu: `{"email": "foo@bar.org"}`

### /declaration/{siren}/{year} (PUT, GET)
Pour ajouter ou modifier une déclaration.

Où `siren` est le numéro de siren de l'entreprise ou UES déclarant, et `year` l'année de validité des indicateurs déclarés.

Pour aller voir les mails envoyés par le serveur de dev:

https://mailtrap.ovh.egapro.fabrique.social.gouv.fr/

(Demander un accès.)

## Process avec envoi d'email

1. Faire un POST sur `/token`, en passant un email dans un body json:

    `{"email": "foo@bar.org"}`

1. Récupérer le token envoyé par mail (via l'interface mailtrap dans le cas du serveur de dev)

1. Faire un PUT sur `/declaration`, en passant le token via le header `API-KEY`

## Process depuis une IP partenaire

1. Faire un POST sur `/token`, en passant un email dans un body json:

    `{"email": "foo@bar.org"}`

1. Récupérer le token envoyé en retour de cet appel. Example:

    `{"token": "valeur_de_token"}`

1. Faire un PUT sur `/declaration`, en passant le token via le header `API-KEY`
