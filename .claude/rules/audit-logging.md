---
paths:
  - "packages/app/src/server/api/routers/**/*.ts"
  - "packages/app/src/app/api/**/route.ts"
  - "packages/app/src/server/auth/**/*.ts"
  - "packages/app/src/server/audit/**/*.ts"
  - "packages/app/src/modules/audit/**/*.ts"
---

# Audit logging

Every user-facing action that falls into one of the audit categories **must**
produce a row in `audit.action_log`. Adding a new action without wiring the
audit log is a bug, not a missing enhancement.

Infrastructure lives in `~/modules/audit` + `~/server/audit` — see issue
SocialGouv/egapro#3174 for the design notes.

---

## When a new audit entry is REQUIRED

### 1. New tRPC mutation (any procedure that writes)

Every mutation is auto-logged by the `auditMiddleware` in `~/server/api/trpc.ts`
**if and only if** its path is listed in
`~/server/audit/trpcMiddleware.ts::PROCEDURE_TO_ACTION`.

Adding a new mutation means adding **three** things:

```ts
// 1. New action key in ~/modules/audit/shared/actionKeys.ts
export const AUDIT_ACTIONS = {
  // ...
  CSE_OPINION_REPLACE: "cse_opinion.replace",  // ← new
} as const;

// 2. Category mapping in the same file
export const AUDIT_ACTION_CATEGORIES = {
  // ...
  [AUDIT_ACTIONS.CSE_OPINION_REPLACE]: "mutation",  // ← new
};

// 3. Path → action mapping in ~/server/audit/trpcMiddleware.ts
const PROCEDURE_TO_ACTION = {
  // ...
  "cseOpinion.replace": AUDIT_ACTIONS.CSE_OPINION_REPLACE,  // ← new
};
```

If you add the mutation and forget any of these three, the action will be
silently dropped at runtime. The structural auditor enforces this.

### 2. New tRPC query that exposes sensitive data

A query is audited **only** if it is explicitly added to `PROCEDURE_TO_ACTION`.
The default is **not logged** — noisy queries (`company.list`,
`declaration.getOrCreate` prefill flags, etc.) stay out.

A query **must** be added when it returns any of:

- Personal data (`profile.get`, anything that exposes an email / phone / name)
- GIP MDS pre-filled data (effectifs, remuneration breakdowns)
- Sanction status, compliance history, CSE opinions attached to a SIREN
- Any payload that would be PII or business-sensitive if leaked

Same 3-step recipe as mutations, but use `"read_sensitive"` as the category.

### 3. New Next.js Route Handler (`src/app/api/**/route.ts`)

Wrap the handler with `withAuditedRoute` from `~/server/audit/withAuditedRoute`:

```ts
import { AUDIT_ACTIONS } from "~/modules/audit";
import { cachedAuth } from "~/server/audit/cachedAuth";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";

export const GET = withAuditedRoute(
  {
    action: AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD,
    resolveContext: async (request) => {
      const session = await cachedAuth(request);  // ← memoised auth()
      return {
        userId: session?.user?.id ?? null,
        userEmail: session?.user?.email ?? null,
        siren: session?.user?.siret
          ? extractSiren(session.user.siret)
          : null,
        metadata: { /* non-PII query params, file names, etc. */ },
      };
    },
  },
  async (request) => {
    const session = await cachedAuth(request);  // ← same call, no extra cost
    // ... business logic ...
  },
);
```

Rules:

- **Always** use `cachedAuth(request)` (never `auth()` directly) if the route
  calls it from both `resolveContext` and the handler body. `cachedAuth`
  dedupes via a `WeakMap<Request, Promise<Session>>` so the JWT is parsed
  once per request.
- `resolveContext` must be **cheap** and **fail-safe**. Wrap any risky call
  (DB lookup, third-party API) in try/catch and return partial context. The
  wrapper already catches `resolveContext` errors, but you should not rely on
  it for predictable fields.
- The wrapper detects non-2xx responses as `failure` automatically — no need
  to duplicate status logic.

Add the matching `AUDIT_ACTIONS.*` entry and its category mapping in
`~/modules/audit/shared/actionKeys.ts`.

### 4. New NextAuth event / auth flow

Use `logAction` directly from `~/server/audit/log`, inside the NextAuth events
or logger hooks:

```ts
events: {
  async signIn({ user }) {
    const requestContext = await safeRequestContext();
    void logAction({
      action: AUDIT_ACTIONS.AUTH_LOGIN,
      status: "success",
      userId: user.id,
      userEmail: user.email,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
  },
},
```

