# `second_declaration_reminder` — MSD3 / MSD30 · Rappel 2e déclaration

| | |
|---|---|
| **Type pg-boss** | `second_declaration_reminder` |
| **Variants** | `daysRemaining: 90` (MSD3) · `daysRemaining: 30` (MSD30) |
| **Schedules** | `0 8 3 10 *` (J-90 = 3 octobre 08:00) · `0 8 1 12 *` (J-30 = 1ᵉʳ décembre 08:00) |
| **Builder** | [`mails/builders/secondDeclarationReminder.tsx`](../../packages/notifications/src/mails/builders/secondDeclarationReminder.tsx) |
| **Handler éligibilité** | [`findCorrectiveSecondDeclarationPending`](../../packages/notifications/src/eligibility/queries.ts) |
| **Deadline référence** | 1ᵉʳ janvier N+1 (`DEADLINES.secondDeclaration`) |
| **Pré-requis métier** | Parcours « Actions correctives » uniquement |

## Destinataire

`declarations.declarantId → app_user.email` — celui qui a choisi le parcours d'actions correctives.

## Éligibilité (SQL)

```sql
SELECT d.siren, d.year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
WHERE d.year = {currentYear}
  AND d.cancelled_at IS NULL
  AND d.first_declaration_path_choice = 'corrective_action'
  AND d.status = 'corrective_actions_chosen'
  AND d.second_declaration_step IS NULL
  AND u.email IS NOT NULL;
```

**Dédup** : `(type, siren, year, variant=d90|d30)`.

## Sujet

```
Egapro - Rappel : votre seconde déclaration est attendue dans {daysRemaining} jours
```

## Pré-en-tête (preview)

> Il vous reste {daysRemaining} jours pour déposer votre seconde déclaration au titre des actions correctives.

## Corps

> **Bonjour,**
>
> Votre seconde déclaration au titre des actions correctives n'a pas encore été déposée. Il vous reste {daysRemaining} jours pour la finaliser.
>
> Conformément à la réglementation, vous avez engagé un parcours d'actions correctives à la suite d'un écart de rémunération supérieur ou égal à 5 %.
>
> La seconde déclaration doit retracer les actions correctives mises en œuvre par votre entreprise et leur impact sur les écarts constatés.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de déposer votre seconde déclaration.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ janvier {year+1}`. Sans dépôt avant cette date, votre déclaration sera marquée comme non conforme.
>
> [**Déposer ma seconde déclaration**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Codes BRD **MSD3** + **MSD30** — Phase 2 chemin 4b-A (Actions correctives).
