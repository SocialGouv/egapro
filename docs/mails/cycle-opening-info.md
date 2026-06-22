# `cycle_opening_info` — MA · Info ouverture cycle

| | |
|---|---|
| **Type pg-boss** | `cycle_opening_info` |
| **Trigger** | Schedule cron `0 8 1 3 *` (Europe/Paris) — chaque 1er mars à 08:00 |
| **Builder** | [`mails/builders/cycleOpeningInfo.tsx`](../../packages/notifications/src/mails/builders/cycleOpeningInfo.tsx) |
| **Handler éligibilité** | [`findOpenCycleRecipients`](../../packages/notifications/src/eligibility/queries.ts) |
| **Schedule** | [`reminder-cycle-opening-info`](../../packages/notifications/src/schedules/definitions.ts) |
| **Pré-requis** | `year >= 2028` (pas envoyé en 2027 — première année V2, pas de cohorte précédente à notifier) |

## Destinataire

`declarations.declarantId → app_user.email` du **cycle Y-1** (le déclarant de l'année précédente).

## Éligibilité (SQL)

```sql
SELECT d.siren, {year} AS year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
JOIN app_company c ON c.siren = d.siren
WHERE d.year = {year - 1}
  AND d.cancelled_at IS NULL
  AND d.status IN ('demarche_completed', 'awaiting_cse_opinion')
  AND c.workforce >= 50
  AND u.email IS NOT NULL;
```

## Sujet

```
Egapro - Ouverture de la période de déclaration des indicateurs Egapro
```

## Pré-en-tête (preview)

> La période de déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes est désormais ouverte.

## Corps

> **Bonjour,**
>
> La période de déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes est désormais ouverte.
>
> Conformément à la réglementation, votre entreprise se doit de déclarer les indicateurs relatifs aux écarts de rémunération.
>
> Votre déclaration est préremplie avec les données connues de l'administration pour les six premiers indicateurs de rémunération, issues de la DSN.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de vérifier ces informations, de les modifier si nécessaire, et de compléter le 7ᵉ indicateur pour les entreprises concernées.
>
> La déclaration est ouverte jusqu'au `1ᵉʳ juin {year}`. Nous vous remercions de bien vouloir la finaliser dans ce délai.
>
> [**Commencer ma déclaration**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence Figma

Mock de référence pour les 11 builders : [`9564-114784`](https://www.figma.com/design/axsrSDEVqsrFvHdWrZJIkQ/-Refonte--Egapro?node-id=9564-114784).

## Référence flowchart

Code BRD **MA** — apparaît dans les flowcharts 2028, 2029, 2030 (pas 2027).
