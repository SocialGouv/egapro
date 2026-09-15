/**
 * Integration test for `scripts/audit-cleanup.ts` — runs against the real
 * Postgres container booted by `src/test/integration-setup.ts`.
 *
 * Why this exists as an integration test:
 *  The script bypasses the app's drizzle schema and runs raw SQL through the
 *  `postgres` driver. Only a real database can catch driver-level issues such
 *  as the `Date` → `sql\`\`` regression that previously broke the TypeScript
 *  cleanup implementation (see PR #3190). This test locks the behavior in for
 *  the direct-DB CronJob refactor (issue #3268).
 */

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
// The script is a standalone CLI entry — we import its exported core
// routines and drive them with our own `sql` client so we never spawn `node`
// from within Vitest.
import {
	runAuditCleanup,
	runReceiptOutboxCleanup,
} from "#scripts/audit-cleanup";
import { env } from "~/env.js";

describe("audit-cleanup.ts (integration)", () => {
	// Definite-assignment assertion — initialized synchronously in `beforeAll`.
	// If `beforeAll` throws, vitest skips the tests and reports the original
	// error; any afterAll failure from an undefined `sql` is suppressed below.
	let sql!: ReturnType<typeof postgres>;

	beforeAll(() => {
		// DATABASE_URL is populated by `integration-setup.ts` before this file
		// loads — env.js reads it from the same source.
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM audit.action_log`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM audit.action_log`;
	});

	async function insertRow(row: {
		createdAt: Date;
		category: string;
		action: string;
	}) {
		await sql`
			INSERT INTO audit.action_log (id, action, category, status, created_at)
			VALUES (
				${crypto.randomUUID()},
				${row.action},
				${row.category},
				'success',
				${row.createdAt}
			)
		`;
	}

	async function countRows(): Promise<number> {
		const result = await sql<[{ count: string }]>`
			SELECT COUNT(*)::text AS count FROM audit.action_log
		`;
		return Number(result[0]?.count ?? 0);
	}

	async function countWhere(value: string): Promise<number> {
		const result = await sql<[{ count: string }]>`
			SELECT COUNT(*)::text AS count
			FROM audit.action_log
			WHERE action = ${value}
		`;
		return Number(result[0]?.count ?? 0);
	}

	it("records a success self-audit even on an empty table", async () => {
		const result = await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(result).toEqual({
			deletedShort: 0,
			deletedLong: 0,
			deletedTotal: 0,
		});
		expect(await countWhere("system.audit_cleanup")).toBe(1);
	});

	it("deletes read_sensitive rows older than the short retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 200 d old → above the 180 d threshold → deleted
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});
		// 100 d old → below the 180 d threshold → kept
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});

		const result = await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(1);
		expect(result.deletedLong).toBe(0);
		// Remaining rows: the kept read_sensitive row + the self-audit entry.
		expect(await countRows()).toBe(2);
	});

	it("deletes public_search rows older than the short retention (bucket contains multiple categories)", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "public_search",
			action: "public_referents.search",
		});
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "public_search",
			action: "public_referents.search",
		});

		const result = await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(1);
		expect(result.deletedLong).toBe(0);
	});

	it("deletes non-short-retention rows older than the long retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 400 d old → above the 365 d threshold → deleted
		await insertRow({
			createdAt: new Date("2024-11-27T00:00:00Z"),
			category: "auth",
			action: "auth.login",
		});
		// 300 d old → below the 365 d threshold → kept
		await insertRow({
			createdAt: new Date("2025-03-07T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});

		const result = await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(0);
		expect(result.deletedLong).toBe(1);
	});

	it("applies short and long retention independently in a single run", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});
		await insertRow({
			createdAt: new Date("2024-11-27T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "auth",
			action: "auth.login",
		});

		const result = await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result).toEqual({
			deletedShort: 1,
			deletedLong: 1,
			deletedTotal: 2,
		});
	});

	it("writes a self-audit entry with the deletion counts in metadata", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});
		await insertRow({
			createdAt: new Date("2024-11-27T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});

		await runAuditCleanup({
			sql,
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		const selfAudit = await sql<
			[{ status: string; metadata: Record<string, unknown> }]
		>`
			SELECT status, metadata FROM audit.action_log
			WHERE action = 'system.audit_cleanup'
			ORDER BY created_at DESC
			LIMIT 1
		`;
		expect(selfAudit[0]?.status).toBe("success");
		expect(selfAudit[0]?.metadata).toMatchObject({
			deletedShort: 1,
			deletedLong: 1,
			deletedTotal: 2,
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});
	});

	it("executes a Date-based predicate without driver errors (regression guard)", async () => {
		// Sanity check: the driver must accept a Date bind param. A previous
		// TS revision used `sql\`... < ${date}\`` which crashed postgres-js
		// with `TypeError: The "string" argument must be of type string`.
		await insertRow({
			createdAt: new Date("2020-01-01T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});

		await expect(
			runAuditCleanup({
				sql,
				shortRetentionDays: 1,
				longRetentionDays: 1,
			}),
		).resolves.toBeDefined();
	});
});

describe("runReceiptOutboxCleanup (integration)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_receipt_outbox`;
		await sql`DELETE FROM audit.action_log`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_receipt_outbox`;
		await sql`DELETE FROM audit.action_log`;
	});

	async function insertOutboxRow(row: {
		status: "pending" | "sending" | "sent" | "failed";
		updatedAt: Date;
	}) {
		await sql`
			INSERT INTO app_receipt_outbox
				(id, kind, siren, year, recipient_email, status, created_at, updated_at)
			VALUES (
				${crypto.randomUUID()},
				'declaration',
				'123456789',
				2026,
				'declarant@example.fr',
				${row.status},
				${row.updatedAt},
				${row.updatedAt}
			)
		`;
	}

	async function countOutboxRows(): Promise<number> {
		const result = await sql<[{ count: string }]>`
			SELECT COUNT(*)::text AS count FROM app_receipt_outbox
		`;
		return Number(result[0]?.count ?? 0);
	}

	it("purges a sent row past retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 400 d old → above the 365 d threshold → purged.
		await insertOutboxRow({
			status: "sent",
			updatedAt: new Date("2024-11-27T00:00:00Z"),
		});

		const result = await runReceiptOutboxCleanup({
			sql,
			retentionDays: 365,
			now,
		});

		expect(result).toEqual({ deleted: 1 });
		expect(await countOutboxRows()).toBe(0);
	});

	it("purges a failed row past retention the same way as a sent one", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertOutboxRow({
			status: "failed",
			updatedAt: new Date("2024-11-27T00:00:00Z"),
		});

		const result = await runReceiptOutboxCleanup({
			sql,
			retentionDays: 365,
			now,
		});

		expect(result).toEqual({ deleted: 1 });
	});

	it("keeps a settled row within retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 300 d old → below the 365 d threshold → kept.
		await insertOutboxRow({
			status: "sent",
			updatedAt: new Date("2025-03-07T00:00:00Z"),
		});

		const result = await runReceiptOutboxCleanup({
			sql,
			retentionDays: 365,
			now,
		});

		expect(result).toEqual({ deleted: 0 });
		expect(await countOutboxRows()).toBe(1);
	});

	// The row is live work for the retry pass, however old it looks — purging
	// it would silently drop a receipt still owed.
	it("never purges a pending or sending row, no matter its age", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertOutboxRow({
			status: "pending",
			updatedAt: new Date("2020-01-01T00:00:00Z"),
		});
		await insertOutboxRow({
			status: "sending",
			updatedAt: new Date("2020-01-01T00:00:00Z"),
		});

		const result = await runReceiptOutboxCleanup({
			sql,
			retentionDays: 365,
			now,
		});

		expect(result).toEqual({ deleted: 0 });
		expect(await countOutboxRows()).toBe(2);
	});

	it("writes a success self-audit row with the deletion count", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		await insertOutboxRow({
			status: "sent",
			updatedAt: new Date("2024-11-27T00:00:00Z"),
		});

		await runReceiptOutboxCleanup({ sql, retentionDays: 365, now });

		const selfAudit = await sql<
			[{ status: string; metadata: Record<string, unknown> }]
		>`
			SELECT status, metadata FROM audit.action_log
			WHERE action = 'system.receipt_outbox_cleanup'
			ORDER BY created_at DESC
			LIMIT 1
		`;
		expect(selfAudit[0]?.status).toBe("success");
		expect(selfAudit[0]?.metadata).toMatchObject({
			deleted: 1,
			retentionDays: 365,
		});
	});
});
