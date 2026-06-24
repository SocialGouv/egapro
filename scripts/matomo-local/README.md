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
then fires synthetic events for the two most recent campaign years. Both scripts
are **idempotent** and use only the Python standard library.

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
