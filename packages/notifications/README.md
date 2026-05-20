# notifications

pg-boss worker **+** publisher library for Egapro email notifications.

The Next.js app (`packages/app`) imports `notifications/publisher` to enqueue
jobs; this workspace also ships a long-running consumer that pulls jobs, renders
the DSFR-styled email (with optional PDF attachments decoded from base64), sends
via SMTP (Tipimail in prod / MailDev in dev / preprod), and writes a row to the
main DB's `audit.action_log` when reachable.

The app no longer carries `pg-boss` / `nodemailer` / `html-to-text` as direct
dependencies — those live exclusively here. The app dynamically imports
`notifications/publisher` via package.json `exports`, which resolves to a
pre-compiled `./dist/publisher.js`. Next.js treats `notifications` as
`serverExternalPackages`, so its runtime deps never land in the app bundle.

## Layout

```
src/
  index.ts              CLI entry — pg-boss runtime, SMTP transport, audit hooks
  publisher.ts          enqueueNotification (boss singleton + send to queue)
  queue.ts              QUEUE_NAME + EmailJobData + SerializedAttachment + validateJobData
  db.ts                 resolvePgUrl helper (Kubernetes-style POSTGRES_* env vars)
  mails/
    index.ts              registry { type → builder } + buildMail dispatcher
    types.ts              NotificationType union + NotificationPayloadMap
    helpers.ts            escapeHtml, formatSiren, getPublicUrl
    view/                 ── visual layer (DSFR HTML primitives) ──
      shell.ts              layout (header, footer, infoList, ctaButton, …)
      tokens.ts             colors, font stack, spacing — inlined for email clients
    declarationConfirmation.ts        (MD — confirmation 1ère déclaration)
    secondDeclarationConfirmation.ts  (MSDc — confirmation 2e déclaration)
    cseOpinionReceipt.ts              (MH_* — confirmation avis CSE)
    jointEvaluationSubmitted.ts       (M_PE2 — confirmation éval. conjointe)
    __tests__/            registry, shell rendering, helpers, per-type details
  __tests__/            queue validation + publisher graceful degradation
```

Templates are flat under `mails/` — one file per notification type. The
`view/` subfolder is the only sub-directory because its primitives are reusable
across templates (shell + design tokens). Adding a reminder template = adding
one file at this level, no other directory tree.

## Subpath exports (consumed by `packages/app`)

```jsonc
"exports": {
  "./publisher": "./dist/publisher.js",  // enqueueNotification (reads process.env)
  "./queue":     "./dist/queue.js",      // QUEUE_NAME, types, validateJobData
  "./mails":     "./dist/mails/index.js" // registry, buildMail, NOTIFICATION_TYPES
}
```

These point at **compiled JS** (`dist/`). The app does
`await import("notifications/publisher")` at runtime, and Next.js treats
`notifications` as an external server package (see `serverExternalPackages` in
`next.config.js`) — so pg-boss never enters the app bundle.

The dist tree is produced by `pnpm --filter notifications build` (run as
`predev` and `prebuild` on the app, and explicitly in the Dockerfile before the
Next.js build).

The CLI entry (`./src/index.ts` → compiled to `./dist/index.js`) is **not**
exported as a subpath — it is the worker pod entrypoint.

## Usage from the app

`enqueueNotification` is self-contained: it reads `NOTIFICATIONS_DATABASE_URL`
(or the `NOTIFICATIONS_POSTGRES_*` k8s vars), `NOTIFICATIONS_RETRY_LIMIT`
(default 5), and `NOTIFICATIONS_RETRY_DELAY_SECONDS` (default 60) directly from
`process.env`. The app does not declare these env vars in `env.js` — they are
worker-side config.

```ts
import { enqueueNotification } from "notifications/publisher";

const result = await enqueueNotification({
  type: "declaration_confirmation",
  recipientEmail: userEmail,
  recipientUserId: userId,
  siren,
  payload: { siren, year },
  attachments: [
    {
      filename: "declaration-552100554-2025.pdf",
      content: pdfBuffer,                  // Buffer | Uint8Array
      contentType: "application/pdf",
    },
  ],
});
// branch on result.status to log audit (success / failure / queue_unavailable)
```

Attachments are serialised to base64 in the job payload (pg-boss DB row). The
worker decodes them back to `Buffer` and hands them to nodemailer. Practical
budget: keep attachments under ~1 MB per job — pg-boss stores the payload as
JSON in Postgres, so multi-MB rows are technically possible but become
expensive in DB IO and replication.

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
itself — matches the secret layout used by the in-cluster Postgres operator.

Graceful shutdown: SIGTERM / SIGINT triggers `boss.stop({ graceful: true,
timeout: 15s })` so in-flight jobs ACK before exit.

