# notifications

Long-running pg-boss consumer for Egapro email notifications.

The Next.js app (`packages/app`) publishes jobs to a dedicated pg-boss queue;
this package owns the consumer side: pull jobs, render the DSFR-styled email
template, send via SMTP (Tipimail in prod / MailDev in dev/preprod), and write
a row to the main DB's `audit.action_log` when reachable.

## Layout

```
src/
  index.ts              entry — pg-boss runtime, SMTP transport, audit hooks
  mails/
    index.ts            registry { type → builder } + buildMail dispatcher
    shell.ts            DSFR layout (header, footer, infoList, ctaButton, …)
    dsfr-tokens.ts      colors, font stack, spacing — inlined for email clients
    helpers.ts          escapeHtml, formatSiren, getPublicUrl
    <oneFilePerType>.ts one template per notification type
    __tests__/          snapshot + per-type assertions
```

Compiled with `tsc` to `dist/` (git-ignored) — the Dockerfile runs the build
in its builder stage and ships only the compiled output to the runtime image.

## Run

```bash
NOTIFICATIONS_DATABASE_URL=... \
DATABASE_URL=... \
MAIL_ENABLED=true \
SMTP_HOST=... SMTP_PORT=... SMTP_SECURE=... MAIL_FROM=... \
pnpm --filter notifications dev    # tsx watch on src/index.ts
# or, after pnpm --filter notifications build:
pnpm --filter notifications start  # node dist/index.js
```

The pod uses `node packages/notifications/dist/index.js` directly — the dist
tree is produced during the Docker build (`pnpm --filter notifications build`).

In addition to `NOTIFICATIONS_DATABASE_URL` / `DATABASE_URL`, the runtime
accepts the `NOTIFICATIONS_POSTGRES_*` / `POSTGRES_*` Kubernetes-style
variables (host/port/user/password/db/sslmode) and assembles the URL
itself — matches the secret layout used by the in-cluster Postgres
operator.

Graceful shutdown: SIGTERM / SIGINT triggers `boss.stop({ graceful: true,
timeout: 15s })` so in-flight jobs ACK before exit.

## Tests

```bash
pnpm --filter notifications test
```

Tests cover the templates registry, DSFR shell rendering, helpers, and
per-type details. The Vitest config uses `environment: node` — no JSDOM is
loaded, the suite runs in ~100 ms.

## Decoupling guarantees

- Lives in its own workspace — never imported by `packages/app`
- Minimal dependency surface: `pg-boss`, `nodemailer`, `postgres`,
  `html-to-text` (plus `@biomejs/biome` + `vitest` for dev)
- Connects to `NOTIFICATIONS_DATABASE_URL` (pg-boss schema, isolated infra)
  and optionally `DATABASE_URL` (audit log fan-out)
- If `DATABASE_URL` is absent, the worker still drains the queue — it just
  stops emitting `audit.action_log` rows

## Deployment

Runs as its own Kubernetes Deployment (single replica,
`strategy: Recreate`, `terminationGracePeriodSeconds: 30`). See
`.kontinuous/templates/notifications-deployment.yaml`. SMTP credentials come
from the same `smtp-app` sealed-secret as the app pod.
