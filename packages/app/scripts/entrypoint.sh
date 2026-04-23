#!/bin/sh
set -e

echo "Running Drizzle migrations..."
node packages/app/scripts/migrate.mjs
echo "Migrations completed."

# Opt-in fixture seeding for the admin conformity stats page. Enabled only
# on dev/alpha review apps via .kontinuous/env/dev/values.yaml — never on
# preprod or prod. Idempotent upserts, so re-running on every pod restart
# is safe. Failure is treated as non-fatal: the app still boots.
if [ "$EGAPRO_AUTO_SEED_CONFORMITE" = "true" ]; then
  echo "Seeding admin conformity fixture (EGAPRO_AUTO_SEED_CONFORMITE=true)..."
  if node packages/app/scripts/seed-conformite-stats.mjs; then
    echo "Conformity fixture seeded."
  else
    echo "WARNING: conformity seed failed, continuing startup anyway." >&2
  fi
fi

echo "Starting Next.js..."
exec node packages/app/server.js
