# `cse_opinion_receipt` — MH_* · Confirmation avis CSE

| | |
|---|---|
| **Type pg-boss** | `cse_opinion_receipt` |
| **Trigger** | Event-driven — route handler `POST /api/upload` avec `flowType === "cse_opinion"` ([`route.ts:242`](../../packages/app/src/app/api/upload/route.ts#L242)) |
| **Builder** | [`mails/builders/cseOpinionReceipt.tsx`](../../packages/notifications/src/mails/builders/cseOpinionReceipt.tsx) |
| **Pièce jointe** | — (le fichier PDF reste sur S3, non re-attaché) |
| **Renvoi manuel** | tRPC `mail.resendReceipt` avec `kind: "cseOpinion"` |
| **Pré-requis métier** | Entreprise ≥ 100 salariés avec CSE constitué |

## Destinataire

`session.user.email` — le compte ProConnect qui a téléversé l'avis.

## Sujet

```
Egapro - Réception de l'avis du CSE
```

## Pré-en-tête (preview)

> L'avis du CSE déposé pour votre déclaration des indicateurs a bien été pris en compte.

## Corps

> **Bonjour,**
>
> L'avis du CSE déposé pour votre déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes a bien été pris en compte.
>
> Conformément à la réglementation, les entreprises d'au moins 100 salariés sont tenues de consulter leur CSE sur les indicateurs publiés et de déposer cet avis sur la plateforme Egapro.
>
> Le document que vous avez transmis est conservé dans votre dossier et reste consultable depuis votre espace personnel.
>
> Vous pouvez à tout moment consulter votre dossier depuis le portail Egapro.
>
> [**Consulter mon dossier**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **MH_B / MH_C / MH_J / MH_A / MH_E** (selon chemin) — voir [`parcours-utilisateurs.md`](../parcours-utilisateurs.md), Phase 2 (toutes branches CSE).
