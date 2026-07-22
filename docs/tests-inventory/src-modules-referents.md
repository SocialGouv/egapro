# Inventaire des tests — src/modules/referents

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 5 fichier(s), 42 test(s)._

- **`src/modules/referents/__tests__/PublicReferentDetail.test.tsx`** — 11 test(s)
  - PublicReferentDetail > does not render substitute block when substituteName is null
  - PublicReferentDetail > does not show the principal badge when principal is false
  - PublicReferentDetail > falls back to region/county code if the label is unknown
  - PublicReferentDetail > main has id=content for skip-links
  - PublicReferentDetail > renders a back link to the search page
  - PublicReferentDetail > renders a URL contact as an external link with NewTabNotice
  - PublicReferentDetail > renders an email contact as a mailto link
  - PublicReferentDetail > renders gracefully when the referent name is a region label (e.g. PACA)
  - PublicReferentDetail > renders name and region/département
  - PublicReferentDetail > renders substitute block when substituteName is provided
  - PublicReferentDetail > shows the principal badge when principal is true
- **`src/modules/referents/__tests__/PublicReferentList.test.tsx`** — 5 test(s)
  - PublicReferentList > renders a link to the detail page for each referent (no contact shown)
  - PublicReferentList > renders an empty state when no rows
  - PublicReferentList > renders one <li> per referent with name and region
  - PublicReferentList > renders the département label only when county is provided
  - PublicReferentList > renders the principal badge only when principal is true
- **`src/modules/referents/__tests__/PublicReferentsPage.test.tsx`** — 10 test(s)
  - PublicReferentsPage > does not call the search API when no filter is set
  - PublicReferentsPage > does not render pagination when there is only one page
  - PublicReferentsPage > enables the search API when at least one filter is set
  - PublicReferentsPage > renders a list of referents when data is returned
  - PublicReferentsPage > renders pagination when there is more than one page
  - PublicReferentsPage > renders the error alert when the query fails
  - PublicReferentsPage > renders the search form
  - PublicReferentsPage > renders title and intro paragraph
  - PublicReferentsPage > shows a loading state when data is not yet available
  - PublicReferentsPage > shows empty state when filter yields no results
- **`src/modules/referents/__tests__/PublicReferentsSearchForm.test.tsx`** — 5 test(s)
  - PublicReferentsSearchForm > disables the county select until a region is chosen
  - PublicReferentsSearchForm > enables the county select when a region is chosen and filters options
  - PublicReferentsSearchForm > pushes to /referents with URL params on submit
  - PublicReferentsSearchForm > renders region and county selects only
  - PublicReferentsSearchForm > resets form and navigates to /referents on reset
- **`src/modules/referents/__tests__/schemas.test.ts`** — 11 test(s)
  - publicReferentIdSchema > accepts a valid uuid
  - publicReferentIdSchema > rejects a non-uuid string
  - publicSearchReferentsFormSchema > accepts free-form strings (form-level, server re-validates)
  - publicSearchReferentsFormSchema > is permissive on missing fields (form initial state)
  - publicSearchReferentsSchema > accepts a valid region/county code
  - publicSearchReferentsSchema > accepts empty-string region/county (HTML select sends empty string)
  - publicSearchReferentsSchema > applies default page=1 and default pageSize when omitted
  - publicSearchReferentsSchema > coerces string pagination values (they come from URL params)
  - publicSearchReferentsSchema > rejects an unknown region code
  - publicSearchReferentsSchema > rejects pageSize above 100 to prevent scraping
  - publicSearchReferentsSchema > rejects pageSize below 10
