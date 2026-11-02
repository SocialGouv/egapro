import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as auditSchema from "./auditSchema";
import * as schema from "./schema";

const fullSchema = { ...schema, ...auditSchema };

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

// A wedged query would hold its public-export slot until the pod restarts; the full open-data export query takes ~1 s.
export const STATEMENT_TIMEOUT_MS = 60_000;

const conn =
	globalForDb.conn ??
	postgres(env.DATABASE_URL, {
		connection: { statement_timeout: STATEMENT_TIMEOUT_MS },
	});
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema: fullSchema, casing: "snake_case" });

export type DB = typeof db;
