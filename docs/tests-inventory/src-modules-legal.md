# Inventaire des tests — src/modules/legal

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 3 fichier(s), 14 test(s)._

- **`src/modules/legal/__tests__/MatomoOptOut.test.tsx`** — 2 test(s)
  - MatomoOptOut > embeds the Matomo opt-out iframe pointing at the configured instance
  - MatomoOptOut > renders nothing when Matomo is not configured
- **`src/modules/legal/__tests__/robots.test.ts`** — 5 test(s)
  - buildRobots > allows all user agents on the root
  - buildRobots > blocks all indexing and omits the sitemap outside of prod
  - buildRobots > disallows authenticated, internal and dynamic areas
  - buildRobots > normalises the sitemap URL to the base origin
  - buildRobots > references the sitemap URL
- **`src/modules/legal/__tests__/sitemap.test.ts`** — 7 test(s)
  - buildSitemap > excludes authenticated, internal and dynamic routes
  - buildSitemap > includes the home page as the root origin without trailing slash
  - buildSitemap > lists every public route required by issue #3233
  - buildSitemap > normalises a base URL with a trailing path to the origin
  - buildSitemap > returns absolute URLs for every public route
  - buildSitemap > returns no entries outside of prod
  - buildSitemap > stamps every entry with the provided timestamp
