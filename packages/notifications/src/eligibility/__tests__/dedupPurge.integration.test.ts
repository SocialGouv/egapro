import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { handleReminderLogPurge } from "../../schedules/handlers.js";
import { logReminderLogCleanupFailure } from "../../worker/auditLog.js";
import { ensureDedupTable, markSent, wasSent } from "../dedup.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const NOW = new Date("2027-03-15T12:00:00Z");
const TYPE = "purge_test";

describe.skipIf(!testDatabaseUrl)("reminder log purge", () => {
	let sql: Sql;

	beforeAll(() => {
		sql = postgres(testDatabaseUrl as string);
	});

	afterAll(async () => {
		await sql.end();
	});

	beforeEach(async () => {
		await ensureDedupTable(sql);
		await sql`DELETE FROM notifications.reminder_sent_log`;
	});

	it("deletes the years before the retention window and keeps the ones reminders read", async () => {
		for (const year of [2027, 2026, 2025, 2024, 2023]) {
			await markSent(sql, { type: TYPE, siren: "111111111", year });
		}

		const summary = await handleReminderLogPurge(sql, NOW);

		expect(summary).toEqual({
			deletedCount: 2,
			cutoffYear: 2025,
			retentionYears: 3,
		});
		const remaining = await sql<{ year: number }[]>`
			SELECT year FROM notifications.reminder_sent_log
			WHERE type = ${TYPE}
			ORDER BY year
		`;
		expect(remaining.map(({ year }) => year)).toEqual([2025, 2026, 2027]);
	});

	it("writes a success audit row with the deleted count", async () => {
		await markSent(sql, { type: TYPE, siren: "111111111", year: 2023 });
		await markSent(sql, { type: TYPE, siren: "111111111", year: 2027 });

		await handleReminderLogPurge(sql, NOW);

		const [row] = await sql<
			{ category: string; status: string; metadata: Record<string, number> }[]
		>`
			SELECT category, status, metadata
			FROM audit.action_log
			WHERE action = 'system.reminder_log_cleanup'
			ORDER BY created_at DESC
			LIMIT 1
		`;
		expect(row).toMatchObject({
			category: "system",
			status: "success",
			metadata: { deletedCount: 1, cutoffYear: 2025, retentionYears: 3 },
		});
	});

	it("is idempotent", async () => {
		await markSent(sql, { type: TYPE, siren: "111111111", year: 2023 });

		const first = await handleReminderLogPurge(sql, NOW);
		const second = await handleReminderLogPurge(sql, NOW);

		expect(first.deletedCount).toBe(1);
		expect(second.deletedCount).toBe(0);
	});

	it("keeps deduplicating the campaign year after a purge", async () => {
		await markSent(sql, { type: TYPE, siren: "222222222", year: 2027 });
		await markSent(sql, { type: TYPE, siren: "222222222", year: 2023 });

		await handleReminderLogPurge(sql, NOW);

		await expect(
			wasSent(sql, { type: TYPE, siren: "222222222", year: 2027 }),
		).resolves.toBe(true);
		await expect(
			wasSent(sql, { type: TYPE, siren: "222222222", year: 2023 }),
		).resolves.toBe(false);
	});

	it("writes a failure audit row with a controlled error code", async () => {
		await logReminderLogCleanupFailure(sql);

		const [row] = await sql<
			{ category: string; status: string; error_message: string }[]
		>`
			SELECT category, status, error_message
			FROM audit.action_log
			WHERE action = 'system.reminder_log_cleanup' AND status = 'failure'
			ORDER BY created_at DESC
			LIMIT 1
		`;
		expect(row).toEqual({
			category: "system",
			status: "failure",
			error_message: "REMINDER_LOG_CLEANUP_FAILED",
		});
	});
});
