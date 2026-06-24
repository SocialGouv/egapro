# Plan de tracking Matomo

> Table de référence **exhaustive** de tous les événements Matomo émis par la
> plateforme, **et à partir de quel déclencheur** chacun part. Toute ligne ici
> correspond à un appel réel dans le code, et inversement.
> Source de vérité du code : `packages/app/src/modules/analytics/shared/events.ts`.
> Pour le « pourquoi », voir [`strategie-tracking.md`](./strategie-tracking.md).

## Sommaire

- [Conventions](#conventions)
- [Suivi de pages (natif)](#suivi-de-pages-natif)
- [Événements de funnel](#événements-de-funnel)
  - [Déclaration Index](#funnel--déclaration-index-declaration)
  - [Avis CSE](#funnel--avis-cse-cse_opinion)
  - [Parcours-conformité](#funnel--parcours-conformité-compliance_path)
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

| Quoi | Déclencheur | Émis par | KPI |
|---|---|---|---|
| Page vue | Chaque navigation (App Router) | `MatomoAnalytics` (`trackAppRouter`), monté dans `app/layout.tsx` | K20, K21, K24 |
| Source de visite | Calculé par Matomo à partir du référent de la page vue | Rapport « Référents » natif (aucun code) | K22 |

## Événements de funnel

Les quatre mêmes actions (`MATOMO_FUNNEL_ACTION`) sont émises pour chaque funnel par le hook `useFunnelTracking` / `trackFunnelComplete` :

- `funnel_start` — entrée sur la 1ʳᵉ étape suivie ;
- `step_complete` — passage vers une étape **supérieure** ; `name` = étape **quittée**, `value` = durée passée dessus (s) ;
- `funnel_abandon` — `beforeunload` tant que le funnel est en cours ; `name` = étape courante, `value` = durée totale (s) ;
- `funnel_complete` — finalisation ; `value` = durée totale (s).

### Funnel — Déclaration Index (`declaration`)

`storageKey` : `egapro:declaration-funnel` · Dimensions : **année + tranche d'effectif** · Émis par `StepPageClient.tsx` (start/step/abandon) et `Step6Review.tsx` (complete).

Clés d'étape : `step_1` Effectifs · `step_2` Écart de rémunération · `step_3` Écart de rémunération variable · `step_4` Quartiles de rémunération · `step_5` Écart par catégorie de salariés · `step_6` Récapitulatif.

| `action` | Déclencheur | `name` | `value` |
|---|---|---|---|
| `funnel_start` | Arrivée sur `/declaration-remuneration/etape/1` sans funnel en cours | — | — |
| `step_complete` | Passage `étape n → n+1` (bouton « Suivant ») | `step_<n quittée>` | durée sur l'étape (s) |
| `funnel_abandon` | `beforeunload` pendant la saisie | `step_<n courante>` | durée totale (s) |
| `funnel_complete` | Succès de la mutation `declaration.submit` (étape 6, récap) | — | durée totale (s) |

### Funnel — Avis CSE (`cse_opinion`)

`storageKey` : `egapro:cse-funnel` · Dimensions : **année** · Émis par `FunnelStepTracker` sur `/avis-cse/etape/[step]` (start/step/abandon) et `FunnelCompleteTracker` sur `/avis-cse/confirmation` (complete).

Clés d'étape : `step_1` Renseigner les avis émis par le CSE · `step_2` Importer / déposer l'avis du CSE.

| `action` | Déclencheur | `name` | `value` |
|---|---|---|---|
| `funnel_start` | Arrivée sur `/avis-cse/etape/1` | — | — |
| `step_complete` | Passage `étape 1 → 2` | `step_1` | durée sur l'étape (s) |
| `funnel_abandon` | `beforeunload` pendant le parcours | `step_<n courante>` | durée totale (s) |
| `funnel_complete` | Affichage de `/avis-cse/confirmation` (avis soumis) | — | durée totale (s) |

### Funnel — Parcours-conformité (`compliance_path`)

`storageKey` : `egapro:compliance-funnel` · Dimensions : **année** (étapes) / **aucune** (complete) · Émis par `FunnelStepTracker` dans `SecondDeclarationStepPage.tsx` (start/step/abandon) et `FunnelCompleteTracker` sur `/declaration-remuneration/parcours-conformite/confirmation` (complete).

Clés d'étape : `step_1` Actions correctives et seconde déclaration · `step_2` Seconde déclaration des écarts par catégorie · `step_3` Récapitulatif.

| `action` | Déclencheur | `name` | `value` |
|---|---|---|---|
| `funnel_start` | Arrivée sur `/parcours-conformite/etape/1` | — | — |
| `step_complete` | Passage `étape n → n+1` | `step_<n quittée>` | durée sur l'étape (s) |
| `funnel_abandon` | `beforeunload` pendant le parcours | `step_<n courante>` | durée totale (s) |
| `funnel_complete` | Affichage de `/parcours-conformite/confirmation` | — | durée totale (s) |

## Événements d'action ponctuelle

| `category` / `action` | Déclencheur | `name` | `value` | Émis par | KPI |
|---|---|---|---|---|---|
| `search` / `search_submit` | Soumission du formulaire de recherche entreprise (page d'accueil) | facettes utilisées (`query+region`…, sinon `empty`) | — | `home/HomeSearchForm.tsx` | K25, K24 |
| `search` / `search_submit` | Soumission du formulaire de recherche de référents | facettes utilisées (`region+county`…, sinon `empty`) | — | `referents/shared/ReferentsSearchForm.tsx` | K25 |
| `search` / `consultation_outbound` | Clic sur le lien « Observatoire » du header (vers le site de consultation) | — | — | `layout/shared/ConsultationNavLink.tsx` | K24 |
| `help` / `faq_section_open` | Ouverture d'un accordéon FAQ (passage à `aria-expanded=true`, pas la fermeture) | id structurel `accordion-<section>-<sous-section>-<index>` | — | `faq/FaqAccordionGroup.tsx` | K21 |
| `help` / `aide_resource_click` | Clic sur une carte ressource de `/aide` | id de la ressource (`nouveau-site`, `indicateurs-remuneration`, `indicateurs-representation`) | — | `aide/AideResourceCards.tsx` | K21 |
| `help` / `help_link_click` | Clic sur un lien d'accompagnement instrumenté (parcours déclaration / conformité) | slug du lien (`cse_models` \| `objective_criteria` \| `corrective_actions` \| `joint_evaluation`) | — | `analytics/TrackedLink.tsx` (`NextStepsBox`, `CompliancePathChoice`, `CompliancePathOption`, `JointEvaluationForm`) | K21 |
| `document` / `pdf_download` | Clic sur le bouton « Télécharger le récapitulatif (PDF) » | `main` \| `correction` | — | `declarationPdf/DownloadDeclarationPdfButton.tsx` | K20 |
| `document` / `file_upload` | Upload réussi de **tous** les fichiers sélectionnés | `flowType` (enum non-PII du flux) | nombre de fichiers | `shared/useFileUploadForm.ts` | K20 |
| `document` / `category_import` | Import réussi d'un fichier de catégories (étape 5) | — | nombre de catégories | `declaration-remuneration/steps/step5/CategoryImportExport.tsx` | K20 |
| `document` / `category_import_duration` | Import réussi, quand la modale d'import a été ouverte dans la session | — | durée écoulée ouverture modale→import (s) | `declaration-remuneration/steps/step5/CategoryImportExport.tsx` (via `categoryModelTracking.ts`) | K20 |
| `document` / `category_import_failure` | Échec de parsing d'un fichier de catégories importé | type d'erreur (`missing-columns` \| `invalid-value` \| `empty-file`) | — | `declaration-remuneration/steps/step5/CategoryImportExport.tsx` | K20 |
| `auth` / `login_start` | Clic sur « S'identifier avec ProConnect » (avant la redirection OIDC) | — | — | `login/ProConnectButton.tsx` | K20 |
| `dashboard` / `declaration_start` | Clic sur le lien de démarrage d'une déclaration rémunération depuis `mon-espace` | `remuneration` | — | `my-space/DeclarationLink.tsx` | K19, K20 |
| `cse_status` / `cse_status_confirm` | Enregistrement du statut CSE d'une entreprise (succès de `company.updateHasCse`) | `oui` \| `non` (jamais de SIREN) | — | `my-space/useUpdateHasCse.ts` (`CompanyEditModal`, `MissingInfoModal`, `UpdateCseModal`) | Engagement CSE (`/admin/stats`) |

> Dimension : `pdf_download` et `cse_status_confirm` portent l'année de campagne
> (`cse_status_confirm` toujours, `pdf_download` quand elle est connue). Aucune
> autre action ne porte de dimension. `cse_status_confirm` n'émet que le label
> borné `oui`/`non` — jamais le SIREN, pour préserver l'exemption de consentement
> CNIL : le comptage est donc un **volume de confirmations** (pas d'entreprises
> distinctes). Les recherches n'émettent **que** les noms de facettes, jamais
> leurs valeurs (la requête libre peut contenir un SIREN ou un nom d'entreprise).

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
| **K21** — consultation de l'aide par partie/section | `help/faq_section_open`, `help/aide_resource_click`, `help/help_link_click` + pages vues `/aide` et `/faq` |
| **K22** — source de la visite | Rapport « Référents » natif de Matomo (aucun code) |
| **K23** — bouton « donnez votre avis » | **Hors scope de cette PR** (le bouton n'existe pas encore) |
| **K24** — visites du site de consultation | `search/consultation_outbound` + `search/search_submit` (départs sortants). Les visites réelles du site externe `/index-egapro/recherche` se mesurent **sur ce site** (Matomo dédié). |
| **K25** — usage de la recherche et des filtres | `search/search_submit` (avec les facettes utilisées) |
