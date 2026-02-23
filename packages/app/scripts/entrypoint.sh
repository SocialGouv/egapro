#!/bin/sh
set -e

echo "Running drizzle-kit push..."
node packages/app/node_modules/drizzle-kit/bin.cjs push --config packages/app/drizzle.config.ts
echo "Drizzle push completed."

echo "Starting Next.js..."
exec node packages/app/server.js
