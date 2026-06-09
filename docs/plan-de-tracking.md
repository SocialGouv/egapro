# Plan de tracking Matomo

> Table de référence **exhaustive** des événements Matomo émis par la plateforme.
> Toute ligne ici correspond à un appel réel dans le code, et inversement.
> Source de vérité du code : `packages/app/src/modules/analytics/shared/events.ts`.
> Pour le « pourquoi » (funnels, dimensions, politique RGPD), voir
> [`strategie-tracking.md`](./strategie-tracking.md).

## Sommaire

- [Conventions](#conventions)
- [Suivi de pages (natif)](#suivi-de-pages-natif)
- [Événements de funnel](#événements-de-funnel)
- [Événements d'action ponctuelle](#événements-daction-ponctuelle)
- [Dimensions personnalisées](#dimensions-personnalisées)
- [Couverture des KPIs](#couverture-des-kpis)

## Conventions

Chaque événement Matomo porte quatre champs (`trackEvent`) :

| Champ | Rôle |
|---|---|
| `category` | Famille de l'événement (un funnel, ou une famille d'actions). Valeurs : `MATOMO_EVENT_CATEGORY`. |
| `action` | Le verbe. Funnels → `MATOMO_FUNNEL_ACTION` ; actions ponctuelles → `MATOMO_ACTION`. |
| `name` | Précision optionnelle (clé d'étape, facettes utilisées, identifiant de ressource…). **Jamais de PII.** |
| `value` | Nombre optionnel (durée en secondes pour les funnels, nombre de fichiers/catégories pour les imports). |

Les **dimensions personnalisées** (année de campagne, tranche d'effectif) sont attachées à part — voir la section dédiée.

## Suivi de pages (natif)

Le composant `MatomoAnalytics` (`modules/analytics/MatomoAnalytics.tsx`), monté dans `app/layout.tsx`, suit **automatiquement chaque page vue** (`trackAppRouter` de `@socialgouv/matomo-next`). Aucun événement custom n'est nécessaire pour :

- le **nombre de visites / pages vues** (base du KPI K20) ;
- la **source de visite** (Google, accès direct, autre) — rapport « Référents » natif de Matomo (KPI **K22**) ;
- les **pages d'aide / FAQ visitées** (en complément des événements `HELP` ci-dessous).

## Événements de funnel

Tous les funnels partagent les quatre mêmes actions (`MATOMO_FUNNEL_ACTION`) émises par le hook générique `useFunnelTracking` (+ `trackFunnelComplete`) :

| `action` | Quand | `name` | `value` |
|---|---|---|---|
| `funnel_start` | Entrée sur la 1ʳᵉ étape | — | — |
| `step_complete` | Passage à l'étape suivante | `step_<n>` (étape quittée) | durée passée sur l'étape (s) |
| `funnel_abandon` | `beforeunload` avec funnel en cours | `step_<n>` (étape courante) | durée totale (s) |
| `funnel_complete` | Soumission / page de confirmation | — | durée totale (s) |

| Funnel | `category` | Étapes | `storageKey` | Émis par |
|---|---|---|---|---|
| Déclaration Index | `declaration` | 6 (`step_1`→`step_6`) | `egapro:declaration-funnel` | `declaration-remuneration/StepPageClient.tsx` (start/step/abandon) · `steps/Step6Review.tsx` (complete) |
| Avis CSE | `cse_opinion` | 2 (`step_1`→`step_2`) | `egapro:cse-funnel` | `app/avis-cse/etape/[step]` via `FunnelStepTracker` · `app/avis-cse/confirmation` via `FunnelCompleteTracker` |
| Parcours-conformité (seconde déclaration) | `compliance_path` | 3 (`step_1`→`step_3`) | `egapro:compliance-funnel` | `secondDeclaration/SecondDeclarationStepPage.tsx` via `FunnelStepTracker` · `app/.../parcours-conformite/confirmation` via `FunnelCompleteTracker` |

Dimensions attachées : déclaration Index → année + tranche d'effectif ; avis CSE → année ; parcours-conformité → année (étapes), aucune (complete).

## Événements d'action ponctuelle

| `category` | `action` | `name` | `value` | Composant émetteur | KPI |
|---|---|---|---|---|---|
| `search` | `search_submit` | facettes utilisées (ex. `query+region`, sinon `empty`) | — | `home/HomeSearchForm.tsx`, `referents/shared/ReferentsSearchForm.tsx` | K25, K24 |
| `search` | `consultation_outbound` | — | — | `layout/shared/ConsultationNavLink.tsx` (lien « Observatoire » du header) | K24 |
| `help` | `faq_section_open` | id structurel de l'accordéon (`accordion-<section>-<sous-section>-<index>`) | — | `faq/FaqAccordionGroup.tsx` | K21 |
| `help` | `aide_resource_click` | id de la ressource (`nouveau-site`, `indicateurs-remuneration`, `indicateurs-representation`) | — | `aide/AideResourceCards.tsx` | K21 |
| `document` | `pdf_download` | `main` \| `correction` | — | `declarationPdf/DownloadDeclarationPdfButton.tsx` | K20 |
| `document` | `file_upload` | `flowType` (enum non-PII du flux d'upload) | nombre de fichiers | `shared/useFileUploadForm.ts` | K20 |
| `document` | `category_import` | — | nombre de catégories | `declaration-remuneration/steps/step5/CategoryImportExport.tsx` | K20 |
| `auth` | `login_start` | — | — | `login/ProConnectButton.tsx` | K20 |
| `dashboard` | `declaration_start` | `remuneration` | — | `my-space/DeclarationLink.tsx` | K19, K20 |

> Le téléchargement PDF porte la dimension année quand elle est connue. Les
> recherches n'émettent **que** les noms de facettes utilisées, jamais leurs
> valeurs (la requête libre peut contenir un SIREN ou un nom d'entreprise).

## Dimensions personnalisées

Configurées côté **admin Matomo** (les IDs de slot doivent correspondre, sinon la dimension est silencieusement ignorée) :

| Slot | Constante | Contenu | Exemple |
|---|---|---|---|
| 1 | `CAMPAIGN_YEAR` | Année de campagne de la déclaration | `"2024"` |
| 2 | `WORKFORCE_RANGE` | Tranche d'effectif (anonymisée) | `"50-99"` |

## Couverture des KPIs

| KPI | Couvert par |
|---|---|
| **K19** — taux de complétion du parcours, par scénario | Événements de funnel des 3 funnels (`funnel_start`/`step_complete`/`funnel_complete`/`funnel_abandon`) + `dashboard/declaration_start` |
| **K20** — taux de consultation (visiteurs vs. acteurs) | Pages vues natives (`MatomoAnalytics`) **vs.** événements d'action (`document/*`, `auth/login_start`, `search/*`, `dashboard/*`) |
| **K21** — consultation de l'aide par partie/section | `help/faq_section_open`, `help/aide_resource_click` + pages vues `/aide` et `/faq` |
| **K22** — source de la visite | Rapport « Référents » natif de Matomo (aucun code) |
| **K23** — bouton « donnez votre avis » | **Hors scope de cette PR** (le bouton n'existe pas encore) |
| **K24** — visites du site de consultation | `search/consultation_outbound` + `search/search_submit` (départs sortants). Les visites réelles du site externe `/index-egapro/recherche` se mesurent **sur ce site** (Matomo dédié). |
| **K25** — usage de la recherche et des filtres | `search/search_submit` (avec les facettes utilisées) |
