# Inventaire des tests — src/modules/profile

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 2 fichier(s), 39 test(s)._

- **`src/modules/profile/__tests__/phone.test.ts`** — 22 test(s)
  - formatPhone > formats a French canonical number as +33 X XX XX XX XX
  - formatPhone > formats a non-French international number with default 2-digit CC
  - formatPhone > returns the input unchanged for a non-canonical value
  - formatPhoneInput > formats a French international number as +33 X XX XX XX XX
  - formatPhoneInput > formats a non-French international number with pair groups
  - formatPhoneInput > formats partial French local input
  - formatPhoneInput > groups French local digits as pairs
  - formatPhoneInput > preserves a leading + while typing
  - formatPhoneInput > returns empty string for empty input
  - formatPhoneInput > strips disallowed characters from input
  - normalizePhone > preserves the leading +
  - normalizePhone > strips spaces, dots, and dashes
  - phoneSchema > accepts a French local number with separators
  - phoneSchema > accepts an international number
  - phoneSchema > rejects an invalid format
  - toCanonicalPhone > accepts a country code with 1 digit
  - toCanonicalPhone > accepts a country code with 3 digits (Iceland)
  - toCanonicalPhone > converts a French local number to +33 international form
  - toCanonicalPhone > keeps an international number unchanged
  - toCanonicalPhone > rejects a French local number without leading 0
  - toCanonicalPhone > rejects a number that is too short
  - toCanonicalPhone > rejects letters
- **`src/modules/profile/__tests__/ProfileModal.test.tsx`** — 17 test(s)
  - ProfileModal > calls mutation with valid phone on form submit
  - ProfileModal > clears error when form is resubmitted with valid data
  - ProfileModal > has a messages group with aria-live polite for phone field
  - ProfileModal > has proper aria-describedby on the phone input
  - ProfileModal > renders a dialog element with correct id and aria attributes
  - ProfileModal > renders the Annuler button with aria-controls for the modal
  - ProfileModal > renders the close button
  - ProfileModal > renders the description paragraph
  - ProfileModal > renders the Enregistrer and Annuler buttons
  - ProfileModal > renders the help tooltip button
  - ProfileModal > renders the modal title
  - ProfileModal > renders the phone input with label and hint
  - ProfileModal > renders the readonly Email field
  - ProfileModal > renders the readonly Nom field with label and edit icon
  - ProfileModal > renders the readonly Prénom field with label and edit icon
  - ProfileModal > shows validation error for invalid phone format
  - ProfileModal > shows validation error when submitting empty phone
