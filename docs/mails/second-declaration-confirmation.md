# `second_declaration_confirmation` — MSDc · Confirmation 2e déclaration

| | |
|---|---|
| **Type pg-boss** | `second_declaration_confirmation` |
| **Trigger** | Event-driven — mutation tRPC `declaration.submitSecondDeclaration` ([`declaration.ts:747`](../../packages/app/src/server/api/routers/declaration.ts#L747)) |
| **Builder** | [`mails/builders/secondDeclarationConfirmation.tsx`](../../packages/notifications/src/mails/builders/secondDeclarationConfirmation.tsx) |
| **Pièce jointe** | PDF récapitulatif de la correction (généré par `buildSecondDeclarationAttachments` côté app) |
| **Renvoi manuel** | tRPC `mail.resendReceipt` avec `kind: "secondDeclaration"` |
| **Pré-requis métier** | Parcours « Actions correctives » uniquement (`first_declaration_path_choice = 'corrective_action'`) |

## Destinataire

`session.user.email` — le compte ProConnect qui a déclenché la mutation.

## Sujet

```
Egapro - Accusé de réception de votre seconde déclaration
```

## Pré-en-tête (preview)

> Votre seconde déclaration au titre des actions correctives a bien été enregistrée.

## Corps

> **Bonjour,**
>
> Votre seconde déclaration au titre des actions correctives a bien été enregistrée.
>
> Conformément à la réglementation, dès lors que l'écart de rémunération constaté est supérieur ou égal à 5 %, votre entreprise doit déposer une seconde déclaration retraçant les actions correctives mises en œuvre.
>
> Le récapitulatif détaillé de votre seconde déclaration est joint à cet e-mail au format PDF.
>
> Vous pouvez à tout moment consulter votre déclaration depuis le portail Egapro.
>
> [**Consulter ma déclaration**] → `${EGAPRO_PUBLIC_URL}/connexion`
> `${EGAPRO_PUBLIC_URL}/connexion` *(lien visible sous le bouton, en bleu souligné)*
>
> Pour tout renseignement, vous pouvez contacter votre référent égalité professionnelle femmes-hommes au sein de votre DREETS en répondant à ce message.
>
> Cordialement,
> **Le ministère chargé du travail**

## Référence flowchart

Code BRD **MSDc** — voir [`parcours-utilisateurs.md`](../parcours-utilisateurs.md), Phase 2 chemin 4b-A (Actions correctives).
