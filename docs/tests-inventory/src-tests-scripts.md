# Inventaire des tests — src/__tests__/scripts

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 3 fichier(s), 33 test(s)._

- **`src/__tests__/scripts/check-journal.test.ts`** — 13 test(s)
  - check-journal.mjs script file > script file exists
  - checkJournal > returns empty array for a valid monotone journal file
  - checkJournal > returns violations for a non-monotone journal file
  - checkJournal > throws a user-friendly error when 'entries' array is missing
  - checkJournal > throws a user-friendly error when the file contains invalid JSON
  - checkJournal > throws a user-friendly error when the file does not exist
  - findMonotoneViolations > detects a later entry with a smaller 'when' than an earlier entry
  - findMonotoneViolations > detects equal 'when' values as a violation
  - findMonotoneViolations > detects the original bug #3557 scenario (idx 37 when < idx 36 when)
  - findMonotoneViolations > handles a single-entry list with no pairs to compare
  - findMonotoneViolations > reports all non-monotone pairs, not just the first
  - findMonotoneViolations > returns empty after the fix (idx 37 when = 1779271468704)
  - findMonotoneViolations > returns empty array for strictly monotone increasing entries
- **`src/__tests__/scripts/generate-mock-gip-data.test.ts`** — 9 test(s)
  - companies.json > contains no companies with fewer than 50 employees
  - companies.json > has a bucket field on every entry
  - companies.json > has all 5 buckets represented
  - companies.json > has workforce values consistent with bucket ranges
  - mock-gip-mds.csv > all 5 buckets are represented in the CSV via companies.json cross-reference
  - mock-gip-mds.csv > has at least 100 data rows (multi-bucket coverage)
  - mock-gip-mds.csv > has Effectif_RCD values matching companies.json workforce
  - mock-gip-mds.csv > has no SIREN with workforce below 50
  - mock-gip-mds.csv > is parseable and has data rows
- **`src/__tests__/scripts/generate-test-inventory.test.ts`** — 11 test(s)
  - buildInventoryFiles > is deterministic for a fixed input (idempotence at the pure layer)
  - buildInventoryFiles > renders an index with totals, date and links to one detail file per section
  - buildInventoryFiles > shows a warning banner in the index when a source is unavailable
  - buildInventoryFiles > writes the test detail (files + titles) in the per-section files
  - parsePlaywright > strips project + location, dedupes tests listed under several projects
  - parseVitest > filters interleaved noise (DB NOTICE objects, non-test files)
  - parseVitest > keeps only real test files and splits file from the describe/it chain
  - parseVitest > returns an empty list for null output (command unavailable)
  - sectionLabel > falls back to the module path for an unmapped module (never dropped)
  - sectionLabel > maps known domain prefixes to French labels
  - sectionSlug > slugifies French labels and raw fallback paths into file names
