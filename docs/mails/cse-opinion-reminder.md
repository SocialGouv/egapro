# `cse_opinion_reminder` — MG_B / MG_C / MG_J1 / MG_J2 / MG_A / MG_E2 · Rappels avis CSE

| | |
|---|---|
| **Type pg-boss** | `cse_opinion_reminder` |
| **Variants** | `compliance` · `justify_oct` · `justify_dec` · `corrective` · `joint_eval` |
| **Schedules** | 5 schedules — un par variant (voir ci-dessous) |
| **Builder** | [`mails/builders/cseOpinionReminder.tsx`](../../packages/notifications/src/mails/builders/cseOpinionReminder.tsx) |
| **Handler éligibilité** | [`findCseOpinionPending`](../../packages/notifications/src/eligibility/queries.ts) |
| **Pré-requis métier** | `cse_required = true` ET avis CSE pas encore déposé |

## Tableau des variants

| Variant | BRD | Cron | Deadline référence | Public cible |
|---|---|---|---|---|
| `compliance` | MG_B / MG_C | `0 8 1 2 *` (1ᵉʳ février N+1) | 1ᵉʳ mars N+1 | Toute déclaration avec CSE sans avis déposé (100-149, 150+ conforme) |
| `justify_oct` | MG_J1 | `0 8 1 9 *` (1ᵉʳ septembre) | 1ᵉʳ octobre N | Parcours « Justifier » — relance J-30 |
| `justify_dec` | MG_J2 | `0 8 1 12 *` (1ᵉʳ décembre) | 1ᵉʳ octobre N (dépassé) | Parcours « Justifier » — relance si avis non encore déposé |
| `corrective` | MG_A | `0 8 1 2 *` (1ᵉʳ février N+1) | 1ᵉʳ mars N+1 | Parcours « Actions correctives » |
| `joint_eval` | MG_E2 | `0 8 1 12 *` (1ᵉʳ décembre) | 1ᵉʳ mars N+1 | Parcours « Évaluation conjointe » |

**Dédup** : `(type, siren, year, variant)` — chaque variant a sa propre clé, donc un destinataire peut recevoir plusieurs variants au cours d'un même cycle (ex : un parcours `justify` reçoit `justify_oct` puis `justify_dec` si l'avis tarde).

## Destinataire

`declarations.declarantId → app_user.email`.

## Éligibilité (SQL)

Filtres communs à tous les variants :

```sql
d.year = {currentYear}
AND d.cancelled_at IS NULL
AND d.cse_required = true
AND u.email IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM app_cse_opinion o WHERE o.declaration_id = d.id)
```

**Filtre additionnel par variant** — les filtres sont **mutuellement exclusifs par construction** (chaque variant cible une branche distincte du flowchart, donc un destinataire ne reçoit qu'un mail par cycle même si deux variants tickent le même jour) :

| Variant | Filtre SQL spécifique | Branche flowchart |
|---|---|---|
| `compliance` | `first_declaration_path_choice IS NULL AND second_declaration_path_choice IS NULL` | MG_B (100-149 sans 7e) + MG_C (150+ conforme G<5 %) — pas de parcours Phase 2 |
| `justify_oct` / `justify_dec` | `first_declaration_path_choice = 'justify' OR second_declaration_path_choice = 'justify'` | MG_J1 + MG_J2 — parcours Justifier (R1 ou R2) |
| `corrective` | `first_declaration_path_choice = 'corrective_action' AND status = 'awaiting_cse_opinion'` | MG_A — Actions correctives, 2e déclaration soumise + écarts corrigés (FSM transitionné vers `awaiting_cse_opinion`) |
| `joint_eval` | `(first OR second path = 'joint_evaluation') AND EXISTS(app_file type='joint_evaluation')` | MG_E2 — rapport d'éval. conjointe déjà déposé (sinon le FSM attend encore le rapport, pas l'avis CSE) |

> **Pourquoi pas de filtre paramétrique uniforme** : un filtre OR sur first/second path est trop permissif pour `compliance` (matcherait aussi les Phase 2). Un filtre simple `path = corrective_action` est trop permissif pour `corrective` (matcherait avant que la 2e décl ne soit soumise). Idem `joint_evaluation` doit checker l'existence du file. Le switch explicite par variant garantit la sémantique flowchart.

