# `joint_evaluation_reminder` — MG_E1 · Rappel dépôt rapport d'évaluation conjointe

| | |
|---|---|
| **Type pg-boss** | `joint_evaluation_reminder` |
| **Schedule** | `0 8 1 8 *` (1ᵉʳ août 08:00) |
| **Builder** | [`mails/builders/jointEvaluationReminder.tsx`](../../packages/notifications/src/mails/builders/jointEvaluationReminder.tsx) |
| **Handler éligibilité** | [`findJointEvaluationPending`](../../packages/notifications/src/eligibility/queries.ts) |
| **Deadline référence** | 1ᵉʳ septembre Y (`DEADLINES.jointEvaluationReport`) |
| **Pré-requis métier** | Parcours « Évaluation conjointe » (Round 1 ou Round 2 = `corrective → joint_eval`) |

## Destinataire

`declarations.declarantId → app_user.email` — celui qui a choisi le parcours d'évaluation conjointe (lors du round courant).

## Éligibilité (SQL — couvre Round 1 et Round 2)

```sql
SELECT d.siren, d.year, u.email, d.declarant_id
FROM app_declaration d
JOIN app_user u ON u.id = d.declarant_id
WHERE d.year = {currentYear}
  AND d.cancelled_at IS NULL
  AND u.email IS NOT NULL
  AND COALESCE(d.second_declaration_path_choice, d.first_declaration_path_choice) = 'joint_evaluation'
  AND NOT EXISTS (
      SELECT 1 FROM app_file f
      WHERE f.declaration_id = d.id AND f.type = 'joint_evaluation'
  );
```

> **Note** : Le `COALESCE` priorise le choix Round 2 (s'il existe) sur le choix Round 1. Cas typique : Round 1 = `corrective_action` → Round 2 = `joint_evaluation`.

## Sujet

```
Egapro - Rappel : dépôt du rapport d'évaluation conjointe
```

## Pré-en-tête (preview)

> Le rapport d'évaluation conjointe avec votre CSE n'a pas encore été téléversé sur la plateforme.

## Corps

> **Bonjour,**
>
> Le rapport d'évaluation conjointe mené avec votre CSE n'a pas encore été téléversé sur la plateforme Egapro.
>
> Conformément à la réglementation, l'évaluation conjointe doit retracer les mesures correctives décidées en commun avec le CSE pour réduire les écarts de rémunération constatés.
>
> Le rapport doit lister précisément ces mesures correctives ainsi que leur calendrier de mise en œuvre.
>
> Nous vous invitons à vous rendre sur le portail Egapro afin de téléverser ce rapport.
>
> Le dépôt doit intervenir au plus tard le `1ᵉʳ septembre {year}`.
>
> [**Téléverser le rapport**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **MG_E1** — Phase 2 chemin 4b-E (Évaluation conjointe).
