# healthcheck

Resident prober **worker** for Egapro. Runs the life-checks that feed the
back-office "État des services" screen (issue #2710) and emits one
`health_check` JSON line per result on stdout, which is the only material the
Grafana dashboards build their history from.

It lives in its own workspace, like `packages/notifications`, because it must
run **outside the Next.js process**: a prober inside the app dies with it
(OOM, failed rollout), competes for its memory, and never sees the
ingress → APISIX → app chain. It still runs in the cluster and in the same
namespace, because the SUIT probes need the client mTLS certificate and the
internal probes (PostgreSQL, ClamAV, Valkey) are only reachable from there.

## Layout

```
src/
  index.ts             CLI entry — wiring, SIGTERM handling, exit 0 without a DB
  config.ts            env resolution (DSN, S3, cadence, values to redact)
  scheduler.ts         per-probe intervals, no overlap, timeouts, clean stop
  persistence.ts       app_health_probe upsert + app_health_incident open/close
  stdout.ts            one `health_check` JSON line per result
  sanitize.ts          what a stored/logged error message may say
  probes/
    types.ts           the probe contract (key, label, criticality, kind, ...)
    postgres.ts        SELECT 1        — critical, 5 s timeout
    s3.ts              HeadBucket      — critical, 10 s timeout
```

## Probe contract

```ts
type Probe = {
  key: string;
  label: string;                                  // user-facing, French
  criticality: "critical" | "important" | "low";
  kind: "internal" | "partner" | "exposed" | "job";
  intervalSeconds: number;
  timeoutMs: number;
  probe(signal: AbortSignal): Promise<ProbeResult>;
};

type ProbeResult = {
  status: "operational" | "degraded" | "unavailable" | "misconfigured";
  latencyMs: number;
  message?: string;   // short, sanitised — never a raw response or a stack
};
```

A probe owns the classification of its own failures (`misconfigured` for a
refused credential or certificate, `unavailable` for everything else) and
sanitises its own message: it is the only layer holding the raw error and the
credentials to scrub out of it.

## Storage

Two tables, both written here and read by the back-office:

- `app_health_probe` — one row per probe: last status, latency, `checked_at`,
  `changed_at`, `consecutive_failures`, `last_error`.
- `app_health_incident` — one row per **state change** (`from_status` →
  `to_status`, `started_at`, `ended_at`). A return to `operational` closes the
  open incident; a failure that changes shape (down → degraded) closes one and
  opens another.

Ten probes a minute would write ~14 000 rows a day if every tick were kept, so
the current state is an `INSERT … ON CONFLICT (key) DO UPDATE` and only
transitions are appended.

The tables belong to `packages/app` (Drizzle migrations, `drizzle/0063_*`).
This workspace never imports the Next.js app: it speaks raw SQL through
`postgres`, and `src/__tests__/persistence.integration.test.ts` runs that SQL
against a disposable Postgres container with the real migrations applied.

## Environment

| Variable | Required | Role |
|---|---|---|
| `DATABASE_URL` | one of the two | full DSN |
| `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SSLMODE` | one of the two | discrete keys of the `pg-app` secret |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | for the S3 probe | incomplete set → the S3 probe is skipped with a warning |
| `HEALTHCHECK_INTERVAL_SECONDS` | no (default `60`) | cadence of the internal probes |

Without any database configuration the worker logs a warning and exits **0**,
so a namespace without a database leaves an exited pod instead of failing its
rollout.

## Stdout

One line per result, and nothing else on that line:

```json
{"logType":"health_check","probeKey":"postgres-app","status":"operational","latencyMs":4,"checkedAt":"2026-11-17T10:42:00.000Z"}
```

No message, no secret, no signed URL: the line is shipped to the logs of the
platform. The detail of the last error stays in `app_health_probe.last_error`,
already sanitised.

## Run

```bash
# from packages/healthcheck
cp ../../.env .env            # or export DATABASE_URL / S3_* by hand
pnpm dev                      # tsx watch on src/index.ts
pnpm build && pnpm start      # node dist/index.js

pnpm test                     # unit tests
pnpm test:integration         # testcontainers, applies packages/app/drizzle
```

## Deployment

`.kontinuous/templates/healthcheck-deployment.yaml`: one replica,
`strategy: Recreate`, non-root, `global.healthcheckEnabled` (default `true`).
The image is the `app` one — the Dockerfile builds and deploys this workspace
next to `packages/notifications`, entry `node packages/healthcheck/dist/index.js`.

Two pods would double every partner call and race on the same probe rows.

## Adding a probe

1. Create `src/probes/<name>.ts` exporting `create<Name>Probe` and returning
   the contract above.
2. Classify its failures (`misconfigured` vs `unavailable`) and sanitise its
   message with `sanitizeMessage(error, secrets)`.
3. Register it in `buildProbes` (`src/index.ts`).
4. Unit-test the nominal case, the timeout, and one error per class — include
   a case where the error carries a credential.
