# Stratégie de tracking Matomo

> Ce qu'on mesure, **pourquoi**, et comment c'est implémenté. Pour la liste
> brute des événements et de leurs déclencheurs, voir
> [`plan-de-tracking.md`](./plan-de-tracking.md).

## Sommaire

- [Objectif](#objectif)
- [Ce qu'on mesure](#ce-quon-mesure)
- [Détail par funnel — on track quoi ?](#détail-par-funnel--on-track-quoi)
- [Les dimensions personnalisées](#les-dimensions-personnalisées)
- [Architecture technique](#architecture-technique)
- [Ajouter un nouvel événement](#ajouter-un-nouvel-événement)
- [Configuration Matomo (hors code)](#configuration-matomo-hors-code)

## Objectif

Donner aux analystes DGT de quoi calculer les KPIs d'usage de la plateforme
(K19–K25). EGAPRO **émet** des événements anonymisés (le socle), et l'analyse
fine se fait dans Matomo. Un **dashboard d'administration** (`/admin/stats`)
rapatrie en plus les funnels de parcours via la **Reporting API** de Matomo
(procédure tRPC `adminStats.getMatomoFunnel`, service `~/server/services/matomo.ts`,
secret `MATOMO_API_TOKEN`) pour offrir une vue intégrée aux admins, sans
recalcul en base.

## Ce qu'on mesure

Deux natures de signaux :

1. **Le suivi de pages** (natif, automatique) — chaque navigation est enregistrée
   par `MatomoAnalytics` monté dans le layout racine. Il alimente le nombre de
   visites (K20), la source de trafic (K22, rapport « Référents » natif), et les
   pages d'aide consultées (K21).
2. **Les événements personnalisés** — deux familles : les **funnels** multi-étapes
   (où les gens décrochent) et les **actions ponctuelles** (recherche,
   téléchargement, upload, login, ouverture d'une section d'aide, clic sur un lien
   d'accompagnement, usage du modèle de l'indicateur par catégorie — durée de
   remplissage et échecs d'import —, démarrage d'une déclaration).
   Liste complète dans [`plan-de-tracking.md`](./plan-de-tracking.md).

Le croisement « visiteurs » (pages vues) vs. « acteurs » (événements d'action)
donne le **taux de consultation K20**.

## Détail par funnel — on track quoi ?

Un funnel mesure la progression étape par étape et **où les utilisateurs
décrochent**. Les quatre mêmes événements sont émis pour chaque funnel
(`MATOMO_FUNNEL_ACTION`) :

- `funnel_start` — à l'entrée sur la 1ʳᵉ étape suivie ;
- `step_complete` — à chaque passage vers une étape **supérieure** (navigation
  avant) ; `name` = clé de l'étape **quittée**, `value` = durée passée dessus (s) ;
- `funnel_abandon` — sur `beforeunload` (fermeture/changement d'onglet) tant que
  le funnel est en cours ; `name` = étape courante, `value` = durée totale (s) ;
- `funnel_complete` — à la finalisation ; `value` = durée totale (s).

L'état est conservé en `sessionStorage` (clé propre à chaque funnel) pour
survivre à la navigation pleine page entre étapes. Un retour en arrière ne
ré-émet rien (mise à jour silencieuse de l'étape courante).

### 1. Déclaration Index — `declaration`

Saisie des indicateurs A–F jusqu'à la soumission.
`storageKey` : `egapro:declaration-funnel`.
Émis par `useFunnelTracking` dans `declaration-remuneration/StepPageClient.tsx`
(start / step / abandon) et `trackFunnelComplete` dans `steps/Step6Review.tsx`
(complete). **Dimensions : année de campagne + tranche d'effectif.**

Étapes suivies (`/declaration-remuneration/etape/<n>`) :

| Clé | Étape |
|---|---|
| `step_1` | Effectifs |
| `step_2` | Écart de rémunération |
| `step_3` | Écart de rémunération variable |
| `step_4` | Quartiles de rémunération |
| `step_5` | Écart par catégorie de salariés |
| `step_6` | Récapitulatif |

| Événement | Déclencheur précis |
|---|---|
| `funnel_start` | Arrivée sur l'étape 1 sans funnel en cours |
| `step_complete` | Passage `étape n → n+1` (bouton « Suivant ») |
| `funnel_abandon` | `beforeunload` pendant la saisie |
| `funnel_complete` | Succès de la mutation `declaration.submit` (recap, étape 6) |

### 2. Avis CSE — `cse_opinion`

Renseigner les avis du CSE, puis déposer le(s) document(s).
`storageKey` : `egapro:cse-funnel`.
Émis par `FunnelStepTracker` monté sur `/avis-cse/etape/[step]` (start / step /
abandon) et `FunnelCompleteTracker` sur `/avis-cse/confirmation` (complete).
**Dimensions : année de campagne.**

Étapes suivies (`/avis-cse/etape/<n>`) :

| Clé | Étape |
|---|---|
| `step_1` | Renseigner les avis émis par le CSE |
| `step_2` | Importer / déposer l'avis ou les avis du CSE |

| Événement | Déclencheur précis |
|---|---|
| `funnel_start` | Arrivée sur `/avis-cse/etape/1` |
| `step_complete` | Passage `étape 1 → 2` (`name = step_1`) |
| `funnel_abandon` | `beforeunload` pendant le parcours |
| `funnel_complete` | Affichage de `/avis-cse/confirmation` (avis soumis) |

### 3. Parcours-conformité — `compliance_path`

Seconde déclaration / actions correctives jusqu'au récapitulatif.
`storageKey` : `egapro:compliance-funnel`.
Émis par `FunnelStepTracker` dans
`secondDeclaration/SecondDeclarationStepPage.tsx` (start / step / abandon) et
`FunnelCompleteTracker` sur
`/declaration-remuneration/parcours-conformite/confirmation` (complete).
**Dimensions : année de campagne (étapes) ; aucune (complete).**

Étapes suivies (`/declaration-remuneration/parcours-conformite/etape/<n>`) :

| Clé | Étape |
|---|---|
| `step_1` | Actions correctives et seconde déclaration |
| `step_2` | Seconde déclaration des écarts par catégorie de salariés |
| `step_3` | Récapitulatif de votre déclaration |

| Événement | Déclencheur précis |
|---|---|
| `funnel_start` | Arrivée sur `/parcours-conformite/etape/1` |
| `step_complete` | Passage `étape n → n+1` |
| `funnel_abandon` | `beforeunload` pendant le parcours |
| `funnel_complete` | Affichage de `/parcours-conformite/confirmation` |

> Les `funnel_complete` montés sur une page de confirmation (CSE, conformité)
> sont **idempotents** : ils vident l'état du funnel après émission, donc un
> rechargement de la confirmation ne re-compte pas.

## Les dimensions personnalisées

Deux dimensions **anonymisées** — aucune PII (jamais de SIREN, email, nom
d'entreprise, ni de requête de recherche) :

| Slot Matomo | Contenu | Pourquoi |
|---|---|---|
| 1 — `CAMPAIGN_YEAR` | Année de campagne | Comparer les campagnes entre elles |
| 2 — `WORKFORCE_RANGE` | Tranche d'effectif (`getCompanySizeRange`) | Segmenter par taille d'entreprise (obligations < 50 / 50–99 / ≥ 100) |

⚠️ **Les IDs de slot doivent être configurés à l'identique dans l'admin Matomo.**
Un ID erroné fait silencieusement ignorer la dimension. Les IDs sont centralisés
dans `MATOMO_CUSTOM_DIMENSION` (`events.ts`).

Les recherches n'émettent que les **noms des facettes utilisées** (`query+region`…),
**jamais leurs valeurs**. Les événements de tracking sont **client-side Matomo** :
ils ne passent pas par tRPC, donc hors périmètre de l'audit logging applicatif.

## Architecture technique

```
modules/analytics/
  trackEvent.ts            → wrapper typé bas niveau (no-op si Matomo non configuré)
  shared/events.ts         → taxonomie : catégories, actions, dimensions, FunnelConfig
  useFunnelTracking.ts     → hook générique de funnel (+ trackFunnelComplete)
  FunnelStepTracker.tsx    → composant client « rend rien » pour pages serveur (étape)
  FunnelCompleteTracker.tsx→ idem pour la page de confirmation (complete)
  MatomoAnalytics.tsx      → suivi de pages (monté dans app/layout.tsx)
```

- `trackEvent` est un **no-op silencieux** quand `NEXT_PUBLIC_MATOMO_URL` /
  `NEXT_PUBLIC_MATOMO_SITE_ID` ne sont pas définis (et côté serveur). Le code
  reste donc sûr à appeler partout.
- Le **hook de funnel est agnostique** : chaque funnel fournit un `FunnelConfig`
  (`{ category, stepKeys, storageKey }`), co-localisé dans un `funnelConfig.ts`
  de son module métier.
- Les pages d'étape étant des **Server Components**, on y monte `FunnelStepTracker`
  / `FunnelCompleteTracker` (composants client qui ne rendent rien) plutôt que
  d'appeler le hook directement. La déclaration Index, dont le wizard est déjà un
  Client Component, appelle le hook directement.

## Ajouter un nouvel événement

1. Ajouter le verbe dans `MATOMO_ACTION` (action ponctuelle) ou réutiliser
   `MATOMO_FUNNEL_ACTION` (funnel) dans `events.ts` ; au besoin, une nouvelle
   `category` dans `MATOMO_EVENT_CATEGORY`.
2. Appeler `trackEvent({ category, action, name?, value?, dimensions? })` au bon
   endroit (un composant client). Pour un nouveau funnel : créer un `FunnelConfig`
   et monter `FunnelStepTracker` / `FunnelCompleteTracker`.
3. **Vérifier l'absence de PII** dans `name`/`value`/`dimensions`.
4. Documenter l'événement dans [`plan-de-tracking.md`](./plan-de-tracking.md)
   (la table doit rester 1:1 avec le code) et le rattacher à un KPI.

## Configuration Matomo (hors code)

- Variables d'environnement : `NEXT_PUBLIC_MATOMO_URL`, `NEXT_PUBLIC_MATOMO_SITE_ID`
  (déclarées dans `env.js`, section client).
- Créer les **Custom Dimensions** dans l'admin Matomo aux slots **1** (année de
  campagne) et **2** (tranche d'effectif).
- Le **site de consultation** (`/index-egapro/recherche`) est une application
  externe : ses visites (K24) se mesurent avec son propre site Matomo. Côté
  EGAPRO on ne suit que les **départs sortants** (`consultation_outbound`,
  `search_submit`).
