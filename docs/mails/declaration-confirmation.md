# `declaration_confirmation` — MD · Confirmation 1ère déclaration

| | |
|---|---|
| **Type pg-boss** | `declaration_confirmation` |
| **Trigger** | Event-driven — mutation tRPC `declaration.submit` ([`declaration.ts:608`](../../packages/app/src/server/api/routers/declaration.ts#L608)) |
| **Builder** | [`mails/builders/declarationConfirmation.tsx`](../../packages/notifications/src/mails/builders/declarationConfirmation.tsx) |
| **Pièce jointe** | PDF récapitulatif (généré par `buildDeclarationAttachments` côté app) |
| **Renvoi manuel** | tRPC `mail.resendReceipt` avec `kind: "declaration"` |

## Destinataire

`session.user.email` — le compte ProConnect qui a déclenché `declaration.submit`.

## Sujet

```
Egapro - Accusé de réception de votre déclaration des indicateurs
```

## Pré-en-tête (preview)

> Votre déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes a bien été enregistrée.

## Corps

> **Bonjour,**
>
> Votre déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes a bien été enregistrée.
>
> Conformément à la réglementation, votre entreprise satisfait à l'obligation annuelle de déclaration des indicateurs relatifs aux écarts de rémunération.
>
> Le récapitulatif détaillé de votre déclaration est joint à cet e-mail au format PDF. Il reprend l'ensemble des indicateurs enregistrés ainsi que le niveau de résultat obtenu.
>
> Vous pouvez à tout moment consulter ou modifier votre déclaration depuis le portail Egapro.
>
> [**Consulter ma déclaration**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **MD** sur les flowcharts 2027-2030 — voir [`parcours-utilisateurs.md`](../parcours-utilisateurs.md), section Phase 1 commune (50+).
