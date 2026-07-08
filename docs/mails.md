# Mails transactionnels EGAPRO V2

Inventaire exhaustif des mails envoyés par la plateforme. Deux mécanismes :

1. **Event-driven** (4 mails) — émis depuis une mutation tRPC ou un upload, via le wrapper [`enqueueReceipt`](../packages/app/src/modules/mail/enqueueReceipt.ts) côté `packages/app`.
2. **Schedule-driven** (7 mails, 8 schedules cron pg-boss) — émis depuis le worker `packages/notifications` à intervalles réguliers (cron natif pg-boss avec `tz=Europe/Paris`). Le handler interroge l'app DB pour trouver les destinataires éligibles, déduplique via `notifications.reminder_sent_log`, puis enqueue un job sur la même queue `email-notification` que les mails event-driven.

Tous les jobs transitent par le même pipeline **publisher → pg-boss → worker → SMTP**. La pile de rendu HTML est **React Email** (composants typés DSFR, inline CSS auto, fallback texte produit par `html-to-text`).

> Pour la doc d'architecture (queue, fallback DB, retry policy), voir [`docs/architecture.md`](architecture.md). Pour le détail des parcours utilisateur qui déclenchent ces mails, voir [`docs/features.md`](features.md) et [`docs/parcours-utilisateurs.md`](parcours-utilisateurs.md).

---

## Vue d'ensemble — 11 types · 8 schedules

Chaque ligne pointe vers la **fiche détaillée** correspondante : sujet exact, corps complet, requête SQL d'éligibilité (pour les schedule-driven), bouton CTA et référence au flowchart BRD.

### Event-driven (déclenchement immédiat)

| # | Type pg-boss | Fiche détaillée | BRD | Déclencheur |
|---|---|---|---|---|
| 1 | `declaration_confirmation` | [`mails/declaration-confirmation.md`](mails/declaration-confirmation.md) | MD | tRPC `declaration.submit` |
| 2 | `second_declaration_confirmation` | [`mails/second-declaration-confirmation.md`](mails/second-declaration-confirmation.md) | MSDc | tRPC `declaration.submitSecondDeclaration` |
| 3 | `cse_opinion_receipt` | [`mails/cse-opinion-receipt.md`](mails/cse-opinion-receipt.md) | MH_* | `POST /api/upload` (`flowType=cse_opinion`) |
| 4 | `joint_evaluation_submitted` | [`mails/joint-evaluation-submitted.md`](mails/joint-evaluation-submitted.md) | M_PE2 | `POST /api/upload` (`flowType=joint_evaluation`) |

### Schedule-driven (cron pg-boss, fuseau Europe/Paris)

Les six rappels liés à une échéance (déclaration, choix parcours R1/R2, 2ᵉ déclaration, évaluation conjointe R1/R2) sont émis par un **tick quotidien unique** (`0 8 * * *`). L'échéance est résolue depuis `app_campaign_deadline` (config admin, fallback sur les défauts du domaine) et le rappel part **J-30 / J-15 / J-10 avant** — déplacer une échéance dans le back-office déplace donc l'envoi **et** la date affichée. Les rappels CSE et les mails d'information gardent des dates fixes.

