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
- Proportions de bénéficiaires de rémunération variable — part de l'effectif de chaque sexe qui en bénéficie (`bénéficiaires femmes / totalWomen`, `bénéficiaires hommes / totalMen`). Les deux valeurs sont indépendantes et **ne somment pas à 1**.
- Répartitions par quartile de rémunération (proportions F/H) — celles-ci, à l'inverse, somment bien à 1 sur chaque quartile
- Effectifs (femmes / hommes pris en compte, sur base annuelle `totalWomen` / `totalMen` et sur base horaire `hourlyWomen` / `hourlyMen`)

**Aucun score ni indice global /100 n'est exposé.** Le calcul de l'index implique des règles de pondération et de seuils qui ne font pas partie de la diffusion publique.

### Indicateur G exclu

L'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) est exclu de cette API. Il s'agit d'une donnée déclarative, contrairement aux indicateurs A–F pré-calculés par le GIP-MDS.

### Identité des entreprises non diffusibles masquée

Pour les entreprises dont le statut de diffusion est non diffusible (`statutDiffusion === 'N'`), les champs d'identité, de localisation et d'activité valent `Non-diffusible` :

- rémunération : `name`, `address`, `city`, `regionCode`, `region`, `departmentCode`, `departmentLabel`, `countryCode`, `countryLabel`, `nafCode`, `nafLabel`
- représentation : `name`, `address`, `region`, `departmentCode`, `departmentLabel`, `nafCode`, `nafLabel`

Le SIREN, l'effectif EMA (`workforceEma`) et l'intégralité des indicateurs A–F restent disponibles.

### Nomenclature des champs NAF

`nafCode` et `nafLabel` sont servis en **NAF rév. 2**, la nomenclature en vigueur, et forment un couple cohérent (le code et son libellé décrivent la même activité).

Entre mars 2026 et la correction de l'issue #4087, `nafCode` a été servi en NAF 2025 (rév. 3) alors que `nafLabel` restait en rév. 2 : les consommateurs qui ont mis un code en cache sur cette période peuvent voir sa valeur changer pour les entreprises dont le code a été remappé par l'INSEE (par exemple `65.12Y` → `65.12Z`). Le filtre `naf` de l'endpoint représentation fait une égalité stricte sur ce code : une requête construite avec un code NAF 2025 ne renverra plus de résultat.

Le passage au couple NAF 2025 complet (code **et** libellé) interviendra quand cette nomenclature deviendra la référence d'attribution des codes APE, au 1ᵉʳ janvier 2027.

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
| `GET` | `/api/public/declarations/export` | Export complet (JSON, CSV ou Excel) |
| `GET` | `/api/public/openapi.json` | Spécification OpenAPI 3.1 |

### Recherche (`GET /api/public/declarations`)

| Paramètre | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `q` | string | non | Texte libre (raison sociale, SIREN) |
| `region` | string | non | Code région (ex. `11`) |
| `departement` | string | non | Code département (ex. `75`) |
| `naf` | string | non | Code NAF, nomenclature **NAF rév. 2**, en égalité stricte (ex. `26.51A`) |
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

Retourne l'intégralité des déclarations publiées, toutes années confondues. Le paramètre `format` accepte `json` (défaut), `csv` ou `xlsx`. Les filtres de la recherche (`q`, `region`, `departement`, `naf`, `year`…) peuvent être repris pour restreindre l'export ; `limit`, `offset` et `sort` sont ignorés.

```sh
# JSON
curl "https://egapro.travail.gouv.fr/api/public/declarations/export"

# CSV (séparateur ;)
curl "https://egapro.travail.gouv.fr/api/public/declarations/export?format=csv" \
  -o index-egapro-remunerations.csv

# CSV d'une seule année
curl "https://egapro.travail.gouv.fr/api/public/declarations/export?format=csv&year=2027" \
  -o index-egapro-remunerations-2027.csv
```

### Plafonds, cache et calculs simultanés

Les deux exports — `/api/public/declarations/export` et `/api/public/representations/export` (représentation équilibrée, `csv` ou `xlsx`) — appliquent un nombre maximal de lignes par requête :

| Format | Plafond |
| --- | --- |
| `xlsx` | 10 000 lignes |
| `json`, `csv` | 200 000 lignes |

Au-delà, l'API répond **`413 Payload Too Large`** avec un message d'erreur JSON (`{ "error": "…" }`) au lieu d'un export tronqué : ajoutez des filtres — typiquement `year` — ou, pour Excel, passez au format CSV.

Le plafond JSON/CSV est dimensionné pour l'export complet sans filtre, celui que publie la ressource data.gouv.fr et que sert le bouton « tout télécharger » de la consultation. Environ 35 000 entreprises déclarent par campagne et l'export couvre toutes les campagnes publiées depuis 2027 : 200 000 lignes laissent cinq campagnes de marge, tout en bornant la mémoire d'une requête (de l'ordre du gigaoctet au plafond, pour des pods limités à 2 Go). À l'approche du plafond, la ressource data.gouv.fr devra passer à un export par année (`year`).

Seuls les trois exports complets, **sans aucun filtre**, sont mis en cache **1 heure côté serveur** :

| Export | Utilisé par |
| --- | --- |
| `/api/public/declarations/export?format=csv` | la ressource data.gouv.fr, le bouton « tout télécharger » |
| `/api/public/declarations/export` (JSON) | l'export complet documenté ci-dessus |
| `/api/public/representations/export?format=csv` | le bouton « tout télécharger » |

`limit`, `offset`, `sort` et les paramètres inconnus ne comptent pas comme des filtres. Une modification met donc jusqu'à une heure à se refléter dans ces exports, comme le permet déjà l'en-tête `Cache-Control: public, max-age=3600`. Cela vaut dans les deux sens : une nouvelle déclaration publiée peut tarder à apparaître, et un **retrait** (entreprise devenue non diffusible, déclaration annulée) peut tarder jusqu'à une heure à disparaître. Des requêtes simultanées sur un même export complet absent du cache ne déclenchent qu'un seul calcul par pod.

Les autres exports (filtrés, ou au format Excel) sont recalculés à chaque requête. Tous exports confondus, un pod calcule au plus **deux exports à la fois** — un export complet absent du cache compte aussi. Au-delà, l'API répond **`503 Service Unavailable`** avec un en-tête `Retry-After` (en secondes) et un message d'erreur JSON. Réessayez après ce délai.

## Licence

Données diffusées sous [Licence Ouverte / Open Licence 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence).
