# API publique EGAPRO

API publique de consultation des déclarations d'index égalité professionnelle. Aucune authentification requise. Accessible depuis n'importe quelle origine (CORS `*`).

La spécification OpenAPI 3.1 complète est disponible à :

```
GET /api/public/openapi.json
```

## Modèle de données

### Données brutes — aucun score ni indice /100

Cette API expose uniquement les **données brutes** calculées par le GIP-MDS à partir des DSN :

- Écarts de rémunération (moyens et médians, annuels et horaires)
- Proportions de bénéficiaires de rémunération variable
- Répartitions par quartile de rémunération (proportions F/H)
- Effectifs (femmes / hommes pris en compte)

**Aucun score ni indice global /100 n'est exposé.** Le calcul de l'index implique des règles de pondération et de seuils qui ne font pas partie de la diffusion publique.

### Indicateur G exclu

L'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) est exclu de cette API. Il s'agit d'une donnée déclarative, contrairement aux indicateurs A–F pré-calculés par le GIP-MDS.

### Identité des entreprises non diffusibles masquée

Pour les entreprises dont le statut de diffusion est non diffusible (`statutDiffusion === 'N'`), les champs d'identité sont retournés à `null` :

- `name`, `address`, `region`, `departmentCode`, `departmentLabel`, `nafCode`, `nafLabel`

Le SIREN, l'effectif EMA (`workforceEma`) et l'intégralité des indicateurs A–F restent disponibles.

### Gate par date de rendu public

Seules les déclarations dont l'année correspond à une campagne dont la **date de rendu public** est atteinte sont servies. Les données d'une campagne en cours ou dont la date de publication n'est pas encore passée ne sont pas exposées.

## Gating en production

Contrairement à l'API SUIT (`/api/v1/openapi.json`, retournant 404 en production), la spec publique est **servie dans tous les environnements** (dev, alpha, production). L'API publique est destinée à un usage externe libre et ne contient pas de données sensibles.

## Endpoints

| Méthode | Chemin | Description |
| --- | --- | --- |
| `GET` | `/api/public/declarations` | Recherche paginée |
| `GET` | `/api/public/declarations/{siren}` | Toutes les déclarations d'un SIREN |
| `GET` | `/api/public/declarations/{siren}/{year}` | Déclaration d'un SIREN pour une année |
| `GET` | `/api/public/declarations/export` | Export complet (JSON ou CSV) |
| `GET` | `/api/public/openapi.json` | Spécification OpenAPI 3.1 |

### Recherche (`GET /api/public/declarations`)

| Paramètre | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `q` | string | non | Texte libre (raison sociale, SIREN) |
| `region` | string | non | Code région (ex. `11`) |
| `departement` | string | non | Code département (ex. `75`) |
| `naf` | string | non | Code NAF (ex. `26.51A`) |
| `year` | integer | non | Année de déclaration |
| `limit` | integer | non | Résultats par page (1–100, défaut 10) |
| `offset` | integer | non | Décalage de pagination (défaut 0) |

Exemple :

```sh
curl "https://egapro.travail.gouv.fr/api/public/declarations?q=THALES&year=2026&limit=5"
```

### Par SIREN (`GET /api/public/declarations/{siren}`)

Retourne toutes les années publiées pour un SIREN donné, triées par année décroissante.

```sh
curl "https://egapro.travail.gouv.fr/api/public/declarations/319159877"
```

### Par SIREN et année (`GET /api/public/declarations/{siren}/{year}`)

Retourne la déclaration d'un SIREN pour une année précise. Retourne 404 si la date de rendu public n'est pas encore atteinte.

```sh
curl "https://egapro.travail.gouv.fr/api/public/declarations/319159877/2026"
```

### Export complet (`GET /api/public/declarations/export`)

Retourne l'intégralité des déclarations publiées. Le paramètre `format` accepte `json` (défaut) ou `csv`.

```sh
# JSON
curl "https://egapro.travail.gouv.fr/api/public/declarations/export"

# CSV (séparateur ;)
curl "https://egapro.travail.gouv.fr/api/public/declarations/export?format=csv" \
  -o declarations_export.csv
```

## Licence

Données diffusées sous [Licence Ouverte / Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence).