## Sujets (par variant)

| Variant | Sujet |
|---|---|
| `compliance` | `Egapro - Rappel : avis du CSE — exactitude des données` |
| `justify_oct` | `Egapro - Rappel : avis du CSE — exactitude des données et justification des écarts (1er octobre)` |
| `justify_dec` | `Egapro - Rappel : avis du CSE — avis du CSE non encore déposé (relance du 1er décembre)` |
| `corrective` | `Egapro - Rappel : avis du CSE — actions correctives — exactitude des données des deux déclarations` |
| `joint_eval` | `Egapro - Rappel : avis du CSE — évaluation conjointe (relance du 1er décembre)` |

## Pré-en-tête (par variant)

| Variant | Preview text |
|---|---|
| `compliance` | L'avis du CSE sur l'exactitude des données déclarées n'a pas encore été déposé. |
| `justify_oct` | L'avis du CSE sur l'exactitude des données et la justification des écarts est attendu avant le 1er octobre. |
| `justify_dec` | L'avis du CSE sur votre justification des écarts n'a pas encore été reçu. |
| `corrective` | L'avis du CSE sur l'exactitude des données des deux déclarations n'a pas encore été déposé. |
| `joint_eval` | L'avis du CSE sur le rapport d'évaluation conjointe n'a pas encore été déposé. |

## Corps (par variant)

Structure commune : §1 (statement) + §2 (cadre réglementaire) + §3 (scope/justification) + §4 (invitation portail) + §5 (deadline) + CTA `Déposer l'avis du CSE` + § DREETS + signature.

### Variant `compliance`

> **Bonjour,**
>
> L'avis de votre CSE sur l'exactitude des données déclarées n'a pas encore été déposé sur la plateforme Egapro.
>
> Conformément à la réglementation, les entreprises d'au moins 100 salariés doivent recueillir l'avis de leur CSE sur l'exactitude des indicateurs publiés.
>
> Cet avis doit confirmer l'exactitude des données figurant dans votre déclaration.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer l'avis du CSE.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ mars {year+1}`.

### Variant `justify_oct`

> **Bonjour,**
>
> L'avis de votre CSE sur l'exactitude des données et la justification des écarts constatés n'a pas encore été déposé sur la plateforme Egapro.
>
> Conformément à la réglementation, le CSE doit être consulté sur les justifications avancées pour les écarts de rémunération constatés.
>
> Le dépôt de cet avis doit intervenir avant le 1er octobre.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer l'avis du CSE.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ octobre {year}`.

### Variant `justify_dec`

> **Bonjour,**
>
> Nous n'avons pas encore reçu l'avis de votre CSE sur la justification des écarts de rémunération.
>
> Conformément à la réglementation, votre justification des écarts doit être validée par l'avis du CSE pour clôturer votre procédure de mise en conformité.
>
> Sans dépôt de cet avis, la procédure de mise en conformité ne pourra pas être clôturée pour cette campagne.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer l'avis du CSE.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ octobre {year}` *(dépassé — relance)*.

### Variant `corrective`

> **Bonjour,**
>
> L'avis de votre CSE sur l'exactitude des données de votre première déclaration et de votre seconde déclaration au titre des actions correctives n'a pas encore été déposé.
>
> Conformément à la réglementation, votre CSE doit être consulté sur l'exactitude des indicateurs publiés ainsi que sur les actions correctives mises en œuvre.
>
> L'avis doit également mentionner les justifications éventuelles des écarts persistants.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer l'avis du CSE.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ mars {year+1}`.

### Variant `joint_eval`

> **Bonjour,**
>
> L'avis de votre CSE sur le rapport d'évaluation conjointe déposé pour votre entreprise n'a pas encore été reçu.
>
> Conformément à la réglementation, le CSE doit statuer sur l'évaluation conjointe et confirmer l'exactitude des données associées.
>
> Sans dépôt de cet avis, votre démarche d'évaluation conjointe restera incomplète.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer l'avis du CSE.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ mars {year+1}`.

## CTA commun + clôture

Tous les variants partagent les mêmes 3 éléments de pied :

> [**Déposer l'avis du CSE**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Codes BRD **MG_B / MG_C / MG_J1 / MG_J2 / MG_A / MG_E2** — Phase 2, toutes branches CSE.
