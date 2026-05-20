# `compliance_path_choice_reminder` — ME · Rappel choix de parcours

| | |
|---|---|
| **Type pg-boss** | `compliance_path_choice_reminder` |
| **Schedule** | `0 8 16 6 *` (J-15 avant 1er juillet = 16 juin 08:00) |
| **Builder** | [`mails/builders/compliancePathChoiceReminder.tsx`](../../packages/notifications/src/mails/builders/compliancePathChoiceReminder.tsx) |
| **Handler éligibilité** | [`findAwaitingComplianceChoice`](../../packages/notifications/src/eligibility/queries.ts) |
| **Deadline référence** | 1ᵉʳ juillet Y (`DEADLINES.compliancePathChoice`) |
| **Pré-requis métier** | Entreprise 100+ avec écart G ≥ 5 % (FSM bascule auto en `awaiting_compliance_path_choice` quand le seuil est dépassé) |

## Destinataire

`declarations.declarantId → app_user.email` — celui qui a soumis la 1ère ou la 2e déclaration sans avoir encore choisi de parcours.

## Éligibilité (SQL — couvre Round 1 ET Round 2)

```sql
SELECT d.siren, d.year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
WHERE d.year = {currentYear}
  AND d.cancelled_at IS NULL
  AND u.email IS NOT NULL
  AND (
      -- Round 1: first compliance path not yet chosen
      (d.status = 'awaiting_compliance_path_choice' AND d.first_declaration_path_choice IS NULL)
      OR
      -- Round 2: revision required after second declaration with persistent gap
      (d.status = 'awaiting_revision_choice'        AND d.second_declaration_path_choice IS NULL)
  );
```

> **Note** : Le Round 2 est nécessaire pour les entreprises qui ont choisi "Actions correctives" en Round 1 et dont l'écart G reste ≥ 5 % après la seconde déclaration. Sans la branche `awaiting_revision_choice`, ces destinataires ne recevraient aucun rappel.

## Sujet

```
Egapro - Rappel : choix de votre parcours de mise en conformité
```

## Pré-en-tête (preview)

> Vous devez choisir un parcours de mise en conformité avant la date limite.

## Corps

> **Bonjour,**
>
> Votre déclaration des indicateurs fait apparaître un écart de rémunération supérieur ou égal à **5 %**. Vous n'avez pas encore choisi votre parcours de mise en conformité.
>
> Conformément à la réglementation, lorsque l'écart de rémunération constaté est supérieur ou égal à 5 %, votre entreprise doit choisir un parcours de mise en conformité pour réduire cet écart.
>
> Trois parcours sont disponibles : justification des écarts, actions correctives, ou évaluation conjointe avec votre CSE. Le détail et les conséquences de chaque option sont expliqués sur le portail Egapro.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin d'effectuer ce choix.
>
> La sélection doit intervenir au plus tard le `1ᵉʳ juillet {year}`.
>
> [**Choisir mon parcours**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **ME** — Phase 2 (entrée), chemin 4b dans les flowcharts 2027/2028/2029/2030.
