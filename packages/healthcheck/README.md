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
    suit.ts            four SUIT probes: CSE presence, GIP-MDS metadata,
                       exposed CSE file route, client certificate expiry
    jobs/
      definitions.ts   the four regulatory cron jobs, with their cron
      freshness.ts     staleness rule and window (pure)
      auditTrace.ts    last success/failure in audit.action_log
      exports.ts       app_export corroboration of the export job
      pgbossSchedules.ts  the eight reminder schedules, cron read from pg-boss
      emailQueue.ts    failures and oldest pending job of email-notification
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
  nextExpectedAt?: Date;  // job probes only: next run their cron expects
};
```

A probe owns the classification of its own failures (`misconfigured` for a
refused credential or certificate, `unavailable` for everything else) and
sanitises its own message: it is the only layer holding the raw error and the
credentials to scrub out of it.

## Storage

Two tables, both written here and read by the back-office:

- `app_health_probe` — one row per probe: last status, latency, `checked_at`,
  `changed_at`, `consecutive_failures`, `last_error`, and `next_expected_at`
  (job probes only — the next run the worker's cron definition expects).
- `app_health_incident` — one row per **state change** (`from_status` →
  `to_status`, `started_at`, `ended_at`). A return to `operational` closes the
  open incident; a failure that changes shape (down → degraded) closes one and
  opens another.

Ten probes a minute would write ~14 000 rows a day if every tick were kept, so
the current state is an `INSERT … ON CONFLICT (key) DO UPDATE` and only
transitions are appended.

The tables belong to `packages/app` (Drizzle migrations, `drizzle/0063_*` to
`drizzle/0064_*`). This workspace never imports the Next.js app: it speaks raw
SQL through `postgres`, and `src/__tests__/persistence.integration.test.ts` runs
that SQL against a disposable Postgres container with the real migrations
applied.

## Scheduled jobs

A CronJob that never starts, whose image cannot be pulled or whose script is
missing writes **no trace at all**. The only thing that catches it is freshness:
each scheduled job gets one synthetic probe of `kind: "job"`, and it is red as
soon as no success line exists inside its window.

| Job | Trace read | Criticality |
|---|---|---|
| `export-generate-daily` | `export.generate` success, corroborated by a recent `app_export` row | critical |
| `gip-mds-import-daily` | `gip_mds.import` success | critical |
| `declaration-cleanup-daily` | `system.declaration_cleanup` success | critical |
| `audit-cleanup-daily` | `system.audit_cleanup` success | critical |
| 8 reminder schedules (pg-boss) | last `completed` job of the queue | important |
| `email-notification` queue | failures inside the window, oldest pending job | important |

Rules, all in this worker — the screen prints the result and never re-derives a
schedule:

- The window is `HEALTHCHECK_JOB_STALE_HOURS` (default 26 = 24 h + 2 h of
  scheduler margin) **or the cron's own period when that is longer**. A monthly
  or yearly schedule is therefore not red for the rest of the year.
- No success inside the window → `unavailable`, "en retard". A job that never
  succeeded is red from the very first cycle: the absence of a trace is the
  signal, not an exception to it.
- A failure newer than the last success is **not** an outage while a success
  stays in the window; it is stored in the message so the screen can show it on
  its own line.
- `next_expected_at` comes from the cron definition: the four regulatory jobs
  are declared in `probes/jobs/definitions.ts` (same `schedule:` as
  `.kontinuous/templates/*-cron.yaml`), the reminder schedules are read from
  `pgboss.schedule` so pg-boss stays the single source of their cron. Their
  completed jobs are kept 400 days (`COMPLETION_TRACE_RETENTION_SECONDS` in
  `packages/notifications/src/schedules/index.ts`), past pg-boss's 7-day
  default: without it, a monthly reminder would lose its trace weeks before the
  next run and read as a missed job.
- Requests on `audit.action_log` walk `action_log_action_idx (action,
  created_at)` backwards and stop at the first matching row, so they read the
  tail of one action's history instead of scanning the table. That is also how
  the screen gets a real "dernier succès" when the last one sits outside the
  freshness window.
- `last_success_at` / `last_failure_at` persist the two trace values the probe
  already reads, so the back-office prints them without replaying audit or
  pg-boss queries. A cycle that cannot reach its source leaves them empty and
  the stored value is kept, rather than erasing history at the worst moment.
- `interval_seconds` persists each probe's own cycle. The screen widens its
  freshness threshold to two cycles, so a partner probe checked every 15
  minutes is not displayed as unknown between two runs.

**Out of scope, on purpose:** no Kubernetes API client and no RBAC. Freshness
comes from application traces, which covers every job that writes one.
`data-gouv-refresh-daily` (disabled by default) and post-deploy backfill jobs
write none and stay out until they do. The receipt replay probe (#4546) is not
scheduled either: its `app_receipt_outbox` table does not exist yet, and the
worker logs that absence at boot. The supervision runbook records both gaps.

## SUIT probes

SUIT is called over mTLS for two things (CSE presence, GIP-MDS file) and exposes
the CSE file route we serve. Three failures were silent: an expired
certificate, a WAF refusal, an unavailable partner. Four probes cover them; all
call `createSuitClient` from the shared `suit-transport` package, which owns the
mTLS agent and the origin guard.

| Probe | What it proves | Status mapping |
|---|---|---|
| `suit-cse` | `GET /suit/api/externe/portail/CSE/<reference SIREN>` answers | any status proves the handshake; `401`/`403` → `misconfigured`, `5xx` → `unavailable`, transport error → `unavailable` |
| `suit-gip-mds` | `GET /suit/api/externe/egapro/gipmds/latest/metadata` answers | same; **no `Accept` header** — the SUIT WAF answers an HTML 403 as soon as one is present on this route |
| `suit-cse-files` | the file route SUIT consumes, through APISIX | `401`/`403` → `misconfigured`, `5xx` → `unavailable`, a 200 that is not JSON → `degraded` |
| `suit-certificate` | `notAfter` of the client certificate | unreadable bundle → `misconfigured`, expired or inside 7 days → `unavailable`, inside `HEALTHCHECK_CERT_WARN_DAYS` → `degraded` |

A probe **never writes** to SUIT: a test CSE opinion would pollute a real
company's data. The file probe therefore checks the read side only — gateway
key, WAF, app route, readable JSON — not a real deposit. Missing client
certificate is `misconfigured` on the two mTLS probes: SUIT is fine, our
configuration is not.

The reference SIREN comes from `HEALTHCHECK_SUIT_REFERENCE_SIREN` (public and
stable, never a client company), like the WEEZ one.

## Mattermost alerts

The screen is for the day; Mattermost is for the night. Alerts come from the
worker itself, never from Grafana: an alert must not depend on the platform's
database or observability tool.

- **Transitions only.** A stable state sends nothing. A run emits at most one
  alert for the outage and at most one recovery; there is no reminder while the
  state does not change.
- **Anti-flapping.** A `critical` or `important` probe alerts on the run that
  reaches `HEALTHCHECK_ALERT_AFTER_FAILURES` consecutive failures (default 3 —
  under five minutes at the 60 s cadence). The recovery is sent once, and only
  if the alert had been sent: the persisted `consecutive_failures` carries that
  memory across a restart. Two failures followed by a success stay silent.
- **`misconfigured` alerts immediately**: the worker is the one misconfigured,
  and waiting three cycles would not make it disappear.
- **`low` never alerts**: it stays visible on the screen only.
- **Content**: probe label, state, time since, consecutive failures, latency,
  the sanitised last message, the next expected run for a scheduled job, and a
  link to `/admin/etat-des-services`. No secret, signed URL, response header or
  body leaves the worker — the webhook URL is registered as a secret and the
  message goes through the same sanitiser as the logs.
- **No silence window.** Messages go out 24/7; the team handles them during
  working hours. That is a runbook decision, not a worker one.

The webhook lives in `HEALTHCHECK_MATTERMOST_WEBHOOK_URL`, mounted from an
optional `healthcheck-alerts` Secret that ops seals per environment (the
channel and the webhook are created outside this repository). Absent, the
worker logs `no HEALTHCHECK_MATTERMOST_WEBHOOK_URL — Mattermost alerts
disabled` at boot and sends nothing: a namespace without the secret still rolls
out. `HEALTHCHECK_ADMIN_URL` overrides the screen host; unset, it falls back to
`HEALTHCHECK_PUBLIC_URL`.

## Environment

| Variable | Required | Role |
|---|---|---|
| `DATABASE_URL` | one of the two | full DSN |
| `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SSLMODE` | one of the two | discrete keys of the `pg-app` secret |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | for the S3 probe | incomplete set → the S3 probe is skipped with a warning |
| `HEALTHCHECK_INTERVAL_SECONDS` | no (default `60`) | cadence of the internal probes |
| `HEALTHCHECK_JOB_STALE_HOURS` | no (default `26`) | floor of the staleness window for scheduled jobs (24 h + 2 h of margin) |
| `HEALTHCHECK_MATTERMOST_WEBHOOK_URL` | no | secret; absent → alerts disabled with a boot warning |
| `HEALTHCHECK_ALERT_AFTER_FAILURES` | no (default `3`) | consecutive failures before an alert |
| `HEALTHCHECK_ADMIN_URL` | no | back-office host linked from alerts; falls back to `HEALTHCHECK_PUBLIC_URL` |
| `EGAPRO_SUIT_API_URL` | for the SUIT probes | base URL of the SUIT API (same `suit` ConfigMap as the app) |
| `EGAPRO_SUIT_CLIENT_CERT_P12_BASE64`, `EGAPRO_SUIT_CLIENT_CERT_PASSWORD` | for mTLS | client certificate and passphrase (optional `suit-client-cert` secret); absent → `suit-cse` and `suit-gip-mds` report `misconfigured` |
| `HEALTHCHECK_SUIT_REFERENCE_SIREN` | for the SUIT SIREN probes | stable public SIREN whose CSE record is read |

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
