import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeleteWhere, mockDelete, mockTransaction } = vi.hoisted(() => {
	const mockDeleteWhere = vi.fn();
	const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
	// Mirror drizzle's `db.transaction(fn)` — call `fn` with a tx object that
	// exposes the same `delete` builder we expose on `db`.
	const mockTransaction = vi.fn(
		async (fn: (tx: { delete: typeof mockDelete }) => Promise<unknown>) =>
			fn({ delete: mockDelete }),
	);
	return { mockDeleteWhere, mockDelete, mockTransaction };
});

vi.mock("~/server/db", () => ({
	db: { delete: mockDelete, transaction: mockTransaction },
}));

vi.mock("~/server/db/auditSchema", () => ({
	actionLogs: {
		category: { name: "category" },
		createdAt: { name: "created_at" },
	},
}));

const { cleanupAuditLogs } = await import("../cleanup");

describe("cleanupAuditLogs", () => {
	beforeEach(() => {
		mockDelete.mockClear();
		mockDeleteWhere.mockReset();
		mockTransaction.mockClear();
	});

	it("wraps both DELETEs in a single transaction", async () => {
		mockDeleteWhere
			.mockResolvedValueOnce({ count: 0 })
			.mockResolvedValueOnce({ count: 0 });

		await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(mockTransaction).toHaveBeenCalledTimes(1);
	});

	it("coerces string count values returned by postgres-js v3 to numbers", async () => {
		mockDeleteWhere
			.mockResolvedValueOnce({ count: "12" })
			.mockResolvedValueOnce({ count: "7" });

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(result.deletedShort).toBe(12);
		expect(result.deletedLong).toBe(7);
		// Sanity check: no string concatenation.
		expect(result.deletedTotal).toBe(19);
	});

	it("runs two delete statements (one short, one long) and returns row counts", async () => {
		mockDeleteWhere
			.mockResolvedValueOnce({ count: 12 })
			.mockResolvedValueOnce({ count: 7 });

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(mockDelete).toHaveBeenCalledTimes(2);
		expect(mockDeleteWhere).toHaveBeenCalledTimes(2);
		expect(result).toEqual({
			deletedShort: 12,
			deletedLong: 7,
			deletedTotal: 19,
		});
	});

	it("falls back to rowCount when count is not provided by the driver", async () => {
		mockDeleteWhere
			.mockResolvedValueOnce({ rowCount: 3 })
			.mockResolvedValueOnce({ rowCount: 4 });

		const result = await cleanupAuditLogs({
			shortRetentionDays: 180,
			longRetentionDays: 365,
		});

		expect(result.deletedShort).toBe(3);
		expect(result.deletedLong).toBe(4);
		expect(result.deletedTotal).toBe(7);
	});

	it("treats missing row counts as zero", async () => {
		mockDeleteWhere.mockResolvedValueOnce({}).mockResolvedValueOnce(undefined);

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

	it("uses the provided `now` reference for deterministic threshold computation", async () => {
		mockDeleteWhere
			.mockResolvedValueOnce({ count: 0 })
			.mockResolvedValueOnce({ count: 0 });

		const fixedNow = new Date("2026-04-08T00:00:00Z");
		await cleanupAuditLogs({
			shortRetentionDays: 1,
			longRetentionDays: 1,
			now: fixedNow,
		});

		// Just sanity-check that the call happened with both predicates evaluated.
		// The SQL itself is checked by the integration layer (cron route).
		expect(mockDeleteWhere).toHaveBeenCalledTimes(2);
	});
});