| # | Type pg-boss | Fiche détaillée | BRD | Cron / déclenchement | Variants |
|---|---|---|---|---|---|
| 5 | `cycle_opening_info` | [`mails/cycle-opening-info.md`](mails/cycle-opening-info.md) | MA | `0 8 1 3 *` (échéance affichée lue en admin) | — |
| 6 | `declaration_deadline_reminder` | [`mails/declaration-deadline-reminder.md`](mails/declaration-deadline-reminder.md) | Rappel 1 | tick quotidien — J-30 / J-10 avant `decl1ModificationDeadline` | `daysRemaining: 30 \| 10` |
| 7 | `compliance_path_choice_reminder` | [`mails/compliance-path-choice-reminder.md`](mails/compliance-path-choice-reminder.md) | Rappels 2 & 5 | tick quotidien — J-15 avant l'échéance choix parcours (R1 : 1er juillet ; R2 : `pathChoiceDeadline`, 1er janvier N+1) | `round: first \| second` |
| 8 | `second_declaration_reminder` | [`mails/second-declaration-reminder.md`](mails/second-declaration-reminder.md) | Rappel 3 | tick quotidien — J-30 / J-15 avant `decl2ModificationDeadline` | `daysRemaining: 30 \| 15` |
| 9 | `joint_evaluation_reminder` | [`mails/joint-evaluation-reminder.md`](mails/joint-evaluation-reminder.md) | Rappels 4 & 6 | tick quotidien — J-30 / J-15 avant `decl1JointEvaluationDeadline` (R1) / `decl2JointEvaluationDeadline` (R2) | `round: first \| second` |
| 10 | `cse_opinion_reminder` | [`mails/cse-opinion-reminder.md`](mails/cse-opinion-reminder.md) | Rappel 7 | 5 schedules fixes (1er sept / 1er déc / 1er févr) | `variant: compliance \| justify_oct \| justify_dec \| corrective \| joint_eval` — **contenu unifié** |
| 11 | `next_cycle_handover` | [`mails/next-cycle-handover.md`](mails/next-cycle-handover.md) | MI_* | `0 8 2 3 *` | — |

**Destinataire** : tous les rappels sont envoyés au `declarations.declarantId → app_user.email` (le compte ProConnect qui a soumis la déclaration courante ou Y-1 selon le rappel). Pas de cc/bcc/groupé — un mail par déclaration, par variant.

---

## Architecture

### Pipeline complet

```text
                                    ┌──────────────────────────────────┐
                                    │  packages/notifications (worker) │
                                    │  - pg-boss instance              │
                                    │  - registerHandlers(11 types)    │
                                    │  - registerSchedules(8 crons)   │
                                    └──────┬──────────────────┬────────┘
                                           │                  │
                              ┌────────────┴───────┐  ┌───────┴────────────────────┐
                              │ Handler (mail send)│  │ Schedule tick (cron pg-boss)│
                              │ - validateJob      │  │ - query eligibility (app DB)│
                              │ - buildMail (React │  │ - skip if already sent      │
                              │   Email render)    │  │ - enqueueNotification       │
                              │ - SMTP send        │  │ - mark reminder_sent_log    │
                              │ - audit log        │  │                             │
                              └─────────▲──────────┘  └───────┬─────────────────────┘
                                        │                     │
                                        │ event-driven        │ time-driven
                                        │                     │
                              ┌─────────┴────────┐    ┌───────┴──────────┐
                              │ packages/app     │    │ pg-boss internal │
                              │ enqueueReceipt() │    │ cron scheduler   │
                              │ (tRPC mutations  │    │ (boss.schedule,  │
                              │  + upload route) │    │  tz=Europe/Paris)│
                              └──────────────────┘    └──────────────────┘
```

### Découplage `app` ↔ `notifications`

| Sujet | Côté `packages/app` | Côté `packages/notifications` |
|---|---|---|
| Code mail (builders, template, schedules) | rien | tout |
| Point d'entrée publish | `enqueueReceipt()` (3 kinds) + `enqueueNotification()` direct (1 cas) | `publisher.ts` |
| Imports | `notifications/publisher` + `notifications/queue` (1 fichier) | — |
| Env vars `SMTP_*` / `MAIL_*` | **non déclarées** dans `env.js` (retirées) | lues via `process.env` direct (`worker/transporter.ts`) |
| Env var `DATABASE_URL` | lue (Drizzle + audit + NextAuth) | lue (audit + eligibility + dedup table) — dépendance assumée |
| Asset Marianne (fonts woff2) | `public/dsfr/fonts/*` (copié par `scripts/copy-dsfr.mjs`) | référencés via `${EGAPRO_PUBLIC_URL}/dsfr/fonts/*` dans `EmailLayout.tsx` |

