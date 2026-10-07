# API publique EGAPRO

API publique d'export des indicateurs de rémunération A à F des déclarations d'index égalité professionnelle. Aucune authentification requise. Accessible depuis n'importe quelle origine (CORS `*`).

La spécification OpenAPI 3.1 complète est disponible à :

```
GET /api/public/openapi.json
```

## Modèle de données

### Données brutes — aucun score ni indice /100

Cette API expose uniquement les **données brutes** calculées par le GIP-MDS à partir des DSN :

- Écarts de rémunération (moyens et médians, annuels et horaires)
- Proportions de bénéficiaires de rémunération variable — part de l'effectif de chaque sexe qui en bénéficie (`bénéficiaires femmes / totalWomen`, `bénéficiaires hommes / totalMen`). Les deux valeurs sont indépendantes et **ne somment pas à 1**.
- Répartitions par quartile de rémunération (proportions F/H) — celles-ci, à l'inverse, somment bien à 1 sur chaque quartile
- Effectifs (femmes / hommes pris en compte, sur base annuelle `totalWomen` / `totalMen` et sur base horaire `hourlyWomen` / `hourlyMen`)

**Aucun score ni indice global /100 n'est exposé.** Le calcul de l'index implique des règles de pondération et de seuils qui ne font pas partie de la diffusion publique.

### Indicateur G exclu

L'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) est exclu de cette API. Il s'agit d'une donnée déclarative, contrairement aux indicateurs A–F pré-calculés par le GIP-MDS.

### Identité des entreprises non diffusibles masquée

Pour les entreprises dont le statut de diffusion est non diffusible (`statutDiffusion === 'N'`), les champs d'identité, de localisation et d'activité valent `Non-diffusible` : `name`, `address`, `city`, `regionCode`, `region`, `departmentCode`, `departmentLabel`, `countryCode`, `countryLabel`, `nafCode`, `nafLabel`.

Le SIREN, l'effectif EMA (`workforceEma`) et l'intégralité des indicateurs A–F restent disponibles.

### Nomenclature des champs NAF

`nafCode` et `nafLabel` sont servis en **NAF rév. 2**, la nomenclature en vigueur, et forment un couple cohérent (le code et son libellé décrivent la même activité).

Entre mars 2026 et la correction de l'issue #4087, `nafCode` a été servi en NAF 2025 (rév. 3) alors que `nafLabel` restait en rév. 2 : les consommateurs qui ont mis un code en cache sur cette période peuvent voir sa valeur changer pour les entreprises dont le code a été remappé par l'INSEE (par exemple `65.12Y` → `65.12Z`).

Le passage au couple NAF 2025 complet (code **et** libellé) interviendra quand cette nomenclature deviendra la référence d'attribution des codes APE, au 1ᵉʳ janvier 2027.

### Gate par date de rendu public

Seules les déclarations dont l'année correspond à une campagne dont la **date de rendu public** est atteinte sont servies. Les données d'une campagne en cours ou dont la date de publication n'est pas encore passée ne sont pas exposées.

## Gating en production

Contrairement à l'API SUIT (`/api/v1/openapi.json`, retournant 404 en production), la spec publique est **servie dans tous les environnements** (dev, alpha, production). L'API publique est destinée à un usage externe libre et ne contient pas de données sensibles.

## Endpoints

| Méthode | Chemin | Description |
| --- | --- | --- |
| `GET` | `/api/public/declarations/export` | Export complet (JSON, CSV ou Excel) |
| `GET` | `/api/public/openapi.json` | Spécification OpenAPI 3.1 |

### Export complet (`GET /api/public/declarations/export`)

Retourne l'intégralité des déclarations publiées. Le paramètre `format` accepte `json` (défaut) ou `csv`.

```sh
# JSON
curl "https://egapro.travail.gouv.fr/api/public/declarations/export"

# CSV (séparateur ;)
curl "https://egapro.travail.gouv.fr/api/public/declarations/export?format=csv" \
  -o index-egapro-remunerations.csv
```

## Données complètes sur data.gouv.fr

Les jeux de données publics complets sont publiés sur data.gouv.fr :

- [Index égalité professionnelle F/H des entreprises de 50 salariés ou plus](https://www.data.gouv.fr/datasets/index-egalite-professionnelle-f-h-des-entreprises-de-50-salaries-ou-plus)
- [Représentation équilibrée F/H dans les postes de direction des grandes entreprises](https://www.data.gouv.fr/datasets/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes-entreprises)

La représentation équilibrée n'est exposée par aucune API publique : elle se consulte sur la fiche entreprise de l'observatoire et sur data.gouv.fr.

## Licence

Données diffusées sous [Licence Ouverte / Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence).
