# Inventaire des tests — src/modules/error

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 5 fichier(s), 26 test(s)._

- **`src/modules/error/__tests__/ErrorArtwork.test.tsx`** — 3 test(s)
  - ErrorArtwork > references the ovoid background SVG
  - ErrorArtwork > references the technical-error pictogram SVG
  - ErrorArtwork > renders a decorative SVG with DSFR artwork classes
- **`src/modules/error/__tests__/ErrorLayout.test.tsx`** — 4 test(s)
  - ErrorLayout > renders children in the content column
  - ErrorLayout > renders the DSFR artwork illustration as decorative
  - ErrorLayout > renders the main landmark with skip-link target
  - ErrorLayout > uses the correct illustration column classes from DSFR template
- **`src/modules/error/__tests__/ErrorPage.test.tsx`** — 6 test(s)
  - ErrorPage > displays the 500 title
  - ErrorPage > displays the apology text
  - ErrorPage > displays the error code with mention grey color
  - ErrorPage > displays the retry guidance
  - ErrorPage > does not render any action button
  - ErrorPage > renders the main landmark with skip-link target
- **`src/modules/error/__tests__/MaintenancePage.test.tsx`** — 7 test(s)
  - MaintenancePage > displays the 503 title
  - MaintenancePage > displays the error code
  - MaintenancePage > displays the retry guidance
  - MaintenancePage > displays the unavailability explanation
  - MaintenancePage > does not render any action button
  - MaintenancePage > renders the DSFR artwork illustration as decorative
  - MaintenancePage > renders the main landmark with skip-link target
- **`src/modules/error/__tests__/NotFoundPage.test.tsx`** — 6 test(s)
  - NotFoundPage > displays guidance text
  - NotFoundPage > displays the 404 title
  - NotFoundPage > displays the error code with mention grey color
  - NotFoundPage > displays the explanation text
  - NotFoundPage > renders a link to the home page
  - NotFoundPage > renders the main landmark with skip-link target
