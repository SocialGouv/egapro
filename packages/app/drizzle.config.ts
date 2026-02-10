import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit configuration for the `packages/app` database.
 *
 * Usage (from repo root):
 *   pnpm --filter app drizzle:generate
 *
 * Expected env:
 *   DATABASE_URL=postgres://user:password@host:5432/dbname
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/api/shared-domain/infra/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: false,
});