### Structure du package `packages/notifications/src/`

```text
src/
├── index.ts                # Worker entry — orchestrate pg-boss + register handlers + schedules
├── publisher.ts            # enqueueNotification (consumed by packages/app)
├── queue.ts                # QUEUE_NAME + EmailJobData + validateJobData (type-specific)
├── db.ts                   # DB URL resolution (NOTIFICATIONS_* / fallback to DATABASE_URL)
├── mails/
│   ├── index.ts            # MAIL_BUILDERS registry (11 entries) + buildMail() async
│   ├── types.ts            # NOTIFICATION_TYPES (11) + NotificationPayloadMap
│   ├── builders/           # 11 React Email builders (one .tsx per notification type)
│   ├── template/           # React Email components (EmailShell, EmailLayout, EmailHeader, InfoBar, EmailFooter, EmailButton, EmailCtaWithLink, …)
│   │                       # + tokens.ts (DSFR colors/font/spacing/BRAND)
│   │                       # + EmailLayout charge Marianne Regular/Medium/Bold via <Font>
│   └── shared/             # formatters, urls (getPublicUrl, getConnectionUrl, getMySpaceUrl), escapeHtml, renderEmail
├── eligibility/            # Read-only app DB queries powering the schedule handlers
│   ├── client.ts           # postgres.js client → DATABASE_URL
│   ├── queries.ts          # 7 SQL queries (findDraftDeclarations, findCseOpinionPending, …)
│   └── dedup.ts            # ensureDedupTable / wasSent / markSent (notifications.reminder_sent_log)
├── schedules/              # pg-boss cron schedules
│   ├── index.ts            # registerSchedules(boss, sql) — 13 createQueue + work + schedule
│   ├── definitions.ts      # SCHEDULES const (name, cron, tz, handler) — 8 entries
│   ├── dates.ts            # getCurrentYear (Intl.DateTimeFormat) + DEADLINES helpers
│   ├── handlers.ts         # 7 handlers — one per NotificationType
│   └── dispatch.ts         # dispatchReminder() — eligibility loop + dedup + enqueue
└── worker/                 # Sub-modules of the worker entry
    ├── transporter.ts      # SMTP nodemailer (TLS 1.2 min when SMTP auth set)
    ├── auditLog.ts         # logAuditMain (success/failure → audit.action_log)
    ├── jobHandler.ts       # makeJobHandler() — pure factory
    └── lifecycle.ts        # SIGTERM/SIGINT graceful shutdown
```

### Charte typographique (Marianne)

`EmailLayout.tsx` déclare les **3 weights de Marianne** utilisés par les templates :

- `Marianne-Regular.woff2` (400) — corps de texte, paragraphes
- `Marianne-Medium.woff2` (500) — libellés de boutons CTA
- `Marianne-Bold.woff2` (700) — titres, salutation « Bonjour », signature, valeurs de l'`InfoList`

Source : `${EGAPRO_PUBLIC_URL}/dsfr/fonts/Marianne-*.woff2`. Les fichiers sont déployés par [`packages/app/scripts/copy-dsfr.mjs`](../packages/app/scripts/copy-dsfr.mjs) lors de chaque build/dev de l'app — pas de wiring K8s supplémentaire. Fallback : `Arial, Helvetica, sans-serif` quand le client mail bloque les webfonts (Outlook ≤ 2019).

### Schéma DB ajouté

Une migration idempotente s'applique au boot du worker (via `ensureDedupTable`) :

```sql
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE TABLE IF NOT EXISTS notifications.reminder_sent_log (
    type     text NOT NULL,
    siren    text NOT NULL,
    year     integer NOT NULL,
    variant  text NOT NULL DEFAULT '',
    sent_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (type, siren, year, variant)
);
CREATE INDEX IF NOT EXISTS reminder_sent_log_lookup_idx
    ON notifications.reminder_sent_log (type, year);
```

