import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

const globalForNotifDb = globalThis as unknown as {
	notifConn: postgres.Sql | undefined;
};

const conn =
	globalForNotifDb.notifConn ?? postgres(env.NOTIFICATIONS_DATABASE_URL);
if (env.NODE_ENV !== "production") globalForNotifDb.notifConn = conn;

export const notifDb = drizzle(conn, { schema, casing: "snake_case" });

export type NotifDB = typeof notifDb;
export { schema };
