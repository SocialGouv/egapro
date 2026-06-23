# Conformité CNIL — Matomo en mode « exempté de consentement »

> Ce document récapitule les conditions de l'**exemption de consentement** de la
> CNIL pour la mesure d'audience, et **comment EGAPRO les remplit** : ce qui est
> traité côté code applicatif, ce qui relève de la configuration de l'instance
> Matomo, et ce qui est purement documentaire. Il sert de référence pour
> l'audit (ticket #3645) et pour l'exploitation de l'instance Matomo de prod.
>
> Sources de référence :
> - CNIL — *Matomo Analytics – Exemption – Guide de configuration*
>   ([PDF](https://www.cnil.fr/sites/default/files/atoms/files/matomo_analytics_-_exemption_-_guide_de_configuration.pdf)).
> - Matomo — *Privacy how-to* (<https://matomo.org/docs/privacy-how-to/>), qui
>   décrit explicitement l'usage « CNIL consent-exempt ».
>
> Pour **ce qu'on mesure** et **comment c'est implémenté**, voir
> [`strategie-tracking.md`](./strategie-tracking.md) ; pour la **liste exhaustive
> des événements**, voir [`plan-de-tracking.md`](./plan-de-tracking.md).

## Sommaire

- [Le principe](#le-principe)
- [Checklist CNIL → où c'est traité](#checklist-cnil--où-cest-traité)
- [Côté application (code)](#côté-application-code)
- [Côté instance Matomo (admin)](#côté-instance-matomo-admin)
- [Durées de conservation](#durées-de-conservation)
- [Pages légales & registre RGPD](#pages-légales--registre-rgpd)
- [Vérifier en local (docker compose)](#vérifier-en-local-docker-compose)
- [Résultat de la vérification](#résultat-de-la-vérification)

## Le principe

La CNIL **exempte de consentement** les traceurs de **mesure d'audience** à
condition qu'ils soient strictement cantonnés à cette finalité, anonymisés et
non réutilisés. Tant que ces conditions sont tenues, **aucun bandeau cookies
n'est nécessaire** pour ce tracking. Si l'une d'elles ne peut pas être tenue, il
faut basculer sur un recueil de consentement.

EGAPRO se place dans le cas **« avec cookies, exempté »** : Matomo dépose ses
cookies `_pk_id` / `_pk_ses` (mesure d'audience first-party), mais la
configuration respecte toutes les conditions ci-dessous.

## Checklist CNIL → où c'est traité

Légende — **Nature** : ✅ code applicatif · ⚙️ configuration de l'instance Matomo · 📄 documentaire.
La colonne *Statut & paramètre* donne la valeur exacte appliquée (et automatisée en
local par le service `matomo-init`, cf. [Vérifier en local](#vérifier-en-local-docker-compose)).

| Étape du guide CNIL | Nature | Statut egapro & paramètre appliqué |
|---|---|---|
| **1.** Désactiver les exports de données (Journal des visites / Profil visiteur) | ⚙️ | ✅ `Live.disable_visitor_log = 1` + `Live.disable_visitor_profile = 1` |
| **2.** Mécanisme d'opt-out sur le site | ✅ code | ✅ iframe Matomo `action=optOut` sur `/gestion-des-cookies` (`MatomoOptOut`) |
| **3a.** Anonymisation IP (masque 2 octets — défaut) | ⚙️ | ✅ `ipAnonymizerEnabled = 1`, `ipAddressMaskLength = 2`, `useAnonymizedIpForVisitEnrichment = 1` |
| **3b.** Cookies first-party uniquement, pas de cross-domain (défaut) | ⚙️ | ✅ défaut Matomo conservé (rien activé) |
| **3c.** Pas de « User ID » | ⚙️ | ✅ non utilisé + `anonymizeUserId = 1` (pseudonymisation) |
| **3d.** Site « n'est pas un site d'e-commerce » | ⚙️ | ✅ `ecommerce = 0` à la création du site |
| **3e.** `_paq.push(['HeatmapSessionRecording::disable'])` | ✅ code | ✅ poussé dans `onInitialization` de `MatomoAnalytics` |
| **4.** Pas de PII (dimensions / URLs / titres / events) | ✅ code | ✅ `cleanUrl = true` ; taxonomie sans PII ; dimensions = `2024` / `50-99` |
| **+** Respect du « Do Not Track » | ✅ ⚙️ | ✅ `setDoNotTrack(true)` (client) + `PrivacyManager.doNotTrackEnabled = 1` (serveur) |
| **+** Conservation : traceurs ≤ 13 mois, données brutes ≤ 25 mois | ⚙️ | ✅ cookie `_pk_id` 13 mois (défaut) + `delete_logs_older_than = 750` jours |
| **+** Inscription au registre RGPD | 📄 | ⏳ à tracer dans le registre des traitements |
| **+** Pages légales à jour | ✅ code | ✅ `/gestion-des-cookies` + `/donnees-personnelles` |

## Côté application (code)

Tout est concentré dans `packages/app/src/modules/analytics/` et `modules/legal/`.

- **Anonymisation des URLs suivies** — `MatomoAnalytics.tsx` passe `cleanUrl: true`
  à `trackAppRouter`. Matomo enregistre alors le **chemin sans query string** :
  une recherche libre, un callback OIDC ou un identifiant en paramètre ne peut
  donc pas fuiter dans l'URL de page. (La recherche entreprise part en `GET`
  vers le **site de consultation externe** — elle ne traverse jamais le Matomo
  EGAPRO.)
- **Do Not Track** — `MatomoAnalytics.tsx` pousse `['setDoNotTrack', true]` dans
  `onInitialization` (donc **avant** le premier hit) : un visiteur dont le
  navigateur émet DNT n'est pas suivi.
- **Heatmaps / session recording** — `['HeatmapSessionRecording::disable']` est
  poussé au même endroit, conformément au point 3e du guide CNIL (le plugin
  n'est de toute façon pas installé sur l'instance, c'est une ceinture +
  bretelles).
- **Opt-out** — `modules/legal/MatomoOptOut.tsx` embarque l'**iframe d'opt-out
  officielle** de Matomo (`?module=CoreAdminHome&action=optOut`), construite à
  partir de `NEXT_PUBLIC_MATOMO_URL`. Elle ne s'affiche pas si Matomo n'est pas
  configuré (local / preview sans variable).
- **Aucune PII dans la taxonomie** — garanti par construction : les `name`
  d'événements ne portent que des clés d'étape, des noms de facettes (jamais
  leurs valeurs) et des identifiants structurels ; les deux dimensions
  personnalisées ne contiennent que **l'année de campagne** et la **tranche
  d'effectif anonymisée**. Voir [`plan-de-tracking.md`](./plan-de-tracking.md).

## Côté instance Matomo (admin)

Ces réglages vivent **dans l'instance Matomo**, pas dans le dépôt. Ils doivent
être appliqués (et re-vérifiés) sur l'instance de production. Connecté en
**Super User**, dans **Administration** :

| Réglage | Chemin | Valeur attendue |
|---|---|---|
| Anonymisation IP | Vie privée → Anonymiser les données → « Rendre anonymes les adresses IP » | Activé, **2 octets** masqués |
| IP masquée pour la géoloc | même écran | **Oui** (confidentialité accrue) |
| Pseudonymisation User ID | même écran | Activé |
| Désactiver les exports | Système → Paramètres généraux → section *Live* | « Disable Visits log & Visitor Profile » coché |
| E-commerce | Éléments mesurables → Gérer → le site | « N'est pas un site d'e-commerce » |
| Cross-domain / cookies tiers | — | Non activés (défaut) |
| Do Not Track | Vie privée → Demandes des utilisateurs | Support DNT activé |
| Purge des logs bruts | Vie privée → Anonymiser les données → *Supprimer les anciens journaux* | Activé, **750 jours** (~25 mois) |
| Dimensions personnalisées | Éléments mesurables → Dimensions personnalisées | Slot **1** = `campaign_year`, slot **2** = `workforce_range` (portée *action*) |

> Les slots des dimensions personnalisées **doivent** correspondre à
> `MATOMO_CUSTOM_DIMENSION` dans `events.ts` (1 = année, 2 = tranche d'effectif) :
> un ID erroné fait silencieusement ignorer la dimension.

## Durées de conservation

- **Cookie de mesure d'audience** (`_pk_id`) : **13 mois** — valeur par défaut de
  Matomo, conforme. `_pk_ses` (session) : 30 minutes.
- **Données brutes** (logs de visites/actions) : purge automatique à **750
  jours** (~25 mois), sous le plafond CNIL.
- Les rapports **agrégés** (anonymes) peuvent être conservés au-delà : ils ne
  contiennent plus de donnée individuelle.

Ces durées sont reprises dans le tableau de la page `/gestion-des-cookies`.

## Pages légales & registre RGPD

- `/gestion-des-cookies` : décrit le paramétrage « exempté », liste les cookies
  et leurs durées, **embarque l'opt-out** et mentionne le respect du DNT.
- `/donnees-personnelles` : rappelle le régime de l'article 82 de la loi
  Informatique et Libertés et renvoie vers la gestion des cookies.
- **Registre RGPD** : la mesure d'audience exemptée reste un traitement — penser
  à l'inscrire au registre des traitements (action organisationnelle, hors code).

## Vérifier en local (docker compose)

Une instance Matomo jetable est fournie en **profil opt-in** dans
`docker-compose.yml` (services `matomo`, `matomo-db`, `matomo-init`). Elle ne
démarre pas avec le `docker compose up` habituel. Le service **`matomo-init`**
(`scripts/matomo-local/cnil-setup.py`) installe Matomo en mode headless puis
**applique automatiquement toute la configuration CNIL du tableau ci-dessus**
(anonymisation IP 2 octets, DNT, purge 750 j, désactivation des exports,
e-commerce off, dimensions slots 1 & 2). Le script est **idempotent** : un
nouveau `up` ré-affirme les réglages sans les dupliquer.

```bash
# 1. Démarrer + auto-configurer (matomo-db, matomo, puis matomo-init en one-shot)
docker compose --profile matomo up -d
docker compose logs -f matomo-init      # suivre l'install + la config CNIL

# 2. Pointer l'application sur l'instance locale (packages/app/.env) :
#    NEXT_PUBLIC_MATOMO_URL="http://localhost:8080"
#    NEXT_PUBLIC_MATOMO_SITE_ID="1"
#    puis `pnpm dev:app` et parcourir les funnels / déclencher les actions.

# 3. UI Matomo : http://localhost:8080  (admin / adminadmin12 — local uniquement)
#    Les events arrivent dans « Comportement → Événements ».

# Pour repartir d'un Matomo vierge :
#   docker compose --profile matomo down && docker volume rm egapro_matomodata egapro_matomodbdata
```

Pour rejouer **toute** la taxonomie d'un coup (sans parcourir l'UI), envoyer
chaque événement de [`plan-de-tracking.md`](./plan-de-tracking.md) directement
sur `http://localhost:8080/matomo.php` (`idsite=1&rec=1`,
`e_c`/`e_a`/`e_n`/`e_v`, `dimension1`/`dimension2`), puis relire l'agrégat via la
Reporting API (`Events.getCategory`).

> ⚠️ Le **journal des visites (Live)** est volontairement désactivé (étape 1 du
> guide CNIL). La vérification se fait donc sur les **rapports agrégés**
> (`Comportement → Événements`), pas sur le log par visite.

## Résultat de la vérification

Vérification réalisée sur une instance **Matomo 5.11** locale, montée et
**configurée automatiquement par `matomo-init`**, avec rejeu des hits de la
taxonomie (pages vues + 22 événements distincts) :

- 🔒 **IP anonymisée** : une IP de test `203.0.113.45` est stockée masquée en
  `203.0.0.0` (2 octets) — anonymisation effective.
- ✅ **Tous les événements reçus** : les 3 funnels (start / step / abandon /
  complete) **et** les 10 actions ponctuelles remontent avec la bonne
  `category` / `action` / `name` / `value` (21 couples `category/action` dans
  le rapport agrégé `Events.getCategory`).
- ✅ **URLs propres** : les pages vues n'enregistrent que le chemin, sans query
  string.
- ✅ **Dimensions non personnelles** : slot 1 = `2024`, slot 2 = `50-99` ;
  aucune PII dans les `name` d'événements.
- ✅ **DNT respecté** côté serveur (`doNotTrackEnabled = true`) et côté client
  (`setDoNotTrack(true)`).
- ✅ **Opt-out** : l'iframe `action=optOut` répond et propose la désinscription.

Conclusion : la configuration documentée tient les conditions d'exemption de
consentement de la CNIL. Reste à appliquer ces réglages sur l'instance de
production et à inscrire le traitement au registre RGPD.
