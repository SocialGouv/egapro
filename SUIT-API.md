# API EGAPRO — Équipe SUIT

API REST sécurisée pour récupérer les déclarations soumises et les fichiers (avis CSE, évaluations conjointes).

## Base URL

- Alpha : `https://egapro-alpha.ovh.fabrique.social.gouv.fr`

## Authentification

Chaque requête doit porter **trois en-têtes** :

| Header | Valeur |
| --- | --- |
| `Authorization` | `Bearer <EGAPRO_SUIT_API_KEY>` |
| `X-Timestamp` | Epoch en secondes (UTC) |
| `X-Signature` | Signature RSA-SHA256 (base64) du payload `{timestamp}\|{METHOD}\|{pathname}` avec la clé privée SUIT |

Fenêtre anti-replay : **30 jours** en dev/alpha, **30 secondes** en preprod/prod.

## Générer la paire de clés RSA

À faire **une seule fois** côté SUIT. Garder la clé privée en lieu sûr (coffre, secret manager).

```sh
openssl genrsa -out suit_private_key.pem 4096
openssl rsa -in suit_private_key.pem -pubout -out suit_public_key.pem
```

Encoder la clé publique en base64 et la transmettre à l'équipe EGAPRO (qui l'injectera dans `EGAPRO_SUIT_PUBLIC_KEY_PEM`) :

```sh
base64 -w0 suit_public_key.pem     # Linux
base64 -i suit_public_key.pem | tr -d '\n'   # macOS
```

En retour, EGAPRO fournit la clé d'API (Bearer) à exporter :

```sh
export EGAPRO_SUIT_API_KEY="<clé fournie par EGAPRO>"
```

## Générer la signature pour toutes les routes (en une commande)

Équivalent shell du script `generate-suit-signature.js`. Signe toutes les routes SUIT avec le même `TS` et affiche les 3 headers + un `curl` prêt à copier pour chacune.

Prérequis : `suit_private_key.pem` dans le dossier courant, `EGAPRO_SUIT_API_KEY` exporté, `BASE_URL` défini.

```sh
BASE_URL="https://egapro-alpha.ovh.fabrique.social.gouv.fr"
TS=$(date +%s)

# Remplacer <fileId> par l'identifiant du fichier à télécharger.
for ROUTE in \
  "GET /api/v1/export/declarations" \
  "GET /api/v1/files" \
  "GET /api/v1/files/<fileId>"
do
  METHOD="${ROUTE%% *}"
  FULL_PATH="${ROUTE#* }"
  PATHNAME="${FULL_PATH%%\?*}"
  SIG=$(printf '%s|%s|%s' "$TS" "$METHOD" "$PATHNAME" \
    | openssl dgst -sha256 -sign suit_private_key.pem \
    | openssl base64 -A)
  echo "=== $METHOD $PATHNAME ==="
  echo "X-Timestamp: $TS"
  echo "X-Signature: $SIG"
  echo
  echo "curl -X $METHOD \\"
  echo "  -H 'Authorization: Bearer '\"\$EGAPRO_SUIT_API_KEY\" \\"
  echo "  -H 'X-Timestamp: $TS' \\"
  echo "  -H 'X-Signature: $SIG' \\"
  echo "  '$BASE_URL$FULL_PATH'"
  echo
done
```

Fenêtre de validité : **30 jours** sur alpha/dev, **30 secondes** sur preprod/prod. Au-delà → 403, il faut regénérer `TS` + `SIG`.

## Générer pour une seule route

```sh
TS=$(date +%s)
METHOD=GET
PATHNAME=/api/v1/export/declarations
SIG=$(printf '%s|%s|%s' "$TS" "$METHOD" "$PATHNAME" \
  | openssl dgst -sha256 -sign suit_private_key.pem \
  | openssl base64 -A)
echo "X-Timestamp: $TS"
echo "X-Signature: $SIG"
```

## Endpoints

### 1. Exporter les déclarations

```sh
curl "$BASE_URL/api/v1/export/declarations?date_begin=2026-01-01&date_end=2026-01-31" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY" \
  -H "X-Timestamp: $TS" \
  -H "X-Signature: $SIG"
```

- `date_begin` (obligatoire, `YYYY-MM-DD`) : date de début incluse
- `date_end` (optionnel, `YYYY-MM-DD`) : date de fin exclue. Par défaut : `date_begin + 1 jour`

### 2. Lister les fichiers d'une déclaration

```sh
curl "$BASE_URL/api/v1/files?siren=123456789&year=2026" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY" \
  -H "X-Timestamp: $TS" \
  -H "X-Signature: $SIG"
```

- `siren` (9 chiffres) et `year` (`YYYY`) obligatoires

### 3. Télécharger un fichier

```sh
curl -OJ "$BASE_URL/api/v1/files/<fileId>" \
  -H "Authorization: Bearer $EGAPRO_SUIT_API_KEY" \
  -H "X-Timestamp: $TS" \
  -H "X-Signature: $SIG"
```

Le `fileId` est renvoyé par l'endpoint `/api/v1/files`.

## Réponses d'erreur

| Code | Cause |
| --- | --- |
| `400` | Paramètres invalides |
| `401` | Clé API manquante ou invalide |
| `403` | Signature manquante, invalide ou timestamp hors fenêtre |
| `404` | Fichier introuvable |
| `500` | Erreur serveur |

## Documentation OpenAPI

Disponible hors production (désactivée en prod) :

- Swagger UI : `https://egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1/docs`
- Spec JSON : `https://egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1/openapi.json`

## Tester via Swagger UI

Swagger UI ne signe pas les requêtes. Générer `X-Timestamp` + `X-Signature` en shell (bloc **Générer pour une seule route** ci-dessus, en adaptant `PATHNAME`), puis ouvrir Swagger :

```sh
open "https://egapro-alpha.ovh.fabrique.social.gouv.fr/api/v1/docs"
```

1. Coller `X-Timestamp`, `X-Signature` et `Authorization: Bearer $EGAPRO_SUIT_API_KEY` dans **Authorize**
2. Lancer la requête via **Try it out**
3. 403 → regénérer `TS` + `SIG` (fenêtre 30 s en preprod/prod, 30 j en dev/alpha)
