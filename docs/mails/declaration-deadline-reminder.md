# `declaration_deadline_reminder` — MR30 / MR10 · Rappel échéance 1ère déclaration

| | |
|---|---|
| **Type pg-boss** | `declaration_deadline_reminder` |
| **Variants** | `daysRemaining: 30` (MR30) · `daysRemaining: 10` (MR10) |
| **Schedules** | `0 8 2 5 *` (J-30 = 2 mai 08:00) · `0 8 22 5 *` (J-10 = 22 mai 08:00) |
| **Builder** | [`mails/builders/declarationDeadlineReminder.tsx`](../../packages/notifications/src/mails/builders/declarationDeadlineReminder.tsx) |
| **Handler éligibilité** | [`findDraftDeclarations`](../../packages/notifications/src/eligibility/queries.ts) |
| **Deadline référence** | 1ᵉʳ juin Y (`DEADLINES.declarationModification`) |

## Destinataire

`declarations.declarantId → app_user.email` — celui qui a démarré la déclaration mais ne l'a pas encore soumise.

## Éligibilité (SQL)

```sql
SELECT d.siren, d.year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
JOIN app_company c ON c.siren = d.siren
WHERE d.year = {currentYear}
  AND d.cancelled_at IS NULL
  AND d.status = 'draft'
  AND c.workforce >= 50
  AND u.email IS NOT NULL;
```

**Dédup** : `(type, siren, year, variant=d30|d10)` — un envoi par variant par déclarant et par cycle.

## Sujet

```
Egapro - Rappel : votre déclaration des indicateurs est attendue dans {daysRemaining} jours
```

## Pré-en-tête (preview)

> Il vous reste {daysRemaining} jours pour finaliser votre déclaration des indicateurs.

## Corps

> **Bonjour,**
>
> Votre déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes n'a pas encore été finalisée. Il vous reste {daysRemaining} jours pour la déposer.
>
> Conformément à la réglementation, votre entreprise est tenue de déclarer chaque année les indicateurs relatifs aux écarts de rémunération.
>
> Votre déclaration est préremplie avec les données connues de l'administration pour les six premiers indicateurs de rémunération, issues de la DSN.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de finaliser et publier votre déclaration.
>
> La déclaration est ouverte jusqu'au `1ᵉʳ juin {year}`. Au-delà de cette date, elle ne pourra plus être modifiée.
>
> [**Reprendre ma déclaration**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Codes BRD **MR30** + **MR10** — Phase 1 commune (50+), tronc commun.
