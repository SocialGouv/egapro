---
paths:
  - "src/server/api/routers/**/*.ts"
  - "src/app/api/**/route.ts"
  - "src/server/auth/**/*.ts"
  - "src/server/audit/**/*.ts"
  - "src/modules/audit/**/*.ts"
---

# Audit logging

> Chargée sur les routeurs tRPC, les route handlers, l'auth et la couche audit. Vérifiée par `security-auditor` (A09) et `structural-auditor`.

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

Two patterns are in use, depending on whether the cron runs **inside** the app
(a tRPC procedure or Next.js route called by a CronJob container) or **out of
band** (a standalone TypeScript script invoked by the CronJob with direct DB
access — see `packages/app/scripts/audit-cleanup.ts` for the canonical
example, issue #3268).

- **In-app trigger**: use `logAction` directly with category `system` inside
  the route handler / helper that the cron calls.
- **Out-of-band script**: self-audit via a raw `INSERT INTO audit.action_log`
  statement at the end of the script (success) and in a try/catch arm
  (failure, outside the rolled-back transaction so the row survives).

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

## Route Handler coverage map (`src/app/api/**/route.ts`)

Inventory refreshed by issue #3764 — **33 route files**, every one of them
accounted for below. Re-run the inventory with:

```bash
find packages/app/src/app/api -name route.ts | sort
```

If that count changes, this table is stale: a new handler is either audited or
listed as a named exemption. The only third state this table accepts is a route
whose wiring is in flight in a named open PR, and it is listed apart from the
counts — never inside them.

### Audited through `withAuditedRoute` (15)

| Route | Action key |
|---|---|
| `declaration-lock/release` | `DECLARATION_LOCK_RELEASED` |
| `declaration-pdf` | `PDF_DECLARATION_DOWNLOAD` |
| `export/download` | `EXPORT_DOWNLOAD` |
| `export/generate` | `EXPORT_GENERATE` |
| `gip-mds/import` | `GIP_MDS_IMPORT` |
| `public/declarations` | `PUBLIC_DECLARATIONS_SEARCH` |
| `public/declarations/export` | `PUBLIC_DECLARATIONS_EXPORT` |
| `public/referents-egalite-professionnelle` | `PUBLIC_REFERENT_SEARCH` |
| `public/representations` | `PUBLIC_REPRESENTATIONS_SEARCH` |
| `public/representations/export` | `PUBLIC_REPRESENTATIONS_EXPORT` |
| `representation-pdf` | `PDF_REPRESENTATION_DOWNLOAD` |
| `transmitted-pdf` | `PDF_TRANSMITTED_DOWNLOAD` |
| `v1/export/declarations` | `EXPORT_API_DECLARATIONS` |
| `v1/export/representations` | `EXPORT_API_REPRESENTATIONS` |
| `v1/files` | `EXPORT_API_FILES` |

### Wiring in flight (1)

| Route | Action key | Status |
|---|---|---|
| `prefill-pdf` | `PDF_PREFILL_DOWNLOAD` | **pending #3189** — the handler writes no audit row at this commit |

Deliberately outside the count above. Listing it as covered would hide a real
compliance gap behind a complete-looking inventory: the next `find` would
reconcile 33/33 and stop looking. If #3189 is abandoned, or lands with another
action key, this row is what surfaces it.

The other gap — `public/referents-egalite-professionnelle`, whose action key
already existed but was only reachable through tRPC — is closed by #3764.

### Audited through a direct `logAction` call (7)

These are audited, and audited correctly — the wrapper is a convenience, not
the definition of compliance. Each one logs from inside the handler because it
needs something `resolveContext` cannot produce.

| Route | Action key(s) | Why not the wrapper |
|---|---|---|
| `auth/logout` | `AUTH_LOGOUT` | Auth flow — pattern §4 above, reads the JWT rather than a session |
| `public/declarations/[siren]` | `PUBLIC_DECLARATIONS_BY_SIREN` | Per-branch metadata (`rawSiren` on a 400, `count` on success) computed *during* the handler |
| `public/declarations/[siren]/[year]` | `PUBLIC_DECLARATIONS_BY_SIREN_YEAR` | idem, plus `rawYear` |
| `public/representations/[siren]` | `PUBLIC_REPRESENTATIONS_BY_SIREN` | idem |
| `public/representations/[siren]/[year]` | `PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR` | idem |
| `upload` | `CSE_OPINION_UPLOAD_FILE`, `JOINT_EVALUATION_UPLOAD_FILE` | The action key depends on the parsed multipart body |
| `v1/files/[fileId]` | `ADMIN_FILE_DOWNLOAD`, `USER_FILE_DOWNLOAD`, `EXPORT_API_FILES` | The action key depends on the caller's role, resolved mid-handler |

`resolveContext` runs **before** the handler, so it cannot see a result count,
a parsed body, or the branch the handler took. Converting these seven to the
wrapper would flatten one row per call and drop that metadata — a net loss of
audit fidelity. The wrapper's route-context argument (see below) removes the
*type-level* blocker; it does not make the conversion desirable.

Since #3764, `withAuditedRoute` is generic over the handler's arguments *after*
the request — a tuple, empty for a static route and `[{ params }]` for a dynamic
one — so a dynamic segment survives the wrapper and its context stays required:

```ts
type RouteContext = { params: Promise<{ siren: string }> };

export const GET = withAuditedRoute(
  {
    action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN,
    resolveContext: async (_request: Request, { params }: RouteContext) => ({
      siren: (await params).siren,
    }),
  },
  async (request: Request, { params }: RouteContext) => { /* … */ },
);
```

The tuple is not cosmetic. An optional `routeContext?: TRouteContext` widens the
parameter to `TRouteContext | undefined`, which a handler *requiring* its
context — the signature Next gives a dynamic segment — cannot accept (TS2345).
Inference reads the tuple off the handler, so neither shape needs an explicit
type argument.

### Deliberate exemptions (10)

| Route | Why no audit row |
|---|---|
| `healthz` | Liveness probe hit by Kubernetes every few seconds. Returns `"OK"`, reads nothing. Explicitly excluded above. |
| `e2e-clock` | Test-only clock override, unreachable in production. Auditing it would flood `action_log` from the E2E suite for zero compliance value. |
| `test-sentry` | Throws on purpose to exercise Sentry capture; 404s in `prod`. No user data. |
| `v1/docs` | Serves the static Swagger UI shell; 404s in `prod`. No data access. |
| `public/openapi.json` | Static OpenAPI document, identical for every caller. |
| `v1/openapi.json` | idem. |
| `gip-mds/mock` | Reads a checked-in fixture CSV (`data/mock-gip-mds.csv`) that stands in for the GIP MDS API until it exists. Fictional data only. |
| `auth/logout/callback` | Bare redirect to `/` after the ProConnect end-session round-trip. The logout itself is audited by `auth/logout`; auditing the callback would double-count. |
| `auth/[...nextauth]` | NextAuth's own catch-all. Audited one level down, in the NextAuth `events`/`logger` hooks (pattern §4) — wrapping the handler would duplicate every row. |
| `trpc/[trpc]` | tRPC's fetch adapter. Every procedure worth auditing is already covered by `auditMiddleware` + `PROCEDURE_TO_ACTION`; wrapping the adapter would log one opaque row per batched call. |

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
| `public_search` | **180 days** | Lectures du référentiel public (recherche de déclarations, référents, stats). Highest volume, no authentication. |
| `auth` | 365 days | Login, logout, failed login. |
| `mutation` | 365 days | Any write to business data. |
| `export` | 365 days | Data exports and third-party API consumers. |
| `system` | 365 days | Cron-triggered / admin actions. |

The cleanup cron (`packages/app/scripts/audit-cleanup.ts`, wired up in
`.kontinuous/templates/audit-cleanup-cron.yaml`) drops `read_sensitive` and `public_search` rows
after 180 days and everything else after 365 days. This is enforced at the DB
level; the category you choose **defines** the retention window.

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
