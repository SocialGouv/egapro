# Inventaire des tests — src/modules/login

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 5 fichier(s), 35 test(s)._

- **`src/modules/login/__tests__/LoginAccordion.test.tsx`** — 6 test(s)
  - LoginAccordion > emphasizes the ProConnect button label in the first step
  - LoginAccordion > has aria-expanded set to false by default
  - LoginAccordion > has the correct DSFR accordion structure
  - LoginAccordion > links the button to the collapse content via aria-controls
  - LoginAccordion > lists the six account creation steps in order, ending with the success step
  - LoginAccordion > renders the accordion button with the correct text
- **`src/modules/login/__tests__/LoginForm.test.tsx`** — 4 test(s)
  - LoginForm > contains the no-account accordion
  - LoginForm > contains the ProConnect button
  - LoginForm > displays the description text
  - LoginForm > displays the login heading
- **`src/modules/login/__tests__/LoginPage.test.tsx`** — 6 test(s)
  - LoginPage > contains the ProConnect authentication button
  - LoginPage > displays the login heading
  - LoginPage > falls back to /mon-espace when no callbackUrl is provided
  - LoginPage > forwards callbackUrl through to ProConnect signIn
  - LoginPage > renders the decorative illustration
  - LoginPage > renders the main landmark with id content
- **`src/modules/login/__tests__/ProConnectButton.test.tsx`** — 7 test(s)
  - ProConnectButton > calls signIn with the provided callbackUrl on click
  - ProConnectButton > displays the login and brand text
  - ProConnectButton > emits a LOGIN_START analytics event on click
  - ProConnectButton > falls back to /mon-espace when no callbackUrl is provided
  - ProConnectButton > renders a button to trigger ProConnect sign-in
  - ProConnectButton > renders the info link about ProConnect
  - ProConnectButton > uses the fr-connect-group container
- **`src/modules/login/__tests__/sanitizeCallbackUrl.test.ts`** — 12 test(s)
  - sanitizeCallbackUrl > accepts the root path
  - sanitizeCallbackUrl > preserves the query string on a safe relative path
  - sanitizeCallbackUrl > rejects absolute URLs (open-redirect)
  - sanitizeCallbackUrl > rejects backslash-prefixed paths that browsers resolve as protocol-relative
  - sanitizeCallbackUrl > rejects malformed percent-encoding
  - sanitizeCallbackUrl > rejects paths that do not start with /
  - sanitizeCallbackUrl > rejects protocol-relative URLs (`//evil.com`)
  - sanitizeCallbackUrl > rejects URL-encoded backslash paths (`/%5Cevil.com`)
  - sanitizeCallbackUrl > rejects URL-encoded protocol-relative paths (`/%2F%2Fevil.com`)
  - sanitizeCallbackUrl > returns the path unchanged for a safe relative path
  - sanitizeCallbackUrl > returns undefined for an empty string
  - sanitizeCallbackUrl > returns undefined when value is undefined
