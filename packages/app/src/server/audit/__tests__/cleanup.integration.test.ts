/**
 * Integration test for `cleanupAuditLogs` — runs against a real Postgres
 * container booted by `src/test/integration-setup.ts`.
 *
 * Why this exists as an integration test rather than a unit test:
 *  The unit test mocks `db.transaction` / `db.delete`, so the SQL query is
 *  built but never actually executed against a driver. A previous regression
 *  where a raw `sql` template tag passed a `Date` param to postgres-js
 *  crashed at runtime with `TypeError: The "string" argument must be of type
 *  string …` — invisible to the mocked test, caught only by manual E2E.
 *  This integration test locks the behavior in so the regression cannot come
 *  back.
 */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "~/server/db";
import { actionLogs } from "~/server/db/auditSchema";
import { cleanupAuditLogs } from "../cleanup";

describe("cleanupAuditLogs (integration)", () => {
	beforeEach(async () => {
		await db.delete(actionLogs);
	});

	afterAll(async () => {
		await db.delete(actionLogs);
	});

	async function insertRow(row: {
		createdAt: Date;
		category: string;
		action: string;
	}) {
		await db.insert(actionLogs).values({
			action: row.action,
			category: row.category,
			status: "success",
			createdAt: row.createdAt,
		});
	}

	async function countRows(): Promise<number> {
		const rows = await db.select().from(actionLogs);
		return rows.length;
	}

	it("does nothing on an empty table", async () => {
		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(result).toEqual({
			deletedShort: 0,
			deletedLong: 0,
			deletedTotal: 0,
		});
	});

	it("deletes read_sensitive rows older than the short retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 200 days old → above the 180 d threshold → deleted
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});
		// 100 days old → below the 180 d threshold → kept
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(1);
		expect(result.deletedLong).toBe(0);
		expect(await countRows()).toBe(1);
	});

	it("deletes non-read_sensitive rows older than the long retention", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// 400 days old → above the 365 d threshold → deleted
		await insertRow({
			createdAt: new Date("2024-11-27T00:00:00Z"),
			category: "auth",
			action: "auth.login",
		});
		// 300 days old → below the 365 d threshold → kept
		await insertRow({
			createdAt: new Date("2025-03-07T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(0);
		expect(result.deletedLong).toBe(1);
		expect(await countRows()).toBe(1);
	});

	it("applies short and long retention independently in a single run", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// read_sensitive, 200 d → above short threshold → deleted
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});
		// mutation, 200 d → below long threshold → kept (200 < 365)
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});
		// mutation, 400 d → above long threshold → deleted
		await insertRow({
			createdAt: new Date("2024-11-27T00:00:00Z"),
			category: "mutation",
			action: "declaration.submit",
		});
		// auth, 100 d → below long threshold → kept
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "auth",
			action: "auth.login",
		});

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result).toEqual({
			deletedShort: 1,
			deletedLong: 1,
			deletedTotal: 2,
		});
		expect(await countRows()).toBe(2);
	});

	it("deletes public_search rows older than the short retention (bucket contains multiple categories)", async () => {
		const now = new Date("2026-01-01T00:00:00Z");
		// public_search, 200 d → above short threshold → deleted
		await insertRow({
			createdAt: new Date("2025-06-15T00:00:00Z"),
			category: "public_search",
			action: "public_referents.search",
		});
		// public_search, 100 d → below short threshold → kept
		await insertRow({
			createdAt: new Date("2025-09-23T00:00:00Z"),
			category: "public_search",
			action: "public_referents.search",
		});

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
			now,
		});

		expect(result.deletedShort).toBe(1);
		expect(result.deletedLong).toBe(0);
		expect(await countRows()).toBe(1);
	});

	it("executes a real Date-based predicate without driver errors (regression guard)", async () => {
		// Sanity check: the driver must accept a Date bind param. A previous
		// revision used `sql\`... < ${date}\`` which crashed postgres-js with
		// `TypeError: The "string" argument must be of type string`.
		await insertRow({
			createdAt: new Date("2020-01-01T00:00:00Z"),
			category: "read_sensitive",
			action: "profile.read",
		});

		await expect(
			cleanupAuditLogs({
				shortRetentionDays: 1,
				longRetentionDays: 1,
			}),
		).resolves.toBeDefined();
	});
});