L'`UNIQUE (type, siren, year, variant)` garantit l'idempotence des ticks — si un tick re-run (worker restart, clock skew, double cron), `wasSent()` renvoie `true` et l'enqueue est skip.

---

## Comportement transverse

### Audit log

Chaque publication enregistre une ligne dans `audit.action_log` :

- `notification.enqueue` (catégorie `mutation`, rétention 365j) — au moment du push dans pg-boss, status `success` ou `failure` selon le retour du publisher (`enqueued` / `error` / `queue_unavailable`)
- `notification.send` (catégorie `system`, rétention 365j) — au moment de l'envoi SMTP effectif côté worker, status `success` ou `failure`

Voir [`packages/app/src/modules/audit/shared/actionKeys.ts`](../packages/app/src/modules/audit/shared/actionKeys.ts).

### Retry policy

Le publisher configure pg-boss avec :

- `retryLimit` = `NOTIFICATIONS_RETRY_LIMIT` (défaut 5)
- `retryBackoff` = `true` (backoff exponentiel)
- `retryDelay` = `NOTIFICATIONS_RETRY_DELAY_SECONDS` (défaut 60)

Les erreurs **transitoires** (SMTP timeout, réseau) sont retentées. Les erreurs **structurelles** (payload invalide) sont marquées comme "poison pill" par le worker et ne sont pas retentées — voir [`packages/notifications/src/worker/jobHandler.ts`](../packages/notifications/src/worker/jobHandler.ts).

### Sécurité SMTP

`worker/transporter.ts` impose `requireTLS: true` et `tls.minVersion: "TLSv1.2"` dès qu'un couple `SMTP_USER` / `SMTP_PASS` est configuré (prod / preprod). En dev local (MailDev sans auth), ces options sont skip pour rester compatibles avec le conteneur.

### Dégradation gracieuse

`enqueueNotification` ne throw jamais : si pg-boss est indisponible, retourne `{ status: "queue_unavailable" }`. La mutation tRPC appelante reste un succès (la déclaration est bien enregistrée). Le mail est perdu et tracé dans l'audit log avec status `failure` + `errorMessage: "queue_unavailable"`.

Si `DATABASE_URL` est absent côté worker, `registerSchedules` warn et **les rappels sont désactivés** (les eligibility queries en ont besoin). Les mails event-driven continuent de fonctionner via la queue.

### Environnements

| Environnement | SMTP cible | Worker déployé | Schedules actifs |
|---|---|---|---|
| Local (`pnpm dev:app`) | MailDev (`docker compose`) | Non — à lancer manuellement (`pnpm --filter notifications dev`) ou via les E2E | Oui dès que le worker tourne |
| Review app / dev | MailDev in-cluster | Oui | Oui |
| Preprod | MailDev in-cluster | Oui | Oui |
| Prod | Tipimail (secret `smtp-app`) | Oui | Oui (Europe/Paris) |

---

## Tester un mail localement

### Aperçu visuel (sans envoi SMTP)

Rendre les builders en HTML statique, lancer un static server qui sert aussi les fonts Marianne, puis screenshot via Playwright :

```bash
# 1. Build le package
pnpm --filter notifications build

# 2. Rendu HTML d'un sample (un script de prévisualisation)
node -e "
import('./packages/notifications/dist/mails/index.js').then(async (m) => {
  const { html } = await m.buildMail('declaration_confirmation', { siren: '552100554', year: 2027 });
  require('node:fs').writeFileSync('/tmp/preview.html', html);
});
"

# 3. Servir les fonts à côté (pour que Marianne se charge)
mkdir -p /tmp/preview/dsfr && ln -sfn $(pwd)/packages/app/public/dsfr/fonts /tmp/preview/dsfr/fonts
mv /tmp/preview.html /tmp/preview/preview.html
python3 -m http.server 8089 --directory /tmp/preview --bind 127.0.0.1

# 4. EGAPRO_PUBLIC_URL=http://localhost:8089 pour que les URLs woff2 résolvent
# 5. Ouvrir http://localhost:8089/preview.html dans un navigateur
```

