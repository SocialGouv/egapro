# Inventaire des tests — Journal d'audit

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 1 fichier(s), 10 test(s)._

- **`src/modules/audit/__tests__/actionKeys.test.ts`** — 10 test(s)
  - AUDIT_ACTIONS > maps every action key to a category
  - AUDIT_ACTIONS > maps the declaration lock state read to a sensitive read (holder PII)
  - AUDIT_ACTIONS > maps the lock-timeout admin setting update to a mutation
  - AUDIT_ACTIONS > maps the public declarations export to the export category (365-day retention)
  - AUDIT_ACTIONS > uses unique action key strings
  - public_search category > maps public referent actions to public_search
  - retention constants > CNIL recommendation: short = 6 months, long = 12 months
  - retention constants > public_search falls into the short retention bucket
  - retention constants > read_sensitive falls into the short retention bucket
  - retention constants > short retention is shorter than long retention
