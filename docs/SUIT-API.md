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

## Interprétation des champs et cycle de vie

Cette section décrit comment lire les champs déduits du parcours de la déclaration (`Parcours`, exposé par `/export/declarations`). Elle ne concerne **pas** `/export/representations`, dont le payload est indépendant.

### Cycle de vie : les 8 états et leurs transitions

Le champ `Parcours.Statut` suit une machine à états (FSM) versionnée (`Parcours.Version_regles`). Le tableau ci-dessous liste, pour chaque état source, les transitions possibles — dérivé du ruleset en vigueur (`v2027.1.json`) :

| État source | Action | État cible | Condition |
| --- | --- | --- | --- |
| `draft` | `submit` | `awaiting_compliance_path_choice` | effectif ≥ 100 et indicateur G calculé et écart ≥ 5 % |
| `draft` | `submit` | `awaiting_cse_opinion` | non (effectif ≥ 100 et indicateur G calculé et écart ≥ 5 %) et CSE requis |
| `draft` | `submit` | `demarche_completed` | non (effectif ≥ 100 et indicateur G calculé et écart ≥ 5 %) et non CSE requis |
| `awaiting_compliance_path_choice` | `choose_compliance_path` (justify) | `awaiting_cse_opinion` | CSE requis |
| `awaiting_compliance_path_choice` | `choose_compliance_path` (justify) | `demarche_completed` | CSE non requis |
| `awaiting_compliance_path_choice` | `choose_compliance_path` (corrective_action) | `corrective_actions_chosen` | — |
| `awaiting_compliance_path_choice` | `choose_compliance_path` (joint_evaluation) | `joint_evaluation_chosen` | — |
| `corrective_actions_chosen` | `submit_second_declaration` | `awaiting_revision_choice` | l'écart persiste (≥ 5 %) |
| `corrective_actions_chosen` | `submit_second_declaration` | `awaiting_cse_opinion` | l'écart est résorbé (< 5 %) et CSE requis |
| `corrective_actions_chosen` | `submit_second_declaration` | `demarche_completed` | l'écart est résorbé (< 5 %) et CSE non requis |
| `joint_evaluation_chosen` | `submit_joint_evaluation` | `awaiting_cse_opinion` | CSE requis |
| `joint_evaluation_chosen` | `submit_joint_evaluation` | `demarche_completed` | CSE non requis |
| `awaiting_revision_choice` | `submit_second_declaration` | `awaiting_revision_choice` | l'écart persiste (≥ 5 %) |
| `awaiting_revision_choice` | `submit_second_declaration` | `awaiting_cse_opinion` | l'écart est résorbé (< 5 %) et CSE requis |
| `awaiting_revision_choice` | `submit_second_declaration` | `demarche_completed` | l'écart est résorbé (< 5 %) et CSE non requis |
| `awaiting_revision_choice` | `choose_compliance_path` (justify) | `awaiting_cse_opinion` | CSE requis |
| `awaiting_revision_choice` | `choose_compliance_path` (justify) | `demarche_completed` | CSE non requis |
| `awaiting_revision_choice` | `choose_compliance_path` (joint_evaluation) | `revised_joint_evaluation_chosen` | — |
| `revised_joint_evaluation_chosen` | `submit_joint_evaluation` | `awaiting_cse_opinion` | CSE requis |
| `revised_joint_evaluation_chosen` | `submit_joint_evaluation` | `demarche_completed` | CSE non requis |
| `awaiting_cse_opinion` | `submit_cse_opinion` | `demarche_completed` | — |
| `awaiting_cse_opinion` | `sync_cse_requirement` | `demarche_completed` | CSE non requis (le besoin d'avis CSE disparaît en cours de route) |
| `demarche_completed` | `submit_cse_opinion` | `demarche_completed` | — |

⚠️ `demarche_completed` n'est **pas** un cul-de-sac : `submit_cse_opinion` y reste disponible sans garde, un avis CSE supplémentaire pouvant être déposé jusqu'à 4 fois par an même une fois la démarche finalisée.

### `Parcours.Prochaines_etapes_possibles`

Ce tableau liste les transitions offertes depuis `Parcours.Statut`, calculées à l'export. Chaque entrée porte 5 clés :

| Clé | Description |
| --- | --- |
| `Identifiant_transition` | Identifiant **stable** de la transition dans le ruleset — destiné au diff côté SUIT (comparer les identifiants d'un export à l'autre plutôt que reconstruire l'état). |
| `Action` | L'action qui déclenche la transition. |
| `Etat_cible` | Le statut atteint si la transition est exécutée. |
| `Libelle` | L'intitulé du stage de l'étape **d'arrivée** (`null` si l'état cible n'appartient à aucun stage). |
| `Condition` | N'apparaît que lorsqu'un fait n'est **pas encore connu** au moment de l'export (garde indécise) — décrit alors ce qui départagera les variantes. Absente quand la garde est déjà tranchée. |

`Prochaines_etapes_possibles` vaut `[]` pour une déclaration annulée — aucune étape n'est proposée.

### Sémantique de l'effectif

`Parcours.Effectif` est l'effectif **GIP EMA arrondi à l'entier inférieur** — jamais l'effectif déclaré par l'entreprise. Ne pas le confondre avec `Effectif_F_rem_annuelle_globale` / `Effectif_H_rem_annuelle_globale` (à la racine du payload), qui sont des effectifs **déclarés** par l'entreprise et ne fondent aucun assujettissement.

Deux lectures de la taille de l'entreprise coexistent :

- `Parcours.Regime_obligations` — le **paquet d'obligations** applicable : `voluntary` (< 50, volontariat), `mandatory` (assujettissement standard) ou `mandatory_with_compliance` (assujettissement avec parcours de conformité).
- `Parcours.Tranche_effectif` — le **bucket de segmentation** : `<50`, `50-99`, `100-149`, `150-249`, `250+`.

Quand l'effectif GIP est inconnu, `Tranche_effectif` vaut `null` (jamais replié sur `<50`), tandis que `Regime_obligations` relève alors du volontariat.

### Masquage de `CSE_existant`

`CSE_existant` vaut `null` — et non `false` — pour les entreprises sous le seuil CSE (100 salariés) : l'information n'est simplement **pas exportée** pour ces entreprises, elle n'est pas absente au sens d'un CSE inexistant. Ne pas interpréter `null` comme « pas de CSE ».

### Flags d'obligation figés vs statut évolutif

`Parcours.Parcours_de_conformite_requis`, `Parcours_de_conformite_revision_requis`, `Avis_CSE_requis` et `Indicateur_G_requis` sont des prédicats **calculés à la soumission et figés** : ils ne changent jamais au fil de l'avancement de la démarche.

`Parcours.Statut`, à l'inverse, **évolue** à chaque transition FSM. Confondre les deux fait croire à tort qu'une obligation a disparu alors que la démarche a simplement avancé.

### Interprétation des annulations

Une déclaration annulée **remonte dans l'export**, sur la fenêtre de sa date d'annulation (`Date_annulation`). `Date_annulation != null` **prime** sur `Statut` : l'annulation ne fait pas transiter le FSM, `Parcours.Statut` reste figé à sa valeur d'avant annulation. `Parcours.Annulee` est le booléen explicite à utiliser pour détecter l'annulation. `Parcours.Prochaines_etapes_possibles` vaut alors `[]` — aucune étape « redéclarer » n'est proposée, cette transition n'existant pas dans le parcours.

### Périmètre du cycle de vie

Le cycle de vie décrit ci-dessus (FSM, `Prochaines_etapes_possibles`) ne concerne **que** le parcours rémunération, exposé par `/export/declarations`. Il ne s'applique pas à `/export/representations`, dont le payload est indépendant et inchangé.

## Rupture de compatibilité — version 3.0.0

La version `3.0.0` de l'API constitue une **rupture de compatibilité** : les données déduites du parcours (année, effectif, statut, flags d'obligation, version des règles) ont quitté la racine du payload pour l'objet `Parcours`, sans doublon déprécié. L'URL reste inchangée : `/api/v1/export/declarations` — aucun `/api/v2` n'est introduit.

⚠️ La mise en service doit être **coordonnée avec l'équipe SUIT avant déploiement** (bascule simultanée côté consommateur).

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
