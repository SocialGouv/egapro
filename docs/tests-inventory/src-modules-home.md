# Inventaire des tests — src/modules/home

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 6 fichier(s), 33 test(s)._

- **`src/modules/home/__tests__/HomeHero.test.tsx`** — 6 test(s)
  - HomeHero > renders the deadline info
  - HomeHero > renders the declaration CTA link
  - HomeHero > renders the info about companies with 50+ employees
  - HomeHero > renders the main heading
  - HomeHero > renders the platform description
  - HomeHero > uses a semantic section element
- **`src/modules/home/__tests__/HomeNotice.test.tsx`** — 6 test(s)
  - HomeNotice > has the fr-notice--info class
  - HomeNotice > hides the banner when the dismiss button is clicked
  - HomeNotice > renders the 'En savoir plus' link
  - HomeNotice > renders the banner title
  - HomeNotice > renders the description text
  - HomeNotice > renders the dismiss button
- **`src/modules/home/__tests__/HomePage.test.tsx`** — 5 test(s)
  - HomePage > has #content id on main for skip links
  - HomePage > renders the hero section heading
  - HomePage > renders the notice banner
  - HomePage > renders the search section
  - HomePage > renders the three placeholder sections
- **`src/modules/home/__tests__/HomePlaceholder.test.tsx`** — 3 test(s)
  - HomePlaceholder > applies the placeholder style class
  - HomePlaceholder > displays the placeholder description
  - HomePlaceholder > displays the placeholder title
- **`src/modules/home/__tests__/HomeSearch.test.tsx`** — 10 test(s)
  - HomeSearch > has the correct name attribute on the search input
  - HomeSearch > mentions the remuneration indicators
  - HomeSearch > mentions the representation indicators
  - HomeSearch > renders the department select
  - HomeSearch > renders the region select
  - HomeSearch > renders the search button
  - HomeSearch > renders the section heading
  - HomeSearch > renders the sector select
  - HomeSearch > renders the SIREN/name search input
  - HomeSearch > submits the form to the index search results page
- **`src/modules/home/__tests__/HomeSearchForm.test.tsx`** — 3 test(s)
  - HomeSearchForm tracking > emits a SEARCH_SUBMIT event naming only the facets used
  - HomeSearchForm tracking > never leaks the raw search query (no PII in the payload)
  - HomeSearchForm tracking > reports 'empty' when no facet is filled
