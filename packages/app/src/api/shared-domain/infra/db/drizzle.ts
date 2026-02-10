import { config } from "@common/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Underlying postgres-js client.
 *
 * NOTE: keep `debug` aligned with the previous implementation in
 * [`postgres.ts`](packages/app/src/api/shared-domain/infra/db/postgres.ts:1).
 */
export const pgClient = postgres({
  debug: true,
  host: config.api.postgres.host,
  port: config.api.postgres.port,
  database: config.api.postgres.db,
  username: config.api.postgres.user,
  password: config.api.postgres.password,
  max: config.api.postgres.poolMaxSize,
  ssl: config.api.postgres.ssl,
});

/**
 * Drizzle entry point for all DB access.
 */
export const db = drizzle(pgClient, {
  schema,
  // Jest runs would otherwise spam logs and keep stdout noisy.
  // Also helps keep test output stable.
  logger: config.env === "dev" && process.env.JEST_WORKER_ID === undefined,
});

export type DbClient = typeof db;
