# `joint_evaluation_submitted` — M_PE2 · Confirmation rapport d'évaluation conjointe

| | |
|---|---|
| **Type pg-boss** | `joint_evaluation_submitted` |
| **Trigger** | Event-driven — route handler `POST /api/upload` avec `flowType === "joint_evaluation"` ([`route.ts:256`](../../packages/app/src/app/api/upload/route.ts#L256)) |
| **Builder** | [`mails/builders/jointEvaluationSubmitted.tsx`](../../packages/notifications/src/mails/builders/jointEvaluationSubmitted.tsx) |
| **Pièce jointe** | — |
| **Renvoi manuel** | Non — l'endpoint `mail.resendReceipt` ne couvre que les 3 kinds gérés par `enqueueReceipt`. À renvoyer manuellement via un nouvel upload si besoin. |
| **Pré-requis métier** | Parcours « Évaluation conjointe » (`first_declaration_path_choice = 'joint_evaluation'`) ou parcours 2e round corrective → joint_evaluation |

## Destinataire

`session.user.email` — le compte ProConnect qui a téléversé le rapport.

## Sujet

```
Egapro - Réception du rapport d'évaluation conjointe
```

## Pré-en-tête (preview)

> Le rapport d'évaluation conjointe déposé pour votre entreprise a bien été pris en compte.

## Corps

> **Bonjour,**
>
> Le rapport d'évaluation conjointe déposé pour votre entreprise a bien été pris en compte.
>
> Conformément à la réglementation, l'évaluation conjointe menée avec le CSE permet de retracer les mesures correctives décidées en commun pour réduire les écarts de rémunération constatés.
>
> Prochaine étape : votre CSE doit désormais rendre son avis sur le rapport déposé. Cet avis devra être téléversé sur la plateforme avant la date limite affichée dans votre espace personnel.
>
> Vous pouvez à tout moment consulter la suite de votre parcours depuis le portail Egapro.
>
> [**Voir la suite du parcours**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **M_PE2** — voir [`parcours-utilisateurs.md`](../parcours-utilisateurs.md), Phase 2 chemin 4b-E (Évaluation conjointe).
