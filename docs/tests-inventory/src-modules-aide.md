# Inventaire des tests — src/modules/aide

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 2 fichier(s), 18 test(s)._

- **`src/modules/aide/__tests__/AidePage.test.tsx`** — 8 test(s)
  - AidePage > has #content id on main for skip links
  - AidePage > renders external links to Legifrance with target blank
  - AidePage > renders the back link
  - AidePage > renders the breadcrumb navigation
  - AidePage > renders the deadline callout for the active campaign year
  - AidePage > renders the page heading
  - AidePage > renders the textes de référence section
  - AidePage > renders the three resource cards
- **`src/modules/aide/__tests__/ContactPage.test.tsx`** — 10 test(s)
  - ContactPage > copies the email to clipboard on button click
  - ContactPage > displays the contact email address
  - ContactPage > has #content id on main for skip links
  - ContactPage > renders a link to the public referents search page
  - ContactPage > renders the back link to aide page with explicit aria-label
  - ContactPage > renders the breadcrumb with correct links
  - ContactPage > renders the copy button
  - ContactPage > renders the download link for regional referents
  - ContactPage > renders the page heading
  - ContactPage > shows error state when clipboard API fails
