# Features EGAPRO V2

Vue d'ensemble synthétique des fonctionnalités de la plateforme EGAPRO V2.

Audience : nouveaux développeurs (onboarding) et équipe métier / PO (référence rapide).

> Pour les règles juridiques de fond (loi, décrets, calendriers d'entrée en vigueur), voir le [README racine](../README.md) et le [wiki Spec V2](https://github.com/SocialGouv/egapro/wiki/Spec-V2). Ce document décrit ce que **fait l'application**, pas ce que **prescrit la loi**.

## Sommaire

1. [Authentification & gestion du compte](#1-authentification--gestion-du-compte)
2. [Déclaration de l'index égalité](#2-déclaration-de-lindex-égalité)
3. [Avis du CSE](#3-avis-du-cse)
4. [Parcours de conformité (seconde déclaration)](#4-parcours-de-conformité-seconde-déclaration)
5. [Recherche et consultation publique](#5-recherche-et-consultation-publique)
6. [Référents régionaux](#6-référents-régionaux)
7. [Aide, FAQ, contact](#7-aide-faq-contact)
8. [Pages légales et sitemap](#8-pages-légales-et-sitemap)
9. [PDF et exports](#9-pdf-et-exports)
10. [Espace administrateur (DGT)](#10-espace-administrateur-dgt)
11. [Mécanismes transverses](#11-mécanismes-transverses)
12. [Annexe : tables Drizzle principales](#12-annexe--tables-drizzle-principales)

Conventions de notation :

- **Route** : chemin URL exposé par Next.js (`src/app/...`)
- **Module** : feature module (`src/modules/<nom>/`)
- **Router tRPC** : procédures back exposées (`src/server/api/routers/<nom>.ts`)
- Les chemins commençant par `~/` correspondent à `packages/app/src/`

---

## 1. Authentification & gestion du compte

**Pour qui** : tout employeur déclarant qui se connecte à la plateforme.

**À quoi ça sert** : créer une session utilisateur via **ProConnect** (le SSO de l'État), retrouver les entreprises rattachées au compte, compléter son profil (téléphone obligatoire au premier accès).

**Routes** :

- `/login` — page d'entrée, redirige vers ProConnect ou vers `/mon-espace` si déjà connecté
- `/mon-espace` — espace personnel, liste les entreprises de l'utilisateur
- `/mon-espace/mes-entreprises` — détail des entreprises, statut de leurs déclarations

**Modules** : `~/modules/login`, `~/modules/auth`, `~/modules/profile`, `~/modules/my-space`.

**Router tRPC** :

- `profile.get` — lecture du profil (audit `read_sensitive`)
- `profile.updatePhone` — mise à jour du téléphone (modal au premier accès)
- `company.get` / `company.list` — détails et liste des entreprises rattachées (avec statut CSE et déclarations)

**Règles métier-clés** :

- L'authentification utilise **NextAuth + ProConnect**. Le callback JWT injecte le contexte d'impersonation admin si présent (voir §10).
- Le **téléphone est requis** : si la table `profile` n'a pas de ligne pour l'utilisateur, une modale s'ouvre automatiquement à l'accès `/mon-espace`.
- Les entreprises sont rattachées via la table `userCompanies` (relation N-N entre `users` et `companies`).
- En environnement local, le fournisseur de test ProConnect est **FIA1V2** (compte `test@fia1.fr`).

---

## 2. Déclaration de l'index égalité

**Pour qui** : employeur déclarant pour son entreprise (≥ 50 salariés en règle générale, volontaire pour < 50).

**À quoi ça sert** : déclarer chaque année les **7 indicateurs** d'égalité femmes-hommes (A à G). Les indicateurs A–F sont **pré-calculés par le GIP-MDS** à partir des DSN ; l'indicateur G (écart par catégorie d'emploi, optionnel) est **saisi par l'entreprise**.

**Route principale** : `/declaration-remuneration/`, organisé en wizard multi-étapes.

| Étape | URL | Contenu |
|---|---|---|
| 1 | `/declaration-remuneration/etape/1` | Effectifs (femmes / hommes) |
| 2 | `/declaration-remuneration/etape/2` | Indicateurs A et C — écart de rémunération annuel et horaire |
| 3 | `/declaration-remuneration/etape/3` | Indicateurs B, D, E — écart sur la rémunération variable + promotions |
| 4 | `/declaration-remuneration/etape/4` | Quartiles (4 × 2 : annuel + horaire) — répartition des effectifs par tranche de salaire |
| 5 | `/declaration-remuneration/etape/5` | Catégories de salariés (indicateur G, optionnel) |
| 6 | `/declaration-remuneration/etape/6` | Récapitulatif et soumission |
| — | `/declaration-remuneration/recapitulatif/` | Vue lecture seule de la déclaration soumise |

**Modules** : `~/modules/declaration-remuneration` (wizard, steps, recap), `~/modules/domain` (calculs et règles).

**Router tRPC** : `~/server/api/routers/declaration.ts`. Procédures principales :

- `declaration.getOrCreate` — création paresseuse du brouillon (seulement si l'utilisateur est propriétaire ; en mode admin impersonation, un placeholder transient est renvoyé sans écriture)
- `declaration.updateStep1` … `updateStep4` — sauvegarde par étape (audit `mutation`, une action par étape)
- `declaration.updateEmployeeCategories` — sauvegarde de l'indicateur G
- `declaration.submit` — bascule `status = submitted`, fixe `submittedAt`

**Règles métier-clés** :

- L'**année de campagne** = année calendaire suivant l'année des données : `getCurrentYear()` retourne 2025 quand les données sont celles de 2024 (voir `~/modules/domain`).
- Le **calcul des écarts** est centralisé dans `computeGap(womenPay, menPay)` (positif si les hommes gagnent plus, négatif sinon).
- **Seuil d'alerte** : `GAP_ALERT_THRESHOLD = 5%`. Au-delà, une **seconde déclaration** est obligatoire pour les entreprises ≥ 100 salariés (voir §4).
- L'**indicateur G** est optionnel ; quand il est renseigné, l'entreprise définit ses propres catégories d'emploi (par accord ou décision unilatérale).
- Une fois `submitted`, la déclaration peut être modifiée jusqu'à la **deadline `decl1ModificationDeadline`** (configurée par l'admin DGT, voir §10) ; après, elle bascule en lecture seule.
- En **admin impersonation**, l'écriture est bloquée (procédures `companyWriteProcedure` rejettent ; voir `~/modules/auth/useReadOnlyGuard`).

**Données persistées** : `declarations`, `jobCategories`, `employeeCategories`.

---

## 3. Avis du CSE

**Pour qui** : entreprises **≥ 100 salariés** (l'avis CSE est obligatoire à partir de ce seuil ; il est interdit en dessous).

**À quoi ça sert** : recueillir l'**avis formel du Comité Social et Économique** sur la déclaration et sur les écarts constatés, avec dépôt du PV au format PDF.

**Routes** :

- `/avis-cse/etape/1` — saisie des avis (favorable / défavorable + dates)
- `/avis-cse/etape/2` — upload des PDF
- `/avis-cse/confirmation` — confirmation après finalisation

**Modules** : `~/modules/cseOpinion`.

**Router tRPC** : `~/server/api/routers/cseOpinion.ts`. Procédures :

- `cseOpinion.get` — lecture des avis enregistrés
- `cseOpinion.saveOpinions` — sauvegarde du formulaire (delete + insert)
- `cseOpinion.uploadFile` / `deleteFile` — gestion S3 des PDF
- `cseOpinion.finalize` — clôt l'avis (`cseStatus = submitted`)

**Règles métier-clés** :

- Disponible **uniquement si `isCseRequired(workforce)` est vrai** (≥ 100 salariés, voir `~/modules/domain/shared/companySize.ts`).
- Deux types d'avis par déclaration :
  - **Avis sur l'exactitude** des données (favorable / défavorable, date)
  - **Avis sur les écarts** (favorable / défavorable, date) — peut être marqué `gapConsulted = false` si non requis
- Le formulaire couvre la **première et la seconde déclaration** (champ `declarationNumber: 1 | 2`).
- **Limite** : `MAX_CSE_FILES = 4` PDF par année (un seul format accepté, vérifié côté serveur).
- Stockage S3 segmenté par siren et année.
- Audit : `CSE_OPINION_SAVE`, `CSE_OPINION_UPLOAD_FILE`, `CSE_OPINION_DELETE_FILE`, `CSE_OPINION_FINALIZE`.

**Données persistées** : `cseOpinions`, `files` (`type = cse_opinion`).

---

## 4. Parcours de conformité (seconde déclaration)

**Pour qui** : entreprises ≥ 100 salariés dont l'**écart initial dépasse 5%**.

**À quoi ça sert** : matérialiser la **mise en conformité** : seconde déclaration sous 6 mois, plus le dépôt d'un éventuel document d'**évaluation conjointe** (PDF de gouvernance).

**Routes** :

- `/declaration-remuneration/parcours-conformite/etape/[1..4]` — wizard seconde déclaration (mêmes étapes que la déclaration initiale)
- `/declaration-remuneration/parcours-conformite/evaluation-conjointe` — upload du PDF d'évaluation conjointe
- `/declaration-remuneration/parcours-conformite/confirmation` — confirmation finale

**Modules** : `~/modules/declaration-remuneration/steps/compliancePath`.

**Routers tRPC** :

- `declaration.saveCompliancePath` — sauvegarde le chemin de conformité choisi (enum `COMPLIANCE_PATHS`)
- `declaration.completeCompliancePath` / `submitSecond` — clôture la seconde déclaration
- `jointEvaluation.getFile` — récupère le PDF d'évaluation conjointe (s'il existe)

**Règles métier-clés** :

- Accessible **après** que la première déclaration est `submitted` ET que l'écart calculé est **≥ 5%**.
- La seconde déclaration porte sur une **période de référence flexible** entre la date de première déclaration et le 31 décembre.
- Maximum **2 déclarations par année civile** (la première initiale + une corrective si l'écart dépasse 5%).
- Le PDF d'évaluation conjointe est **optionnel** (un seul fichier par déclaration, écrasé si re-uploadé).
- Deadlines configurables par l'admin DGT : `decl2ModificationDeadline`, `JustificationDeadline`, `JointEvaluationDeadline`.

**Données persistées** : `declarations.secondDeclarationStatus`, `declarations.compliancePath`, `files` (`type = joint_evaluation`).

---

## 5. Recherche et consultation publique

**Pour qui** : tout citoyen, journaliste, ou organisme de contrôle.

**À quoi ça sert** : consulter publiquement les **indicateurs A–F** de toute entreprise déclarante (l'indicateur G reste confidentiel). Recherche par SIREN, raison sociale, région ou secteur d'activité.

**Routes** :

- `/` — page d'accueil avec formulaire de recherche
- Téléchargement Excel via `/api/export/declarations` (voir §9)

**Module** : `~/modules/home`.

**Règles métier-clés** :

- **Public, sans authentification**.
- L'indicateur **G n'est jamais exposé** (catégories d'emploi confidentielles).
- L'export Excel est conçu pour un usage analyste / journaliste (pagination, filtres par année).

---

## 6. Référents régionaux

**Pour qui** :

- **Annuaire public** : entreprises qui cherchent leur interlocuteur DREETS / inspection du travail
- **Gestion admin** : agents DGT qui maintiennent l'annuaire

**À quoi ça sert** : centraliser les contacts (mail, téléphone, suppléant) par région et département.

**Routes publiques** :

- `/referents` — liste paginée par région / département
- `/referents/[id]` — fiche détaillée (téléphone et email révélés au clic, jamais en bulk dans la liste)

**Routes admin** : `/admin/liste-referents` (CRUD + import CSV)

**Modules** : `~/modules/referents` (public), `~/modules/admin/referents` (admin).

**Routers tRPC** :

- `publicReferents.search` / `getById` — endpoints publics (audit `PUBLIC_REFERENT_SEARCH`, `PUBLIC_REFERENT_VIEW`)
- `adminReferents.search` / `create` / `edit` / `delete` / `import` — endpoints admin

**Règles métier-clés** :

- L'API publique **ne renvoie jamais** les champs de contact (`type`, `value`, `substituteEmail`) dans les listes — seulement dans la fiche détaillée. Cette séparation est volontaire (anti-scraping, RGPD).
- Pagination : 20 par défaut, max 100.
- Import CSV admin : upsert basé sur (région, département, nom).

**Données persistées** : `referents`.

---

## 7. Aide, FAQ, contact

**Pour qui** : utilisateurs perdus dans le parcours.

**Routes** :

- `/aide` — hub d'aide (sections repliables, force-dynamic pour afficher les deadlines en cours)
- `/aide/nous-contacter` — formulaire de contact (envoie un mail)
- `/faq` — FAQ statique

**Modules** : `~/modules/aide`, `~/modules/faq`.

**Règles métier-clés** :

- `/aide` est **dynamique** (`export const dynamic = "force-dynamic"`) parce qu'il lit les deadlines de campagne en BDD.
- `/faq` est **statique** (contenu en dur dans le code, pas de CMS).
- Le formulaire `/aide/nous-contacter` envoie un mail via le module `mail` (voir §11).

---

## 8. Pages légales et sitemap

**Pour qui** : tout visiteur (obligation réglementaire).

**Routes** :

- `/donnees-personnelles` — politique de confidentialité (RGPD)
- `/mentions-legales` — éditeur, hébergeur, sécurité
- `/declaration-accessibilite` — déclaration RGAA + résultats des audits
- `/gestion-des-cookies` — types de cookies, mécanismes d'opt-out
- `/plan-du-site` — index des routes publiques

**Module** : `~/modules/legal`.

**Règles métier-clés** :

- Pages **statiques** (pas de BDD), contenu maintenu manuellement dans le code.
- Le score Lighthouse RGAA cible **100%** (configuré comme seuil bloquant dans `.lighthouserc.json`).

---

## 9. PDF et exports

L'application génère plusieurs documents officiels et expose une API publique de téléchargement.

### 9.1 PDF de déclaration

| Type | Quand | Module |
|---|---|---|
| `DeclarationPdfDocument` | Pre-fill / aperçu | `~/modules/declarationPdf` |
| `TransmittedPdfDocument` | Reçu officiel après soumission | `~/modules/declarationPdf` |
| `NoSanctionPdfDocument` | Attestation d'absence de sanction | `~/modules/noSanctionAttestation` |

Téléchargement déclenché depuis :

- `/declaration-remuneration/recapitulatif/` (bouton intégré)
- Page CSE (avis officiel)
- Vue admin de la déclaration (`/admin/declarations/[id]`)

L'attestation no-sanction est servie via la Route Handler `/api/pdf/no-sanction` (audit `PDF_NO_SANCTION_DOWNLOAD`).

### 9.2 Export Excel et API publique

Routes publiques (aucune authentification, OpenAPI documentée) :

| URL | Format | Filtres |
|---|---|---|
| `/api/export/declarations?year=2024` | XLSX | par année |
| `/api/export/declarations?date_begin=...&date_end=...` | XLSX | par plage de dates |
| `/api/export/files?siren=...&year=...` | ZIP | tous les fichiers d'une déclaration |
| `/export?swagger=1` | Swagger UI | documentation interactive |

**Module** : `~/modules/export`. **Audit** : `EXPORT_DOWNLOAD`, `EXPORT_API_DECLARATIONS`, `EXPORT_API_FILES` (catégorie `export`, rétention 365 jours).

**À noter** : l'export public n'expose **jamais** l'indicateur G ni les fichiers CSE / évaluation conjointe (filtrage côté serveur dans `buildExportRows`).

---

## 10. Espace administrateur (DGT)

**Pour qui** : agents DGT (Direction Générale du Travail) avec flag `users.isAdmin = true`.

**Routes** :

| Route | Fonction |
|---|---|
| `/admin/` | Tableau de bord (raccourcis vers les sous-sections) |
| `/admin/declarations` | Recherche multi-critères (SIREN, email, année, plage de dates, statut) |
| `/admin/declarations/[id]` | Détail complet d'une déclaration, export CSV |
| `/admin/liste-referents` | Annuaire admin (CRUD + import CSV) |
| `/admin/impersonate` | Recherche d'entreprise pour impersonation |
| `/admin/parametres` | Configuration des deadlines de campagne (par année) |
| `/admin/stats/campagne` | Courbes de progression des soumissions par segment d'effectif |

**Modules** : `~/modules/admin/*`.

**Routers tRPC** : `admin`, `adminDeclarations`, `adminReferents`, `adminSettings`, `adminStats`.

**Règles métier-clés** :

- L'accès admin est gardé par le **middleware Edge** (`src/middleware.ts`) qui redirige vers `/login` si `isAdmin` est faux.
- L'**impersonation** est tracée dans `adminImpersonationEvents` (audit trail dédié, lecture par `admin.getLastImpersonated`). Le callback JWT NextAuth injecte un `impersonation: { siren, startedAt }` dans la session active.
- Les **deadlines** sont par année de campagne ; si aucune ligne n'existe en BDD pour l'année courante, des défauts viennent de `~/modules/domain` (`getDefaultCampaignDeadlines`).
- Les **stats** segmentent les entreprises par effectif (`small / medium / large`, voir `COMPANY_SIZE_RANGES`).
- L'**import GIP-MDS** est déclenché manuellement depuis la home admin (pas de cron en V2).

**Audit** : presque toutes les procédures admin sont auditées (`ADMIN_DECLARATIONS_SEARCH`, `ADMIN_SETTINGS_UPSERT_DEADLINES`, etc.).

---

## 11. Mécanismes transverses

Fonctionnalités qui ne sont pas des écrans, mais qui sont mobilisées par plusieurs features.

### 11.1 Mails transactionnels

**Module** : `~/modules/mail`. **Router tRPC** : `mail.resendReceipt`.

Mails envoyés automatiquement :

- Soumission de déclaration → reçu (numéro de soumission, lien vers le récap PDF)
- Finalisation d'avis CSE → confirmation (nombre de fichiers, raison sociale)
- Formulaire `/aide/nous-contacter` → routage vers la boîte support

L'utilisateur peut **redemander manuellement** le reçu via `mail.resendReceipt` (audit `MAIL_RECEIPT_RESEND`).

### 11.2 Audit logging

**Modules** : `~/modules/audit`, `~/server/audit`.

Toutes les **mutations** et les **lectures de données sensibles** (PII, données entreprise, PDF) sont enregistrées dans la table `audit.action_log` (schéma Postgres dédié `audit`).

| Catégorie | Rétention | Exemples |
|---|---|---|
| `mutation` | 365 jours | toutes les écritures (déclaration, CSE, admin) |
| `read_sensitive` | 180 jours | `profile.get`, `declaration.getOrCreate`, recherche admin, téléchargement PDF |
| `public_search` | 180 jours | recherche / vue d'un référent public |
| `auth` | 365 jours | login OK / login KO / logout |
| `export` | 365 jours | téléchargements API publique |
| `system` | 365 jours | import GIP, cron de cleanup |

Les rétentions sont définies dans `~/modules/audit/shared/constants.ts` (`AUDIT_RETENTION_DAYS_SHORT = 180`, `AUDIT_RETENTION_DAYS_LONG = 365`, `SHORT_RETENTION_CATEGORIES = ["read_sensitive", "public_search"]`).

**Wire-up** : ajouter une nouvelle action requiert **3 points** :

1. Constante dans `~/modules/audit/actionKeys.ts` (`AUDIT_ACTIONS.*`)
2. Catégorie dans `AUDIT_ACTION_CATEGORIES`
3. Mapping dans `PROCEDURE_TO_ACTION` (pour tRPC) ou `withAuditedRoute(...)` (pour Route Handlers)

Les clés sensibles (`password`, `token`, `authorization`, etc.) sont **automatiquement strippées** du `metadata` JSONB par `logAction`.

Un **cron quotidien** purge les lignes au-delà de leur fenêtre de rétention (voir `packages/app/scripts/audit-cleanup.mjs`).

### 11.3 Impersonation admin

L'admin DGT peut **incarner** une entreprise pour la dépanner. Le mécanisme :

1. `/admin/impersonate` → choix d'un SIREN
2. `session.update({ siren })` côté client
3. NextAuth `jwt` callback persiste `session.user.impersonation = { siren, startedAt }`
4. `useReadOnlyGuard` empêche toute écriture sur `~/modules/auth`
5. `companyWriteProcedure` rejette les mutations côté serveur
6. Un événement est inscrit dans `adminImpersonationEvents` (visible dans l'audit)

### 11.4 Pré-remplissage GIP-MDS

**Router tRPC** : `gipMds.importFromUrl` (déclenché manuellement par l'admin).

Le GIP-MDS publie chaque année (mars) un CSV des indicateurs A–F pré-calculés à partir des DSN. Le bouton admin :

1. fetch le CSV depuis `EGAPRO_GIP_MDS_API_URL`
2. parse et upsert dans `gipMdsData` (clé `(siren, year)`)
3. quand l'employeur ouvre sa déclaration, les valeurs A–F sont **pré-remplies** depuis cette table (voir `~/modules/declaration-remuneration/shared/gipMdsMapping.ts`)
4. l'utilisateur peut **écraser** les valeurs (le pré-remplissage n'est pas verrouillé)

### 11.5 Sécurité de l'API SUIT (passerelle APISIX)

L'API privée `/api/v1/*` consommée par **SUIT** (système d'information de l'inspection du travail) est protégée par une **passerelle APISIX** déployée dans le cluster Kubernetes. Voir le [README racine](../README.md#sécurisation-de-lapi-suit-via-passerelle-apisix) pour le détail. Cette feature n'a pas d'écran utilisateur — c'est de l'infra.

---

## 12. Annexe : tables Drizzle principales

Tableau de correspondance feature → tables, pour les développeurs qui débarquent.

| Table | Features qui y touchent |
|---|---|
| `users` | Authentification, profil, admin |
| `userCompanies` | Authentification (rattachement entreprise) |
| `companies` | Authentification, déclaration, admin |
| `declarations` | Déclaration index, parcours conformité |
| `jobCategories` | Déclaration index (étape 5, optionnel) |
| `employeeCategories` | Déclaration index (indicateur G) |
| `cseOpinions` | Avis CSE |
| `files` | Avis CSE (`type = cse_opinion`), évaluation conjointe (`type = joint_evaluation`) |
| `referents` | Annuaire public, gestion admin |
| `campaignDeadlines` | Paramétrage admin (deadlines par année) |
| `gipMdsData` | Pré-remplissage GIP |
| `adminImpersonationEvents` | Audit impersonation admin |
| `audit.action_log` | Audit logging (schéma Postgres dédié) |

---

## Pour aller plus loin

- **Architecture technique** (stack, modules, Next.js App Router, tRPC, Drizzle, déploiement) : [`docs/architecture.md`](architecture.md)
- **Parcours utilisateurs** (personas et flux end-to-end) : [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md)
- **Spécifications réglementaires** : [wiki Spec V2](https://github.com/SocialGouv/egapro/wiki/Spec-V2)
- **Conventions de code** : [`CLAUDE.md`](../CLAUDE.md) racine et [`packages/app/CLAUDE.md`](../packages/app/CLAUDE.md)
