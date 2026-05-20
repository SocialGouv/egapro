# `next_cycle_handover` — MI_* · Bascule cycle suivant

| | |
|---|---|
| **Type pg-boss** | `next_cycle_handover` |
| **Schedule** | `0 8 2 3 *` (2 mars N+1 à 08:00, lendemain de la deadline finale) |
| **Builder** | [`mails/builders/nextCycleHandover.tsx`](../../packages/notifications/src/mails/builders/nextCycleHandover.tsx) |
| **Handler éligibilité** | [`findCompletedPreviousCycle`](../../packages/notifications/src/eligibility/queries.ts) |
| **Pré-requis métier** | Déclaration `status = 'demarche_completed'` du cycle Y-1 |

## Destinataire

`declarations.declarantId → app_user.email` du **cycle Y-1**.

## Éligibilité (SQL)

```sql
SELECT d.siren, d.year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
WHERE d.year = {previousYear}
  AND d.cancelled_at IS NULL
  AND d.status = 'demarche_completed'
  AND u.email IS NOT NULL;
```

**Dédup** : clé `(type, siren, year=previousYear)` — la clé porte sur l'année du cycle clôturé, pas sur l'année courante, ce qui évite tout doublon entre deux ticks proches.

## Sujet

```
Egapro - Clôture de votre déclaration et ouverture du prochain cycle
```

## Pré-en-tête (preview)

> Votre déclaration {previousYear} est clôturée. La prochaine campagne {nextYear} ouvrira le 1ᵉʳ mars {nextYear}.

## Corps

> **Bonjour,**
>
> Votre déclaration des indicateurs au titre de l'année {previousYear} est désormais clôturée.
>
> Conformément à la réglementation, votre entreprise est tenue de déclarer chaque année les indicateurs relatifs aux écarts de rémunération.
>
> La prochaine campagne, au titre de l'année {nextYear}, sera préremplie avec les données connues de l'administration pour les six premiers indicateurs de rémunération, issues de la DSN.
>
> Nous vous invitons à vous rendre sur le portail Egapro dès l'ouverture de la nouvelle campagne pour vérifier ces informations, les modifier si nécessaire, et compléter le 7ᵉ indicateur pour les entreprises concernées.
>
> La prochaine campagne ouvrira le `1ᵉʳ mars {nextYear}`.
>
> [**Accéder à mon espace**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **MI_*** (selon chemin : MI_50 / MI_B / MI_C / MI_J / MI_A / MI_E) — terminal de chaque flowchart annuel.
