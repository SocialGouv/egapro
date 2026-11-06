# Audit logging

> S'applique à : routeurs tRPC, route handlers `src/app/api/**/route.ts`, `src/server/auth/**`, `src/server/audit/**`, `src/modules/audit/**`.

> Vérifiée en revue par [`security.md`](../../../review/references/security.md) (A09) et la checklist [`structural.md`](../../../review/references/structural.md).

Every protected user-facing action that falls into one of the audit categories
**must** produce a row in `audit.action_log`. The three remaining public read
actions (`PUBLIC_REFERENT_SEARCH`, `PUBLIC_REFERENT_VIEW`,
`PUBLIC_DECLARATIONS_EXPORT`) emit stdout activity only. Adding any other
action without wiring the audit log is a bug, not a missing enhancement.

Infrastructure lives in `~/modules/audit` + `~/server/audit` — see issue
SocialGouv/egapro#3174 for the design notes.

**Retention documentation lives at [`docs/journaux-et-conservation.md`](../../../../../docs/journaux-et-conservation.md)**, not here. Any change to what `audit.action_log` stores or to its retention window (content of `logAction`, `activityLog.ts`, `audit-cleanup.ts`, or the categories in `AUDIT_ACTION_CATEGORIES`) **must** update that page's §4.1 in the same PR — it is described there as a snapshot of this code, and a stale snapshot is worse than a missing one.

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
silently dropped at runtime. The structural review checklist enforces this.

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
        metadata: { /* fields explicitly allowed for this action */ },
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

Use `logAction` directly from `~/server/audit/log`. For a successful login,
write from the JWT sign-in branch after resolving the local database user:

```ts
// Inside callbacks.jwt, in the `if (user)` sign-in branch, after `dbUser`
// has been resolved and `token.id = dbUser.id` has been set:
const requestContext = await safeRequestContext();
void logAction({
  action: AUDIT_ACTIONS.AUTH_LOGIN,
  status: "success",
  userId: dbUser.id,
  siren: parseSiren(profileData.siret),
  ipAddress: requestContext.ipAddress,
});
```

Notes:

- Do not use `events.signIn` to attribute a successful login: its `user.id`
  is the ProConnect subject, not the local user UUID, and `logAction` rejects
  non-UUID identifiers. Do not emit a second `AUTH_LOGIN` row from that event.
- `logger.error` (used for failed logins) MUST stay synchronous — NextAuth v4
  does not await it. Fire the async work inside a `void (async () => {...})()`
  IIFE.
- For login failures, pass metadata through `buildAuthErrorMessage()` so OAuth
  tokens / state / code_verifier are stripped from the log line.
- NextAuth also feeds the `logger` from `POST /api/auth/_log`, an anonymous
  endpoint whose body picks the level and code. The `[...nextauth]` route
  answers it `204` without reaching NextAuth, so only server-side events write
  audit rows — keep it that way.

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
  (failure, outside the rolled-back transaction so the row survives). Apply
  the same closed metadata and error-code policy at this SQL boundary; these
  scripts do not pass through `logAction`.

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

## Inventaire, données conservées, miroir stdout

La carte de couverture des route handlers (`src/app/api/**/route.ts` : instrumentés, `logAction` direct, exemptions nommées), le détail des colonnes conservées dans `audit.action_log` et le contrat du miroir stdout (#3705) vivent dans [`docs/audit-logging-inventaire.md`](../../../../../docs/audit-logging-inventaire.md). **Un nouveau route handler s'y inscrit dans la même PR** — audité, ou exemption nommée et justifiée ; il n'y a pas de troisième état. Recompter avec `find packages/app/src/app/api -name route.ts | sort`.

---

## Category → retention mapping (CNIL compliance)

Any change here must also update [`docs/journaux-et-conservation.md`](../../../../../docs/journaux-et-conservation.md) §4.1 (see top of this file).

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

For tRPC middleware behaviour (opt-in query, metadata projection,
failed-input rejection, `ok: false` detection), extend the existing
`~/server/audit/__tests__/trpcMiddleware.test.ts`. For the stdout mirror
itself (IP truncation, error-code derivation, input/inputKeys projection,
the 16-key contract, the test-env guard), extend
`~/server/audit/__tests__/activityLog.test.ts`.

For `packages/app/scripts/audit-cleanup.ts` changes that touch the DB layer (new SQL predicates, new
retention categories), **add an integration test** in
`~/server/audit/__tests__/auditCleanupScript.integration.test.ts` — mocked unit tests do not execute real SQL
and miss driver-level bugs (see the `Date` → `sql\`\`` regression that
triggered the addition of `pnpm test:integration`).

Before opening the PR, re-check, for every new surface, the wiring of « When a new audit entry is REQUIRED » (constant, category, surface wire-up, `metadata.ts` allow-list), then verify on a review app that the row lands in `audit.action_log` with the expected category / status / metadata.