## Poison-pill handling

Jobs go through `validateJobData()` before reaching the mail builder. A
malformed payload (unknown type, invalid email, missing siren/year, malformed
attachment shape) returns `{ ok: false }` — the handler logs an audit
`failure` and **returns clean** instead of throwing. pg-boss therefore marks
the job complete and stops retrying. Only transient SMTP / DB failures throw
and trigger the per-job retry policy (`retryLimit`, `retryBackoff`).

## Tests

```bash
pnpm --filter notifications test
```

## BRD coverage (Index Égalité F-H, Directive UE 2023/970)

The full source-of-truth flow lives in `docs/parcours-utilisateurs.md`. Mapping
to current implementation:

| Code | BRD label | Trigger | Status |
|---|---|---|---|
| MD | Confirmation 1ère déclaration | event (`declaration.submit`) | ✅ async via `declaration_confirmation` (PDF attachments rendered by the app, passed as base64 in the queue payload) |
| MSDc | Confirmation 2e déclaration | event (`declaration.submitSecondDeclaration`) | ✅ async via `second_declaration_confirmation` (same pattern) |
| MH_* | Confirmation avis CSE | event (file upload `cse_opinion`) | ✅ async via `cse_opinion_receipt` (no attachment) |
| M_PE2 | Confirmation rapport éval. conjointe | event (file upload `joint_evaluation`) | ✅ async via `joint_evaluation_submitted` (no attachment) |
| MR30 | Rappel déclaration J-30 (1er mai) | cron annuel | ⏳ infra prête (`scheduledFor`), template + scheduler à implémenter |
| MR10 | Rappel déclaration J-10 (22 mai) | cron annuel | ⏳ idem |
| ME | Rappel choix parcours J-15 (avant 1er juillet) | cron, si G≥5% | ⏳ idem |
| MSD3 | Rappel 2e déclaration J-90 | cron | ⏳ idem |
| MSD30 | Rappel 2e déclaration J-30 (1er déc) | cron | ⏳ idem |
| MG_E1 | Rappel dépôt éval. conjointe (1er août) | cron | ⏳ idem |
| MG_J1 | Rappel avis CSE — Justifier (avant 1er oct) | cron | ⏳ idem |
| MG_J2 | Rappel avis CSE 1er déc (Justifier) | cron | ⏳ idem |
| MG_E2 | Rappel avis CSE 1er déc (Éval. conjointe) | cron | ⏳ idem |
| MG_A | Rappel avis CSE (Actions correctives) | cron | ⏳ idem |
| MG_B/C | Rappel avis CSE (exactitude) | cron | ⏳ idem |
| MA | Info ouverture cycle (1er mars, dès 2028) | cron annuel | ⏳ idem |
| MI_* | Bascule cycle suivant | cron annuel | ⏳ idem |

**Couverture événementielle : 4/4** (les 4 confirmations event-driven du
schéma BRD). **Couverture rappels/cron : 0/13** — l'infra pg-boss +
`enqueueNotification({ scheduledFor })` supportent `startAfter`, ce qui sera
exploité par les futurs CronJobs.

## Adding a new notification type

1. Add the literal to `NOTIFICATION_TYPES` in `src/mails/types.ts`
2. Declare the payload shape in `NotificationPayloadMap`
3. Create `src/mails/<myType>.ts` exporting `buildMyMail: MailBuilder<"my_type">`
4. Register the builder in `src/mails/index.ts::MAIL_BUILDERS`
5. Add per-type rendering assertions in `src/mails/__tests__/mails.test.ts`
6. Call `enqueueNotification({ type: "my_type", ... })` from the app trigger

## Decoupling guarantees

- Lives in its own workspace — the app imports only the safe subpaths
  (`./publisher` / `./queue` / `./mails`). The CLI entry is reserved for the
  worker pod.
- Minimal dependency surface: `pg-boss`, `nodemailer`, `postgres`,
  `html-to-text` (plus `@biomejs/biome` + `vitest` for dev). **None** of these
  appear in `packages/app/package.json`.
- Connects to `NOTIFICATIONS_DATABASE_URL` (pg-boss schema, isolated infra)
  and optionally `DATABASE_URL` (audit log fan-out)
- If `DATABASE_URL` is absent, the worker still drains the queue — it just
  stops emitting `audit.action_log` rows

## Deployment

Runs as its own Kubernetes Deployment (single replica,
`strategy: Recreate`, `terminationGracePeriodSeconds: 30`). See
`.kontinuous/templates/notifications-deployment.yaml`. SMTP credentials come
from the same `smtp-app` sealed-secret as the app pod.
