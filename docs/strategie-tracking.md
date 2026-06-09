# Stratégie de tracking Matomo

> Ce qu'on mesure, **pourquoi**, et comment c'est implémenté. Pour la liste
> brute des événements, voir [`plan-de-tracking.md`](./plan-de-tracking.md).

## Sommaire

- [Objectif](#objectif)
- [Ce qu'on mesure](#ce-quon-mesure)
- [Les funnels](#les-funnels)
- [Les dimensions personnalisées](#les-dimensions-personnalisées)
- [Politique RGPD / vie privée](#politique-rgpd--vie-privée)
- [Architecture technique](#architecture-technique)
- [Ajouter un nouvel événement](#ajouter-un-nouvel-événement)
- [Configuration Matomo (hors code)](#configuration-matomo-hors-code)

## Objectif

Donner aux analystes DGT de quoi calculer les KPIs d'usage de la plateforme
(K19–K25) **sans visualisation embarquée** : EGAPRO se contente d'**émettre**
des événements propres et anonymisés ; l'analyse et les tableaux de bord se
font dans Matomo. Aucune API de reporting, aucun graphique côté application.

## Ce qu'on mesure

Deux natures de signaux :

1. **Le suivi de pages** (natif, automatique) — chaque navigation est enregistrée
   par `MatomoAnalytics` monté dans le layout racine. Il alimente le nombre de
   visites (K20), la source de trafic (K22, rapport « Référents » natif), et les
   pages d'aide consultées (K21).

2. **Les événements personnalisés** — deux familles :
   - les **funnels** multi-étapes (où les gens décrochent dans un parcours) ;
   - les **actions ponctuelles** (recherche, téléchargement, upload, login,
     ouverture d'une section d'aide, démarrage d'une déclaration).

Le croisement « visiteurs » (pages vues) vs. « acteurs » (événements d'action)
donne le **taux de consultation K20**.

## Les funnels

Un funnel mesure la progression étape par étape et **où les utilisateurs
abandonnent**. Quatre événements : `funnel_start`, `step_complete` (avec la
durée passée sur l'étape), `funnel_abandon` (sur `beforeunload`), et
`funnel_complete` (sur la soumission / la page de confirmation).

| Funnel | Scénario (KPI K19) | Étapes |
|---|---|---|
| **Déclaration Index** (`declaration`) | Saisie des indicateurs A–F jusqu'à la soumission | 6 |
| **Avis CSE** (`cse_opinion`) | Renseigner les avis du CSE → déposer le(s) document(s) | 2 |
| **Parcours-conformité** (`compliance_path`) | Seconde déclaration / actions correctives → récapitulatif | 3 |

Chaque funnel possède sa propre clé `sessionStorage` (`egapro:*-funnel`) pour
que les parcours ne se télescopent pas. La détection d'abandon est conservée
volontairement : c'est elle qui rend une analyse de funnel utile.

> Le terme « par scénario » du KPI K19 correspond à la `category` du funnel.

## Les dimensions personnalisées

Deux dimensions anonymisées, attachées aux événements de funnel (et au
téléchargement PDF) :

| Slot Matomo | Contenu | Pourquoi |
|---|---|---|
| 1 — `CAMPAIGN_YEAR` | Année de campagne | Comparer les campagnes entre elles |
| 2 — `WORKFORCE_RANGE` | Tranche d'effectif (`getCompanySizeRange`) | Segmenter par taille d'entreprise (obligations différentes < 50 / 50–99 / ≥ 100) |

⚠️ **Les IDs de slot doivent être configurés à l'identique dans l'admin Matomo.**
Un ID erroné fait silencieusement ignorer la dimension. Les IDs sont centralisés
dans `MATOMO_CUSTOM_DIMENSION` (`events.ts`) pour ne jamais être dupliqués.

## Politique RGPD / vie privée

Règle absolue : **aucun événement ne porte de donnée personnelle.**

- Pas de SIREN, d'email, de nom d'entreprise, de téléphone dans `name` ou les dimensions.
- Les **recherches** n'émettent que les **noms des facettes utilisées** (`query+region`…),
  **jamais leurs valeurs** : la requête libre peut contenir un SIREN ou une raison sociale.
- Les dimensions se limitent à l'année de campagne et à la tranche d'effectif (anonymisée).
- Les noms d'événements d'aide/de ressources sont des **identifiants structurels**
  stables (`accordion-…`, `nouveau-site`…), pas du texte saisi par l'utilisateur.

Les événements de tracking sont **client-side Matomo** : ils ne passent pas par
tRPC et ne relèvent donc pas de l'audit logging applicatif (`PROCEDURE_TO_ACTION`).

## Architecture technique

```
modules/analytics/
  trackEvent.ts            → wrapper typé bas niveau (no-op si Matomo non configuré)
  shared/events.ts         → taxonomie : catégories, actions, dimensions, FunnelConfig
  useFunnelTracking.ts     → hook générique de funnel (+ trackFunnelComplete)
  FunnelStepTracker.tsx    → composant client « rends rien » pour pages serveur (étape)
  FunnelCompleteTracker.tsx→ idem pour la page de confirmation (complete)
  MatomoAnalytics.tsx      → suivi de pages (monté dans app/layout.tsx)
```

- `trackEvent` est un **no-op silencieux** quand `NEXT_PUBLIC_MATOMO_URL` /
  `NEXT_PUBLIC_MATOMO_SITE_ID` ne sont pas définis (et côté serveur). Le code
  reste donc sûr à appeler partout.
- Le **hook de funnel est agnostique** : chaque funnel fournit un `FunnelConfig`
  (`{ category, stepKeys, storageKey }`). Voir les `funnelConfig.ts` co-localisés
  dans chaque module métier.
- Les pages d'étape étant des **Server Components**, on y monte `FunnelStepTracker`
  / `FunnelCompleteTracker` (composants client qui ne rendent rien) plutôt que
  d'appeler le hook directement.

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
