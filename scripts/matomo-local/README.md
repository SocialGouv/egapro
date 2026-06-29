# Local Matomo for egapro

A throwaway Matomo instance to test the full tracking plan locally, end-to-end,
without touching the production Matomo:

- **Mode 1** — client tracking events (`MatomoAnalytics`)
- **Mode 2** — the CNIL consent-exemption privacy configuration
- **Mode 3** — the `/admin/stats` Reporting-API widgets (funnels, model usage,
  help-link clicks, device split)

## Services

Defined in the root [`docker-compose.yml`](../../docker-compose.yml):

| Service       | Role                                                        |
| ------------- | ----------------------------------------------------------- |
| `matomo-db`   | MariaDB 11.4 backing store                                  |
| `matomo`      | Matomo 5 (apache) on <http://localhost:8080>                |
| `matomo-init` | one-shot provisioner — [`cnil-setup.py`](./cnil-setup.py)   |
| `matomo-seed` | one-shot synthetic-event seeder — [`seed-events.py`](./seed-events.py) |

`matomo-init` installs Matomo (when the volume is empty), creates the **Egapro
Local** site (idSite `1`), the `campaign_year` (dim 1) and `workforce_range`
(dim 2) action-scoped custom dimensions, an app API token, applies the CNIL
privacy config, and registers `localhost:8080` as a trusted host. `matomo-seed`
then fires synthetic events for the two most recent campaign years, covering the
**full tracking plan** ([`docs/plan-de-tracking.md`](../../docs/plan-de-tracking.md)):
native page views, the three funnels (`funnel_start` / `step_complete` /
`funnel_abandon` / `funnel_complete`), and every standalone action across the 9
categories (`search`, `help`, `document`, `auth`, `dashboard`, `cse_status`).
Both scripts are **idempotent** and use only the Python standard library.

## Run it

The four services live under the `matomo` Compose **profile**, so a plain
`docker compose up -d` (and CI) ignores them. Start the stack explicitly:

```bash
docker compose up -d matomo-seed        # naming the service activates the profile
# or, equivalently, the whole stack:
docker compose --profile matomo up -d
```

This brings up `matomo-db` → `matomo` → `matomo-init` → `matomo-seed` in order
(via `depends_on` conditions). First boot takes ~1 min (install + seed).

- **Matomo UI**: <http://localhost:8080/> — login `admin` / `changeme123`
- **App wiring**: the generated Reporting-API token is written to
  `scripts/matomo-local/.secrets/token` (also in `.secrets/credentials.txt`).
  Point the app at the local instance in `packages/app/.env`:

  ```dotenv
  NEXT_PUBLIC_MATOMO_URL="http://localhost:8080"
  NEXT_PUBLIC_MATOMO_SITE_ID="1"
  MATOMO_API_TOKEN="<contents of scripts/matomo-local/.secrets/token>"
  ```

  Then run `pnpm dev:app` and open `/admin/stats`.