### Déclencher un schedule hors timing cron

Pour pousser manuellement un job de rappel (utile pour debug review app ou tests E2E) :

```bash
# Démarrer le worker localement
NOTIFICATIONS_DATABASE_URL=postgres://… \
DATABASE_URL=postgres://… \
MAIL_ENABLED=true \
SMTP_HOST=localhost SMTP_PORT=1025 \
EGAPRO_PUBLIC_URL=http://localhost:3000 \
pnpm --filter notifications dev
```

```ts
// Depuis un script Node connecté au même pg-boss DB :
import { PgBoss } from "pg-boss";
const boss = new PgBoss({ connectionString: process.env.NOTIFICATIONS_DATABASE_URL });
await boss.start();
await boss.send("reminder-deadline-daily-tick", {});
// Le worker exécute le handler → résout les échéances (app_campaign_deadline)
// → eligibility queries pour les rappels dus ce jour → enqueue des jobs notification
```

Le worker consomme le job comme s'il avait été émis par le cron. La dedup `reminder_sent_log` joue son rôle normal — purger la table si on souhaite re-tester sur les mêmes destinataires.

---

## Ajouter un nouveau type de mail

### Mail event-driven (déclenché par une mutation / route)

1. Ajouter le literal à `NOTIFICATION_TYPES` dans `packages/notifications/src/mails/types.ts`
2. Déclarer la forme du payload dans `NotificationPayloadMap`
3. Créer `packages/notifications/src/mails/builders/<name>.tsx` qui exporte `MailBuilder<"<type>">` (async, retourne `{ subject, html, text }`)
4. Référencer le builder dans `MAIL_BUILDERS` (`packages/notifications/src/mails/index.ts`)
5. Étendre `validatePayloadForType` dans `packages/notifications/src/queue.ts`
6. Si rattaché à un parcours « accusé de réception », étendre `KIND_TO_TYPE` dans [`enqueueReceipt.ts`](../packages/app/src/modules/mail/enqueueReceipt.ts). Sinon appeler `enqueueNotification` directement depuis la mutation/route.
7. Ajouter un cas dans `packages/notifications/src/mails/__tests__/builders.test.ts`
8. Créer la fiche détaillée `docs/mails/<kebab-case>.md` (modèle : reprendre une fiche event-driven existante)
9. Ajouter une ligne au tableau « Event-driven » ci-dessus

### Mail schedule-driven (déclenché par un cron)

1. Étapes 1 → 5 ci-dessus (le type + builder + validation existent comme pour un event-driven)
2. Si une nouvelle query est nécessaire : créer une fonction dans `packages/notifications/src/eligibility/queries.ts` qui retourne `ReminderRecipient[]`
3. Ajouter le handler dans `packages/notifications/src/schedules/handlers.ts` (`handleXxx(sql)` qui appelle `dispatchReminder`)
4. Référencer le schedule dans `packages/notifications/src/schedules/definitions.ts` (`SCHEDULES` const) avec son cron et `Europe/Paris`
5. Si variants → étendre `CSE_OPINION_REMINDER_VARIANTS` (ou ajouter une nouvelle union de literal types) et propager dans le builder + le handler
6. Ajouter un cas dans `packages/notifications/src/schedules/__tests__/registerSchedules.test.ts`
7. Créer la fiche détaillée `docs/mails/<kebab-case>.md` (modèle : reprendre une fiche schedule-driven existante)
8. Ajouter une ligne au tableau « Schedule-driven » ci-dessus

Le schéma DB n'a pas besoin d'évoluer — la table `notifications.reminder_sent_log` est polymorphe (`type`/`variant`).
