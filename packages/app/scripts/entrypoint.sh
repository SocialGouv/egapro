#!/bin/sh
set -e

echo "Running Drizzle migrations..."
node packages/app/scripts/migrate.mjs
echo "Migrations completed."

echo "Starting Next.js..."
exec node packages/app/server.js
