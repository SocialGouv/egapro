import postgres, { type Sql } from "postgres";
import { resolvePgUrl } from "../db.js";

let cached: Sql | null = null;

// Read-only access to the app DB. Used by schedule handlers to find
// eligible recipients for time-driven reminders, and to record dedup rows
// in the `notifications.reminder_sent_log` table.
export function getAppDbSql(): Sql | null {
	if (cached) return cached;
	const url = resolvePgUrl(process.env.DATABASE_URL, "");
	if (!url) return null;
	cached = postgres(url, { max: 2 });
	return cached;
}

export async function closeAppDbSql(): Promise<void> {
	if (cached) {
		await cached.end({ timeout: 5 });
		cached = null;
	}
}

export function __resetAppDbSqlForTests(): void {
	cached = null;
}
