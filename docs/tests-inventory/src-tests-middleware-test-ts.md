# Inventaire des tests — src/__tests__/middleware.test.ts

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 1 fichier(s), 26 test(s)._

- **`src/__tests__/middleware.test.ts`** — 26 test(s)
  - admin middleware > forces re-login when the token has no isAdmin field (pre-PR token)
  - admin middleware > lets admin users through
  - admin middleware > preserves the query string in the callbackUrl
  - admin middleware > redirects non-admin users to /mon-espace
  - admin middleware > redirects to /login with callbackUrl when there is no token
  - gateway middleware (/api/v1/*) > does not call getToken on /api/v1/* (avoids unnecessary JWT parsing)
  - gateway middleware (/api/v1/*) > lets the request through when X-Gateway-Forwarded is absent (session branch)
  - gateway middleware (/api/v1/*) > lets the request through when X-Gateway-Forwarded matches the shared secret
  - gateway middleware (/api/v1/*) > rejects a header value longer than the secret
  - gateway middleware (/api/v1/*) > rejects a header value that shares only the prefix of the secret
  - gateway middleware (/api/v1/*) > returns 403 when X-Gateway-Forwarded is present but empty
  - gateway middleware (/api/v1/*) > returns 403 when X-Gateway-Forwarded is present but wrong
  - search redirect (/api/search → /api/public/declarations) > does not call getToken on /api/search (no JWT parsing on a public redirect)
  - search redirect (/api/search → /api/public/declarations) > preserves the passthrough query params unchanged
  - search redirect (/api/search → /api/public/declarations) > redirects to /api/public/declarations with a 308 status
  - search redirect (/api/search → /api/public/declarations) > redirects with no query string when none is provided
  - search redirect (/api/search → /api/public/declarations) > renames section_naf to naf
  - search redirect (/api/search → /api/public/declarations) > renames section_naf while keeping the other params (S7)
  - session middleware (session-gated user routes) > does not enforce isAdmin on session-gated routes
  - session middleware (session-gated user routes) > lets an authenticated user through on /avis-cse/2024/123456789
  - session middleware (session-gated user routes) > lets an authenticated user through on /declaration-remuneration/commencer
  - session middleware (session-gated user routes) > lets an authenticated user through on /mon-espace/historique/123456789/2024
  - session middleware (session-gated user routes) > preserves the query string when redirecting an unauthenticated user
  - session middleware (session-gated user routes) > redirects an unauthenticated user from /avis-cse/2024/123456789 to /login with callbackUrl
  - session middleware (session-gated user routes) > redirects an unauthenticated user from /declaration-remuneration/commencer to /login with callbackUrl
  - session middleware (session-gated user routes) > redirects an unauthenticated user from /mon-espace/historique/123456789/2024 to /login with callbackUrl
