# `formal_notice_joint_evaluation_submitted` — Confirmation rapport d'évaluation conjointe suite à mise en demeure

| | |
|---|---|
| **Type pg-boss** | `formal_notice_joint_evaluation_submitted` |
| **Trigger** | Event-driven — tRPC `formalNotice.submit` ([`formalNotice.ts`](../../packages/app/src/server/api/routers/formalNotice.ts)), après le téléversement du rapport par `POST /api/upload` avec `flowType === "formal_notice_joint_evaluation"`. Le mail part via `enqueueReceipt` avec `kind: "formalNoticeJointEvaluation"`. |
| **Builder** | [`mails/builders/formalNoticeJointEvaluationSubmitted.tsx`](../../packages/notifications/src/mails/builders/formalNoticeJointEvaluationSubmitted.tsx) |
| **Payload** | `{ siren, year, raisonSociale }` — aucun variant |
| **Pièce jointe** | — (le rapport reste sur S3, non re-attaché) |
| **Renvoi manuel** | Non — `mail.resendReceipt` n'accepte pas le kind `formalNoticeJointEvaluation`. |
| **Pré-requis métier** | Démarche close dans le parcours « Justification des écarts » (écart ≥ 5 %), avec un avis du CSE défavorable sur la justification ou sans CSE, et mise en demeure notifiée par la DREETS. La transmission se fait depuis le panneau de la démarche dans Mon espace (page `/declaration-remuneration/mise-en-demeure`). |

## Destinataire

`session.user.email` — le compte ProConnect qui a transmis le rapport.

## Sujet

```
Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations suite à mise en demeure
```

## Pré-en-tête (preview)

> Vous avez transmis aux services du ministre chargé du Travail le rapport de l'évaluation conjointe des rémunérations.

## Corps

> **Bonjour,**
>
> Vous avez transmis aux services du ministre chargé du Travail le rapport de l'évaluation conjointe des rémunérations pour `{year}`, établi à la suite de la mise en demeure notifiée par la DREETS, concernant l'entreprise **`{raisonSociale}`** (SIREN : `{siren}`).
>
> L'administration du travail accuse réception de cette transmission. Cet accusé de réception ne vaut pas contrôle de conformité de votre dépôt.
>
> Vous pouvez à tout moment consulter et télécharger les documents relatifs à cette démarche depuis votre espace.
>
> [**Mon espace**] → `${EGAPRO_PUBLIC_URL}/mon-espace`
> `${EGAPRO_PUBLIC_URL}/mon-espace` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Audit

- `formal_notice.submit` (catégorie `mutation`, rétention 365j) — la transmission elle-même, écrite par le middleware tRPC.
- `notification.enqueue` (catégorie `mutation`, rétention 365j) — `metadata.type = "formal_notice_joint_evaluation_submitted"`, `metadata.kind = "formalNoticeJointEvaluation"`, sans `variant`.
