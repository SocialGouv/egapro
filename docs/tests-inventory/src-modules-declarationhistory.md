# Inventaire des tests — src/modules/declarationHistory

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 4 fichier(s), 28 test(s)._

- **`src/modules/declarationHistory/__tests__/DeclarationHistoryPage.test.tsx`** — 3 test(s)
  - DeclarationHistoryPage > renders breadcrumb with Mon espace link
  - DeclarationHistoryPage > renders the history list section
  - DeclarationHistoryPage > renders title and subtitle
- **`src/modules/declarationHistory/__tests__/eventDisplay.test.ts`** — 13 test(s)
  - getHistoryEventDisplay > all event types return a non-empty French label
  - getHistoryEventDisplay > cancel: returns non-empty label and no page link
  - getHistoryEventDisplay > cse_opinion_submit: returns non-empty label and CSE opinion link
  - getHistoryEventDisplay > demarche_complete: links to the declaration recap page
  - getHistoryEventDisplay > joint_evaluation_submit: returns non-empty label and joint evaluation link
  - getHistoryEventDisplay > path_choice: returns non-empty label and compliance path link
  - getHistoryEventDisplay > second_declaration_submit: returns non-empty label and compliance path link
  - getHistoryEventDisplay > step_change with null round: returns null page link
  - getHistoryEventDisplay > step_change with out-of-bounds round: returns null page link
  - getHistoryEventDisplay > step_change with round=0: maps to Introduction step
  - getHistoryEventDisplay > step_change with round=5: maps via STEP_TITLES and builds etape href
  - getHistoryEventDisplay > submit: returns non-empty label and recap page link
  - getHistoryEventDisplay > throws for unknown event type at runtime (exhaustive guard)
- **`src/modules/declarationHistory/__tests__/HistoryEntry.test.tsx`** — 7 test(s)
  - HistoryEntry > renders 'Système' when actor is null
  - HistoryEntry > renders actor email as name when firstName and lastName are null
  - HistoryEntry > renders actor name and email
  - HistoryEntry > renders date and time in the time element
  - HistoryEntry > renders page link for submit event
  - HistoryEntry > renders step page link for step_change event with round
  - HistoryEntry > renders the action label as plain text when the event has no page
- **`src/modules/declarationHistory/__tests__/HistoryListSection.test.tsx`** — 5 test(s)
  - HistoryListSection > does not show Voir plus when all items are loaded
  - HistoryListSection > loads more items when Voir plus is clicked
  - HistoryListSection > renders history items when data is loaded
  - HistoryListSection > shows empty state when no items and not fetching
  - HistoryListSection > shows Voir plus button when more items exist
