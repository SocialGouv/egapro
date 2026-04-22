# API EGAPRO — Équipe SUIT

API REST sécurisée pour récupérer les déclarations soumises et les fichiers (avis CSE, évaluations conjointes).

L'authentification et le quota (rate limit) sont appliqués par la passerelle EGAPRO (APISIX) en amont de l'application. Côté client, il suffit donc d'un en-tête `Authorization: Bearer <clé>`.

## Base URL

- Alpha : `https://api-suit.egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1`

> L'URL est distincte de l'interface utilisateurs (`egapro-alpha.…`) car l'API emprunte une passerelle dédiée.

## Authentification

Un seul en-tête :

| Header | Valeur |
| --- | --- |
| `Authorization` | `Bearer <EGAPRO_SUIT_API_KEY>` |

La clé est fournie par l'équipe EGAPRO. Elle doit rester secrète (coffre, secret manager).

## Rate limit

La passerelle applique un quota par IP (≈ 10 requêtes/seconde, burst de 5). Au-delà, l'API renvoie `429 Too Many Requests` avec un en-tête `Retry-After`. En usage normal (un export par jour), le quota n'est jamais atteint.

## Endpoints

### 1. Exporter les déclarations

```sh
curl "$BASE_URL/export/declarations?date_begin=2026-01-01&date_end=2026-01-31" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY"
```

- `date_begin` (obligatoire, `YYYY-MM-DD`) : date de début incluse
- `date_end` (optionnel, `YYYY-MM-DD`) : date de fin exclue. Par défaut : `date_begin + 1 jour`

### 2. Lister les fichiers d'une déclaration

```sh
curl "$BASE_URL/files?siren=123456789&year=2026" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY"
```

- `siren` (9 chiffres) et `year` (`YYYY`) obligatoires

### 3. Télécharger un fichier

```sh
curl -OJ "$BASE_URL/files/<fileId>" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY"
```

Le `fileId` est renvoyé par l'endpoint `/files`.

## Réponses d'erreur

| Code | Cause |
| --- | --- |
| `400` | Paramètres invalides (validation Zod côté application) |
| `401` | Clé API manquante ou invalide (renvoyé par la passerelle) |
| `404` | Fichier introuvable |
| `429` | Quota dépassé (renvoyé par la passerelle) |
| `500` | Erreur serveur |

## Documentation OpenAPI

Disponible hors production (désactivée en prod) :

- Swagger UI : `https://api-suit.egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1/docs`
- Spec JSON : `https://api-suit.egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1/openapi.json`

## Tester via Swagger UI

Dans Swagger UI, cliquer sur **Authorize**, coller la clé dans le champ `bearerAuth` (sans le préfixe `Bearer`, que Swagger ajoute automatiquement), puis utiliser **Try it out** sur chaque endpoint.
