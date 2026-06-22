import type { Sql } from "postgres";

// Idempotence guard for cron-triggered reminders.
//
// Each schedule tick scans the app DB and enqueues a job for every eligible
// recipient. Without dedup, two ticks in the same cycle (worker restart,
// clock skew, duplicate cron firing) would re-send the same reminder.
//
// `(type, siren, year, variant)` is the natural identity of a reminder.
// `variant` is the empty string `""` for types that don't carry one — keeps
// the UNIQUE constraint simple (no NULL handling).

let migrated = false;

export async function ensureDedupTable(sql: Sql): Promise<void> {
	if (migrated) return;
	await sql.unsafe(`
		CREATE SCHEMA IF NOT EXISTS notifications;
		CREATE TABLE IF NOT EXISTS notifications.reminder_sent_log (
			type text NOT NULL,
			siren text NOT NULL,
			year integer NOT NULL,
			variant text NOT NULL DEFAULT '',
			sent_at timestamptz NOT NULL DEFAULT now(),
			UNIQUE (type, siren, year, variant)
		);
		CREATE INDEX IF NOT EXISTS reminder_sent_log_lookup_idx
			ON notifications.reminder_sent_log (type, year);
	`);
	migrated = true;
}

export async function wasSent(
	sql: Sql,
	params: {
		type: string;
		siren: string;
		year: number;
		variant?: string;
	},
): Promise<boolean> {
	const variant = params.variant ?? "";
	const rows = await sql<{ count: number }[]>`
		SELECT 1 AS count
		FROM notifications.reminder_sent_log
		WHERE type = ${params.type}
			AND siren = ${params.siren}
			AND year = ${params.year}
			AND variant = ${variant}
		LIMIT 1
	`;
	return rows.length > 0;
}

export async function markSent(
	sql: Sql,
	params: {
		type: string;
		siren: string;
		year: number;
		variant?: string;
	},
): Promise<void> {
	const variant = params.variant ?? "";
	await sql`
		INSERT INTO notifications.reminder_sent_log (type, siren, year, variant)
		VALUES (${params.type}, ${params.siren}, ${params.year}, ${variant})
		ON CONFLICT (type, siren, year, variant) DO NOTHING
	`;
}

export function __resetDedupForTests(): void {
	migrated = false;
}
