# Journaux générés et durées de conservation

> **Objet** : recenser les journaux (logs) produits par EGAPRO V2 et les données métier qui portent des données personnelles, avec leur durée de conservation.
> **Public** : équipe technique (sections 4 et 5, détaillées) et DPO (tableau de synthèse en section 2, lisible sans lire le code).
> **État des lieux au** : 2026-10-06, sur `alpha` au commit `59d70abae`.
>
> **Avertissement** : cette page décrit ce que le dépôt **configure** — le code, les scripts, les manifests de déploiement. Elle ne constitue pas la preuve que chaque traitement planifié tourne effectivement en production ; cette supervision relève de [#2710](https://github.com/SocialGouv/egapro/issues/2710).

## Sommaire

1. [Objet et périmètre](#1-objet-et-périmètre)
2. [Tableau de synthèse pour le DPO](#2-tableau-de-synthèse-pour-le-dpo)
   - [2.1 Journaux](#21-journaux)
   - [2.2 Données métier](#22-données-métier)
3. [Vocabulaire de statut](#3-vocabulaire-de-statut)
4. [Journaux](#4-journaux)
   - [4.1 Journal d'audit des actions](#41-journal-daudit-des-actions)
   - [4.2 Ligne d'activité applicative](#42-ligne-dactivité-applicative)
   - [4.3 Logs applicatifs stdout et stderr](#43-logs-applicatifs-stdout-et-stderr)
   - [4.4 Sentry (erreurs, traces et sessions enregistrées)](#44-sentry-erreurs-traces-et-sessions-enregistrées)
   - [4.5 File de notification par e-mail](#45-file-de-notification-par-e-mail)
   - [4.6 Journal de dédoublonnage des relances](#46-journal-de-dédoublonnage-des-relances)
   - [4.7 Historique des statuts de déclaration](#47-historique-des-statuts-de-déclaration)
   - [4.8 Journal d'impersonation admin](#48-journal-dimpersonation-admin)
   - [4.9 Matomo](#49-matomo)
   - [4.10 Logs de la passerelle API SUIT](#410-logs-de-la-passerelle-api-suit)
   - [4.11 Historique des CronJobs](#411-historique-des-cronjobs)
   - [4.12 Compteurs de limitation de débit de l'API publique](#412-compteurs-de-limitation-de-débit-de-lapi-publique)
   - [4.13 Plateforme et tiers non couverts par le dépôt](#413-plateforme-et-tiers-non-couverts-par-le-dépôt)
5. [Données métier](#5-données-métier)
   - [5.1 Déclarations de rémunération et données rattachées](#51-déclarations-de-rémunération-et-données-rattachées)
   - [5.2 Représentation équilibrée](#52-représentation-équilibrée)
   - [5.3 Comptes utilisateurs](#53-comptes-utilisateurs)
   - [5.4 Cookies](#54-cookies)
6. [Durées non définies dans le dépôt](#6-durées-non-définies-dans-le-dépôt)
7. [Écarts constatés](#7-écarts-constatés)
8. [Évolutions en cours](#8-évolutions-en-cours)
9. [Liens](#9-liens)

## 1. Objet et périmètre

L'information sur les journaux et les durées de conservation est aujourd'hui dispersée entre [`architecture.md` §9](architecture.md#9-audit-logging), [`features.md` §13.2](features.md#132-audit-logging) et §13.8, [`.claude/rules/audit-logging.md`](../.claude/rules/audit-logging.md), [`matomo-cnil-exemption.md`](matomo-cnil-exemption.md), [`mails.md`](mails.md) et les pages publiques `/donnees-personnelles` et `/gestion-des-cookies`. Cette page les rassemble et comble les durées qui n'étaient écrites nulle part.

**Méthode** : chaque durée est lue là où elle s'applique — le script, le cron, la librairie — jamais recopiée d'une documentation existante. Une durée absente du dépôt (code, manifests `.kontinuous/`, page de doc existante) est notée « Non définie dans le dépôt » avec l'interlocuteur à solliciter, jamais inventée.

## 2. Tableau de synthèse pour le DPO

Le vocabulaire de la colonne **Statut** est défini en [section 3](#3-vocabulaire-de-statut). Les chemins de code sont donnés dans les sections détaillées (4 et 5), jamais ici.

### 2.1 Journaux

| Élément | Finalité | Données personnelles | Durée | Statut | Détail |
|---|---|---|---|---|---|
| Journal d'audit des actions | Traçabilité CNIL/DGT des mutations et lectures sensibles | Identifiant et e-mail de l'utilisateur, SIREN, adresse IP complète, agent utilisateur, métadonnées, message d'erreur | 180 j (lectures sensibles et recherche publique) ou 365 j (le reste) | Appliquée par le code | [4.1](#41-journal-daudit-des-actions) |
| Ligne d'activité applicative | Diagnostic opérationnel, collectée par la plateforme d'hébergement | Identifiant utilisateur, SIREN, IP tronquée | Non définie dans le dépôt | Non définie dans le dépôt | [4.2](#42-ligne-dactivité-applicative) |
| Logs applicatifs stdout/stderr | Diagnostic d'erreur | Messages et traces d'erreur ; e-mail du destinataire si l'envoi réel est désactivé | Non définie dans le dépôt | Non définie dans le dépôt | [4.3](#43-logs-applicatifs-stdout-et-stderr) |
| Sentry (erreurs, traces, sessions) | Diagnostic d'erreur, rejeu de session | Contexte des erreurs, sessions enregistrées | Non définie dans le dépôt | Non définie dans le dépôt | [4.4](#44-sentry-erreurs-traces-et-sessions-enregistrées) |
| File de notification par e-mail | Fiabiliser l'envoi des e-mails transactionnels | E-mail du destinataire, identifiant utilisateur, SIREN, contenu du message, pièces jointes | 14 j (jobs non traités), 7 j après traitement | Appliquée par le code | [4.5](#45-file-de-notification-par-e-mail) |
| Journal de dédoublonnage des relances | Éviter une relance envoyée deux fois | Aucune (type, SIREN, année, variante) | Illimitée de fait | Aucune purge | [4.6](#46-journal-de-dédoublonnage-des-relances) |
| Historique des statuts de déclaration | Traçabilité du parcours de déclaration | Identifiant de l'auteur de l'action | Suit la déclaration (6 ans) | Prévue, non exécutée | [4.7](#47-historique-des-statuts-de-déclaration) |
| Journal d'impersonation admin | Traçabilité des connexions « en tant que » une entreprise | Identifiant de l'admin, SIREN | Illimitée de fait | Aucune purge | [4.8](#48-journal-dimpersonation-admin) |
| Matomo | Mesure d'audience exemptée CNIL | Logs de visite (IP anonymisée), cookie de mesure d'audience | 750 j (logs), 13 mois (cookie) | Paramétrée hors dépôt | [4.9](#49-matomo) |
| Logs de la passerelle API SUIT | Sécurité et diagnostic de l'accès API | IP du client, requêtes | Non définie dans le dépôt | Non définie dans le dépôt | [4.10](#410-logs-de-la-passerelle-api-suit) |
| Historique des CronJobs | Diagnostic d'exécution des traitements planifiés | Logs des scripts exécutés | 3 exécutions réussies et 3 en échec, par CronJob | Appliquée par le code | [4.11](#411-historique-des-cronjobs) |
| Compteurs de limitation de débit (API publique) | Protection anti-abus | Empreinte de l'IP ou du jeton d'API | 60 s | Appliquée par le code | [4.12](#412-compteurs-de-limitation-de-débit-de-lapi-publique) |
| Plateforme et tiers (ingress, logs PostgreSQL, sauvegardes, SMTP, ProConnect) | Exploitation de la plateforme | Variable selon le composant | Non définie dans le dépôt | Non définie dans le dépôt | [4.13](#413-plateforme-et-tiers-non-couverts-par-le-dépôt) |

### 2.2 Données métier

| Élément | Finalité | Données personnelles | Durée | Statut | Détail |
|---|---|---|---|---|---|
| Déclarations de rémunération et données rattachées | Obligation légale de déclaration de l'index | Identifiant du déclarant, avis CSE et évaluation conjointe (PDF) | 6 ans | Prévue, non exécutée | [5.1](#51-déclarations-de-rémunération-et-données-rattachées) |
| Représentation équilibrée | Obligation légale de déclaration | Identifiant du déclarant ; pour la reprise V1, coordonnées du déclarant historique | Illimitée de fait | Aucune purge | [5.2](#52-représentation-équilibrée) |
| Comptes utilisateurs | Gestion des accès à la plateforme | Prénom, nom, e-mail, téléphone | 2 ans après la dernière déclaration ou l'inactivité du compte (annoncé) | Annoncée, non appliquée | [5.3](#53-comptes-utilisateurs) |
| Cookies | Authentification, préférence d'affichage, mesure d'audience | — | 1 an à 13 mois selon le cookie, 30 min pour le cookie de session Matomo | Appliquée par le code (cookies techniques) ; Paramétrée hors dépôt (cookies Matomo) | [5.4](#54-cookies) |

## 3. Vocabulaire de statut

Cette page n'utilise que les six valeurs suivantes dans la colonne Statut, et aucune autre :

| Statut | Sens |
|---|---|
| Appliquée par le code | Une purge ou une expiration existe dans le dépôt et part avec l'image déployée |
| Prévue, non exécutée | Le code existe mais ne tourne pas |
| Paramétrée hors dépôt | Réglage d'un outil tiers, documenté dans le dépôt |
| Aucune purge | Rien ne supprime ces données |
| Annoncée, non appliquée | Durée promise publiquement, sans mécanisme qui l'applique |
| Non définie dans le dépôt | Relève de la plateforme d'hébergement ou d'un tiers, pas du code applicatif |

Dans la colonne Durée, « Illimitée de fait » accompagne le statut « Aucune purge » : aucune durée n'a été fixée et rien ne supprime ces données.

## 4. Journaux

### 4.1 Journal d'audit des actions

Table Postgres `audit.action_log`, schéma dédié `audit` (pas de clé étrangère vers les tables applicatives, pour ne jamais bloquer une suppression RGPD d'utilisateur). Colonnes actuelles sur `alpha` : identifiant et e-mail de l'utilisateur, SIREN, action, catégorie, statut, type et identifiant de la ressource visée, message d'erreur (tronqué à 500 caractères), métadonnées JSON, adresse IP complète, agent utilisateur, durée de traitement.

**Trois points d'écriture** : l'application (`src/server/audit/log.ts`), le worker de notifications (`packages/notifications/src/worker/auditLog.ts`, qui enregistre l'e-mail du destinataire) et l'auto-audit de la purge quotidienne elle-même (`packages/app/scripts/audit-cleanup.ts`).

**Durée** : 180 jours pour les catégories `read_sensitive` et `public_search` (lectures à fort volume contenant une IP), 365 jours pour les autres. Un CronJob quotidien (`audit-cleanup-daily`, 04:00 UTC) supprime les lignes expirées par une requête SQL directe. Les deux seuils sont surchargeables par les variables d'environnement `EGAPRO_AUDIT_RETENTION_SHORT_DAYS` et `EGAPRO_AUDIT_RETENTION_LONG_DAYS` — des ConfigMaps optionnelles (`audit-retention`) permettraient de les fixer, mais aucune n'est définie dans le dépôt : ce sont donc les valeurs par défaut (180 / 365) qui s'appliquent.

| Catégorie | Durée |
|---|---|
| `read_sensitive` | 180 jours |
| `public_search` | 180 jours |
| `auth` | 365 jours |
| `mutation` | 365 jours |
| `export` | 365 jours |
| `system` | 365 jours |

Ne sont pas recopiées ici : les 89 clés d'action ni le détail par catégorie au-delà du tableau catégorie → durée ci-dessus. Voir `packages/app/src/modules/audit/shared/actionKeys.ts` et [`.claude/rules/audit-logging.md`](../.claude/rules/audit-logging.md) pour l'inventaire complet.

**Sources** : `packages/app/scripts/audit-cleanup.ts` · `.kontinuous/templates/audit-cleanup-cron.yaml` · `packages/app/src/server/db/auditSchema.ts` · `packages/app/src/server/audit/log.ts` · `packages/notifications/src/worker/auditLog.ts`.

> **Cette section décrit `log.ts` tel qu'il est sur `alpha`** au moment de l'implémentation de cette page. Voir [section 8](#8-évolutions-en-cours) : une PR en cours change ce contenu.

### 4.2 Ligne d'activité applicative

En miroir de la table ci-dessus (jamais en remplacement), chaque appel applicatif (tRPC ou route) émet une ligne JSON sur la sortie standard : type d'événement, action, catégorie, route, statut, code d'erreur, durée, identifiant utilisateur, SIREN, IP tronquée (les deux derniers octets masqués en IPv4, seuls les trois premiers groupes conservés en IPv6, soit un préfixe /48), et les **noms** (jamais les valeurs) des champs d'entrée. Cette ligne est collectée par la plateforme d'hébergement, en dehors du dépôt.

**Durée** : non définie dans le dépôt — c'est la plateforme d'hébergement qui fixe la durée de rétention de ses journaux collectés.

**Sources** : `packages/app/src/server/audit/activityLog.ts`.

### 4.3 Logs applicatifs stdout et stderr

Messages et traces d'erreur de l'application et du worker de notifications, écrits sur la sortie standard et d'erreur. Si l'envoi réel d'e-mail est désactivé (variable d'environnement `MAIL_ENABLED=false`, utilisée en développement et en préproduction), le worker trace l'e-mail du destinataire qui aurait reçu le message.

**Durée** : non définie dans le dépôt — relève de la plateforme d'hébergement.

**Sources** : `packages/notifications/src/worker/jobHandler.ts`.

### 4.4 Sentry (erreurs, traces et sessions enregistrées)

Sentry capture les erreurs non gérées côté serveur et côté client, avec 100 % des traces échantillonnées. Côté client, l'enregistrement de session (Session Replay) est actif sur 10 % des sessions, et 100 % des sessions qui rencontrent une erreur.

**Durée** : non définie dans le dépôt — c'est un réglage de l'instance Sentry de l'équipe, pas du code applicatif.

**Sources** : `packages/app/src/sentry.server.config.ts` · `packages/app/src/sentry.edge.config.ts` · `packages/app/src/instrumentation-client.ts`.

### 4.5 File de notification par e-mail

File `pg-boss` nommée `email-notification` : chaque e-mail transactionnel (confirmation de déclaration, rappel, avis CSE…) y transite sous forme de job, avec l'e-mail du destinataire, l'identifiant utilisateur, le SIREN, le contenu du message et les pièces jointes encodées.

**Durée** : valeurs par défaut de la librairie `pg-boss` (version 12.18), jamais surchargées dans le code applicatif — un job traité est supprimé 7 jours après son traitement ; un job qui n'a jamais été traité expire 14 jours après sa création.

**Sources** : `packages/notifications/src/queue.ts` · `packages/notifications/src/publisher.ts` · `packages/notifications/src/index.ts`.

### 4.6 Journal de dédoublonnage des relances

Table `notifications.reminder_sent_log` : évite d'envoyer deux fois la même relance (identité : type, SIREN, année, variante). Aucune donnée nominative.

**Durée** : aucun mécanisme de suppression dans le dépôt.

**Sources** : `packages/notifications/src/eligibility/dedup.ts`.

### 4.7 Historique des statuts de déclaration

Table `app_declaration_status_history` : chaque changement de statut d'une déclaration, avec l'identifiant de l'auteur de l'action et la date.

**Durée** : liée au cycle de vie de la déclaration à laquelle elle se rattache (suppression en cascade). La durée de vie d'une déclaration est de 6 ans — voir [5.1](#51-déclarations-de-rémunération-et-données-rattachées) — mais ce mécanisme n'est pas exécuté en production : voir le même statut.

**Sources** : `packages/app/src/server/db/schema.ts`.

### 4.8 Journal d'impersonation admin

Table `app_admin_impersonation_event` : trace chaque session où un administrateur se connecte « en tant que » une entreprise (identifiant de l'admin, SIREN, début et fin de session).

**Durée** : aucun mécanisme de suppression dans le dépôt.

**Sources** : `packages/app/src/server/db/schema.ts` · `packages/app/src/server/auth/config.ts`.

### 4.9 Matomo

Solution de mesure d'audience, paramétrée en mode « exempté » conformément aux recommandations CNIL (anonymisation IP sur 2 octets, pas d'export des visites nominatives, Do Not Track respecté).

**Durée** : purge automatique des logs bruts de visite à 750 jours (~25 mois, sous le plafond CNIL) ; cookie de mesure d'audience `_pk_id` : 13 mois. Ces deux valeurs sont un réglage de l'instance Matomo, documenté dans le dépôt mais appliqué hors de lui.

**Sources** : [`matomo-cnil-exemption.md`](matomo-cnil-exemption.md).

### 4.10 Logs de la passerelle API SUIT

La passerelle APISIX qui protège l'API privée consommée par SUIT (système d'information de l'inspection du travail) écrit ses propres logs d'accès (IP du client, requêtes) sur un volume qui ne survit pas au-delà du pod qui l'a écrit.

**Durée** : non définie dans le dépôt — aucun mécanisme de purge ou de rotation n'y est configuré. Le volume étant éphémère, les logs disparaissent a priori avec le pod (à confirmer auprès de l'équipe d'exploitation).

**Sources** : `.kontinuous/templates/apisix-suit.yaml`.

### 4.11 Historique des CronJobs

Kubernetes conserve l'historique des exécutions de chaque CronJob de maintenance (purge d'audit, purge des déclarations, import GIP-MDS, génération d'exports, actualisation data.gouv) : les 3 dernières exécutions réussies et les 3 dernières en échec, par CronJob.

**Sources** : `successfulJobsHistoryLimit` / `failedJobsHistoryLimit` dans `.kontinuous/templates/audit-cleanup-cron.yaml`, `declaration-cleanup-cron.yaml`, `export-cron.yaml`, `gip-mds-import-cron.yaml`, `data-gouv-cron.yaml`.

### 4.12 Compteurs de limitation de débit de l'API publique

Compteur en mémoire ou dans un cache partagé, par IP ou par jeton d'API (sous forme d'empreinte, jamais la valeur en clair), pour limiter le nombre d'appels par minute à l'API publique.

**Durée** : 60 secondes (fenêtre fixe d'une minute), appliquée par le code.

**Sources** : `packages/app/src/server/services/publicApiRateLimit.ts`.

### 4.13 Plateforme et tiers non couverts par le dépôt

Rien dans `.kontinuous/` ne configure explicitement : les logs d'ingress, les logs du serveur PostgreSQL, les **sauvegardes PostgreSQL** (combien de temps une donnée purgée reste-t-elle restaurable depuis une sauvegarde ?), le fournisseur SMTP, ProConnect.

**Durée** : non définie dans le dépôt pour chacun de ces éléments. Voir [section 6](#6-durées-non-définies-dans-le-dépôt) pour l'interlocuteur à solliciter.

## 5. Données métier

### 5.1 Déclarations de rémunération et données rattachées

Couvre la déclaration elle-même, les catégories d'emploi et de salariés, les avis CSE (dont les fichiers PDF stockés sur S3), l'historique des statuts et les verrous collaboratifs.

**Durée annoncée** : 6 ans — une déclaration est éligible à la purge si son année est strictement inférieure à l'année courante moins 6 (variable d'environnement `EGAPRO_DECLARATION_RETENTION_YEARS`, valeur par défaut 6). Une ConfigMap optionnelle (`declaration-retention`) permettrait de la surcharger, mais aucune n'est définie dans le dépôt : c'est donc la valeur par défaut (6 ans) qui s'applique.

**Statut : Prévue, non exécutée.** Le CronJob quotidien `declaration-cleanup-daily` est configuré et son script (`packages/app/scripts/declaration-cleanup.ts`) est fonctionnel, mais le fichier compilé qu'il invoque n'est pas copié dans l'image de production — le CronJob ne trouve donc jamais le script qu'il doit exécuter. [#2710](https://github.com/SocialGouv/egapro/issues/2710) constate l'effet (absence de preuve d'exécution) ; [#4773](https://github.com/SocialGouv/egapro/issues/4773) corrige la cause.

**Sources** : `packages/app/scripts/declaration-cleanup.ts` · `.kontinuous/templates/declaration-cleanup-cron.yaml` · `packages/app/Dockerfile`.

### 5.2 Représentation équilibrée

Table `app_representation_declaration`. Pour les lignes reprises depuis la V1, un champ dédié porte les coordonnées du déclarant historique (e-mail, nom, prénom, téléphone) — une donnée que la V2 ne demande plus pour ses propres déclarations.

**Statut : Aucune purge.** Rien dans le dépôt ne supprime ces lignes. [#4502](https://github.com/SocialGouv/egapro/issues/4502) prévoit d'inclure la représentation équilibrée dans la purge à 6 ans.

**Sources** : `packages/app/src/server/db/schema.ts` · `packages/app/scripts/import-v1-representation-mapping.ts`.

### 5.3 Comptes utilisateurs

Table `app_user` (prénom, nom, e-mail, téléphone) et ses rattachements à une entreprise (`app_user_company`).

**Engagement public**, cité mot pour mot depuis la page `/donnees-personnelles` :

> « À compter de la suppression par l'utilisateur ou 2 ans à compter de la dernière déclaration ou de l'inactivité du compte »

**Statut : Annoncée, non appliquée.** Aucune purge, aucune suppression de compte à l'initiative de l'utilisateur, et aucune colonne ne trace la date de dernière activité du compte — la durée promise n'a donc aucune donnée à partir de laquelle se calculer. [#4770](https://github.com/SocialGouv/egapro/issues/4770) propose de faire correspondre le code à cet engagement.

**Sources** : `packages/app/src/modules/legal/PrivacyPolicyPage/PrivacyRightsAndData.tsx` · `packages/app/src/server/db/schema.ts`.

### 5.4 Cookies

Reprend `packages/app/src/modules/legal/CookiesPage.tsx`, qui alimente la page publique `/gestion-des-cookies` et reste la source de référence.

| Cookie | Finalité | Durée |
|---|---|---|
| `fr-theme` | Préférence de thème d'affichage | 1 an |
| `next-auth.session-token` | Authentification de l'utilisateur | 30 jours (égal au `maxAge` de la session) |
| `_pk_id` | Identifiant de mesure d'audience Matomo | 13 mois |
| `_pk_ses` | Session de mesure d'audience Matomo | 30 minutes |
| Cookie d'opposition Matomo | Mémorise le refus de la mesure d'audience | Non définie dans le dépôt — posé par l'iframe officielle Matomo, dont la configuration de durée n'est pas dans ce dépôt |

**Statut** : Appliquée par le code pour les deux cookies techniques (`fr-theme`, `next-auth.session-token`) ; Paramétrée hors dépôt pour les cookies Matomo.

**Sources** : `packages/app/src/modules/legal/CookiesPage.tsx` · `packages/app/src/modules/legal/MatomoOptOut.tsx` · `packages/app/src/server/auth/config.ts`.

## 6. Durées non définies dans le dépôt

| Élément | Interlocuteur à solliciter |
|---|---|
| Ligne d'activité applicative collectée par la plateforme | Équipe d'exploitation de la plateforme |
| Logs applicatifs stdout/stderr | Équipe d'exploitation de la plateforme |
| Sentry (erreurs, traces, sessions enregistrées) | Administrateurs de l'instance Sentry de l'équipe |
| Logs de la passerelle API SUIT | Équipe d'exploitation de la plateforme |
| Ingress, logs PostgreSQL, sauvegardes PostgreSQL | Équipe d'exploitation de la plateforme |
| Fournisseur SMTP | Équipe d'exploitation de la plateforme, qui porte le contrat avec le fournisseur SMTP |
| ProConnect | DINUM (opérateur de ProConnect) |
| Cookie d'opposition Matomo | Équipe d'exploitation de la plateforme (configuration de l'instance Matomo) |

## 7. Écarts constatés

Reportés tels quels, sans les atténuer :

1. **Comptes utilisateurs** : l'engagement public de 2 ans n'est appliqué par aucun mécanisme. Suite : [#4770](https://github.com/SocialGouv/egapro/issues/4770).
2. **Purge des déclarations** : le script existe mais n'est pas embarqué dans l'image de production, donc jamais exécuté. Suite : [#4773](https://github.com/SocialGouv/egapro/issues/4773).
3. **Représentation équilibrée** : aucune purge, alors que des lignes reprises de la V1 contiennent des coordonnées personnelles. Suite : [#4502](https://github.com/SocialGouv/egapro/issues/4502).
4. **Tables jamais purgées** : le journal d'impersonation admin et le journal de dédoublonnage des relances n'ont aucun mécanisme de suppression. Suites : [#4768](https://github.com/SocialGouv/egapro/issues/4768) et [#4769](https://github.com/SocialGouv/egapro/issues/4769).
5. **Durées d'audit écrites deux fois** : une fois dans les constantes du module (lues uniquement par les tests), une fois en dur dans le script de purge qui les applique réellement. Suite : [#4771](https://github.com/SocialGouv/egapro/issues/4771).
6. **Sentry** : l'enregistrement de session et l'échantillonnage à 100 % des traces ne sont mentionnés ni dans la page `/donnees-personnelles` ni dans `/gestion-des-cookies`. Suites : [#4772](https://github.com/SocialGouv/egapro/issues/4772) et [#3669](https://github.com/SocialGouv/egapro/issues/3669).

## 8. Évolutions en cours

Tickets ouverts qui changeront une ligne de cette page :

| Ticket | Portée |
|---|---|
| [#3706](https://github.com/SocialGouv/egapro/issues/3706) / PR [#4680](https://github.com/SocialGouv/egapro/pull/4680) | Minimise le journal d'audit : suppression de l'e-mail et de l'agent utilisateur, IP tronquée, code d'erreur à la place du message brut, `metadata` limité à une liste autorisée. Tant que cette PR n'est pas fusionnée, [4.1](#41-journal-daudit-des-actions) décrit le contenu actuel. |
| [#4502](https://github.com/SocialGouv/egapro/issues/4502) | Purge de la représentation équilibrée après 6 ans |
| [#4549](https://github.com/SocialGouv/egapro/issues/4549) | Journalisation des erreurs internes tRPC hors développement |
| [#3669](https://github.com/SocialGouv/egapro/issues/3669) | Nouvelle politique de confidentialité |
| [#2710](https://github.com/SocialGouv/egapro/issues/2710) | Supervision des traitements planifiés |
| [#4768](https://github.com/SocialGouv/egapro/issues/4768) | Purge du journal d'impersonation admin |
| [#4769](https://github.com/SocialGouv/egapro/issues/4769) | Purge du journal de dédoublonnage des relances |
| [#4770](https://github.com/SocialGouv/egapro/issues/4770) | Appliquer aux comptes utilisateurs la durée annoncée |
| [#4771](https://github.com/SocialGouv/egapro/issues/4771) | Une seule source pour les durées de conservation du journal d'audit |
| [#4772](https://github.com/SocialGouv/egapro/issues/4772) | Sentry : réglage de l'enregistrement de session et de l'échantillonnage |
| [#4773](https://github.com/SocialGouv/egapro/issues/4773) | Embarquer le script de purge des déclarations dans l'image de production |

**Qui met cette page à jour** : si cette page est fusionnée avant la PR #4680, c'est cette dernière qui met à jour la [section 4.1](#41-journal-daudit-des-actions) — un commentaire le demande sur [#3706](https://github.com/SocialGouv/egapro/issues/3706). Si #4680 est fusionnée en premier, cette page a été écrite directement avec le contenu minimisé. Ensuite, la règle ajoutée dans [`.claude/rules/audit-logging.md`](../.claude/rules/audit-logging.md) couvre toutes les modifications suivantes.

## 9. Liens

- **Détail technique du journal d'audit** : [`architecture.md` §9](architecture.md#9-audit-logging) et [`features.md` §13.2](features.md#132-audit-logging)
- **Détail technique de la purge des déclarations** : [`architecture.md` §9.6](architecture.md#96-traitements-planifiés-crons-de-maintenance-des-données) et [`features.md` §13.8](features.md#138-purge-rgpd-des-déclarations)
- **Règle de maintenance du journal d'audit** : [`.claude/rules/audit-logging.md`](../.claude/rules/audit-logging.md)
- **Matomo et exemption CNIL** : [`matomo-cnil-exemption.md`](matomo-cnil-exemption.md)
- **Mails transactionnels** : [`mails.md`](mails.md)
- **Pages publiques** : `/donnees-personnelles`, `/gestion-des-cookies`
- **Supervision des traitements planifiés** : [#2710](https://github.com/SocialGouv/egapro/issues/2710)
