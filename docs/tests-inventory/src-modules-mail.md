# Inventaire des tests — src/modules/mail

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 2 fichier(s), 33 test(s)._

- **`src/modules/mail/__tests__/enqueueReceipt.test.ts`** — 21 test(s)
  - enqueueReceipt — variant derivation > falls back to a neutral context and the siren as raisonSociale when no declaration and no company are found
  - enqueueReceipt — variant derivation > falls back to the siren as raisonSociale when the company row has a null name
  - enqueueReceipt — variant derivation > selects completed for a joint evaluation with neither a second declaration nor a required CSE
  - enqueueReceipt — variant derivation > selects cse_first_and_second for a joint evaluation when a second declaration exists
  - enqueueReceipt — variant derivation > selects cse_to_deposit for a declaration when the CSE is required and there is no gap
  - enqueueReceipt — variant derivation > selects cse_to_deposit for a joint evaluation when the CSE is required without a second declaration
  - enqueueReceipt — variant derivation > selects first_and_second for a cse opinion receipt when a second declaration exists
  - enqueueReceipt — variant derivation > selects path_to_select and attaches the compliance deadline when a compliance path was chosen
  - enqueueReceipt — variant derivation > selects single for a cse opinion receipt with no gap and a single declaration
  - enqueueReceipt — variant derivation > selects with_gap for a cse opinion receipt when there is a gap for a single declaration
  - enqueueReceipt — variant derivation > treats an awaiting_compliance_path_choice status as a gap above the threshold
  - enqueueReceipt — variant derivation > treats an awaiting_revision_choice status as a gap above the threshold
  - enqueueReceipt > enqueues a declaration confirmation with PDF attachments and logs success
  - enqueueReceipt > logs failure and swallows the exception when attachment build throws
  - enqueueReceipt > logs failure with a generic message when a non-Error value is thrown
  - enqueueReceipt > logs failure with errorMessage when publisher returns error
  - enqueueReceipt > logs failure with queue_unavailable when publisher cannot reach the queue
  - enqueueReceipt > maps cseOpinion to cse_opinion_receipt without attachments
  - enqueueReceipt > maps jointEvaluation to joint_evaluation_submitted without attachments
  - enqueueReceipt > maps secondDeclaration to second_declaration_confirmation
  - enqueueReceipt > passes a null userId through when the session has no user id
- **`src/modules/mail/__tests__/sendRules.test.ts`** — 12 test(s)
  - selectCseOpinionReceiptVariant > returns first_and_second even when the gap is above the threshold (both declarations take priority)
  - selectCseOpinionReceiptVariant > returns first_and_second when the opinion covers both declarations
  - selectCseOpinionReceiptVariant > returns single when there is no gap and a single declaration
  - selectCseOpinionReceiptVariant > returns with_gap when the gap is above the threshold for a single declaration
  - selectDeclarationConfirmationVariant > returns completed when there is no gap and no CSE is required
  - selectDeclarationConfirmationVariant > returns cse_to_deposit when there is no gap but a CSE is required
  - selectDeclarationConfirmationVariant > returns path_to_select even when a CSE is required (gap takes priority)
  - selectDeclarationConfirmationVariant > returns path_to_select when the gap is above the threshold
  - selectJointEvaluationSubmittedVariant > returns completed when there is neither a second declaration nor an expected CSE opinion
  - selectJointEvaluationSubmittedVariant > returns cse_first_and_second even when a CSE opinion is expected (second declaration takes priority)
  - selectJointEvaluationSubmittedVariant > returns cse_first_and_second when a second declaration exists
  - selectJointEvaluationSubmittedVariant > returns cse_to_deposit when a CSE opinion is expected without a second declaration