Notes:

- `logger.error` (used for failed logins) MUST stay synchronous — NextAuth v4
  does not await it. Fire the async work inside a `void (async () => {...})()`
  IIFE.
- For login failures, pass metadata through `buildAuthErrorMessage()` so OAuth
  tokens / state / code_verifier are stripped from the log line.

### 5. New cron-triggered / system action

Use `logAction` directly with category `system` inside the route handler or
helper that the cron calls. See `/api/audit/cleanup/route.ts` for the canonical
pattern (success + failure self-audit with metadata).

---

## When an audit entry is NOT required

- Any query that returns **only** already-public data (list of SIRENs, search
  results) — explicitly excluded from `PROCEDURE_TO_ACTION`.
- Pure navigation / static pages.
- Health checks (`/api/healthz`).
- tRPC procedures called **only** by other audited procedures in the same
  request — they would generate duplicate rows.

If in doubt, **audit it**. A false positive is cheap (one row to ignore), a
false negative is a compliance gap.

---

## Metadata sanitisation

`logAction` accepts a free-form `metadata` jsonb field. The tRPC middleware
runs every input through `sanitizeMetadata()` which recursively strips keys
matching the `SENSITIVE_KEYS` blocklist at any depth:

```
password, token, refresh_token, secret, client_secret, authorization,
apikey, api_key, accesskey, access_key, private_key
```

When writing to `logAction` **directly** (route handlers, auth events, cron),
the caller is responsible for sanitisation:

- Never put secrets in `metadata`
- Never put IP addresses in `metadata` — there is a dedicated `ipAddress`
  column already
- Do put business-relevant context: year, declarationId, fileName, action
  parameters

---

## Category → retention mapping (CNIL compliance)

| Category | Retention | When to use |
|---|---|---|
| `read_sensitive` | **180 days** | Lectures sensibles (GIP data, PDFs, personal data). High volume, contain IP. |
| `auth` | 365 days | Login, logout, failed login. |
| `mutation` | 365 days | Any write to business data. |
| `export` | 365 days | Data exports and third-party API consumers. |
| `system` | 365 days | Cron-triggered / admin actions. |

The cleanup cron (`/api/audit/cleanup` → `cleanupAuditLogs`) drops
`read_sensitive` rows after 180 days and everything else after 365 days. This
is enforced at the DB level; the category you choose **defines** the retention
window.

---

## Test coverage expectations

Every new action key must pass the round-trip test in
`~/modules/audit/__tests__/actionKeys.test.ts` — it iterates over
`Object.values(AUDIT_ACTIONS)` and asserts each has a category in
`AUDIT_ACTION_CATEGORIES`. Adding an action without its category mapping
fails CI immediately.

For tRPC middleware behaviour (opt-in query, metadata sanitisation,
sensitive-key stripping), extend the existing
`~/server/audit/__tests__/trpcMiddleware.test.ts`.

For `cleanup.ts` changes that touch the DB layer (new SQL predicates, new
retention categories), **add an integration test** in
`cleanup.integration.test.ts` — mocked unit tests do not execute real SQL
and miss driver-level bugs (see the `Date` → `sql\`\`` regression that
triggered the addition of `pnpm test:integration`).

---

## Checklist when touching an audited surface

Copy this into the PR description when adding a new endpoint / mutation /
sensitive read:

- [ ] `AUDIT_ACTIONS.*` constant added in `actionKeys.ts`
- [ ] Category mapped in `AUDIT_ACTION_CATEGORIES` (right retention bucket?)
- [ ] Wire-up done for the relevant surface:
  - [ ] tRPC mutation → `PROCEDURE_TO_ACTION` entry
  - [ ] tRPC sensitive query → `PROCEDURE_TO_ACTION` entry (category
        `read_sensitive`)
  - [ ] Route Handler → `withAuditedRoute(...)` wrapper + `cachedAuth`
  - [ ] Auth event → `logAction` inside NextAuth `events` / `logger`
  - [ ] System / cron → direct `logAction` call
- [ ] `metadata` does not contain secrets / IP (use the column) / PII that is
      not already in `user_email` or `siren`
- [ ] Existing unit tests still green (`actionKeys.test.ts` especially)
- [ ] Manually verified on a review app: the row actually lands in
      `audit.action_log` with the expected category / status / metadata