> **⚠️ `/admin/stats` has two data sources.** This seeder only feeds the
> **Matomo-backed** widgets (CSE-confirmations volume, model/help/device usage,
> the "Funnels Matomo" client journeys). The **DB-backed** widgets — *Suivi de
> campagne* (taux de déclaration, délai par étape, taux d'abandon), the
> *Funnels de complétion*, and *Utilisateurs par entreprise* — read from
> Postgres and need declarations seeded separately:
>
> ```bash
> DATABASE_URL="postgresql://postgres:postgres@localhost:5438/egapro" \
>   node packages/app/scripts/seed-demo-stats.mjs --year=2026   # --clean to wipe
> ```
>
> Run **both** to populate the whole page. After every Matomo volume reset the
> Reporting-API token is regenerated — re-sync `MATOMO_API_TOKEN` in
> `packages/app/.env` from `.secrets/token` and restart `pnpm dev:app`.

## Re-seed / run the seeder from the host

The seeder is idempotent: a year that already has a `declaration` category is
skipped. After you **update `seed-events.py`** (e.g. new events), re-run it
against the already-running Matomo from the host — `--force` bypasses the skip:

```bash
# token is read from scripts/matomo-local/.secrets/token (written by matomo-init)
MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py --force
```

Alternatively, [reset the volumes](#reset-re-provision-from-scratch) for a clean
slate. The token can also be passed via `MATOMO_TOKEN` or `MATOMO_TOKEN_FILE`.

## Verify CNIL compliance

`seed-events.py verify` audits the **live** instance for the consent-exemption
conditions that depend on the data — no PII in event categories/actions/names or
custom dimensions, and query-string-free page URLs — and exits non-zero on any
violation:

```bash
MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py verify
```

The instance privacy config (IP anonymisation 2 bytes, Do Not Track, 750-day log
retention, export-disabling, user-id pseudonymisation) is applied by
`cnil-setup.py` and stored in Matomo's `option` table — Matomo 5 doesn't expose
it through the Reporting API, so confirm it directly:

```bash
docker exec egapro-matomo-db-1 mariadb -u matomo -pmatomo matomo -N -e \
  "SELECT option_name, option_value FROM matomo_option \
   WHERE option_name LIKE 'PrivacyManager%' OR option_name LIKE 'delete_logs%';"
```

## Reset (re-provision from scratch)

Remove **only** the Matomo volumes (do **not** use `docker compose down -v`,
which would also wipe the app's Postgres / MinIO volumes):

```bash
docker compose rm -sf matomo matomo-db matomo-init matomo-seed
docker volume rm egapro_matomodata egapro_matomodbdata
docker compose up -d matomo-seed          # reinstalls + reseeds
```

## Configuration

Overridable via environment (defaults set in `docker-compose.yml`):

- `MATOMO_HOST_PORT` — host port for the UI (default `8080`)
- `MATOMO_SU_PASSWORD` — superuser password (default `changeme123`)
- `MATOMO_TRUSTED_HOSTS` — comma-separated trusted hosts written to
  `config.ini.php` (default `matomo,localhost:8080,127.0.0.1:8080`)
- `SEED_VOLUME` — multiplies every per-category event volume (default `4`). Bump
  it (e.g. `SEED_VOLUME=8`) for a denser instance. Current-year events are biased
  toward recent days (≈35 % in the last 2 days, ≈35 % in the last 30) so the
  default day / week / month views aren't empty; year totals stay rich for the
  `period=year` `/admin/stats` widgets.

## Notes

- The funnels are computed from plain **Events** reports — the premium Funnels
  plugin is **not** required.
- `.secrets/` holds the API token and credentials and is **git-ignored** — never
  commit it.
- This stack is for local testing only. Never point it at production data.

## Troubleshooting

**"You are accessing Matomo from http://localhost:8080/ but it is configured to
run at http://matomo/"** — Matomo's trusted-host check. `matomo-init` already
registers `localhost:8080`; if you reach this from a custom host/port, add it to
`MATOMO_TRUSTED_HOSTS` and re-run `docker compose up matomo-init`, or append a
line to `config.ini.php` inside the container:

```bash
docker exec egapro-matomo-1 sh -c \
  'printf '\''trusted_hosts[] = "HOST:PORT"\n'\'' >> /var/www/html/config/config.ini.php'
```

**Seeded events look stale / incomplete after editing `seed-events.py`** — on the
first `docker compose --profile matomo up`, the `matomo-seed` container can serve
a **stale view** of the bind-mounted script (a Docker Desktop / macOS sync lag),
seeding the previous version of the plan. The seeder is also idempotent, so a
later container pass then **skips** the already-seeded year. Re-run it from the
host against the running instance to get the up-to-date plan (this reads the
exact on-disk file):

```bash
MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py --force
```

Then rebuild the year archives (the seeder warms them automatically, but a manual
nudge helps if a report still looks empty):

```bash
MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py verify
```

Alternatively [reset the volumes](#reset-re-provision-from-scratch) for a clean
slate before `up`.

**Confirm the full plan landed** — check the distinct event categories/actions in
the raw store (should list the 9 categories and 17 actions of the tracking plan):

```bash
docker exec egapro-matomo-db-1 mariadb -u matomo -pmatomo matomo -N -e \
  "SELECT DISTINCT name FROM matomo_log_action WHERE type IN (10,11) ORDER BY name;"
```
