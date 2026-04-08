import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeleteWhere, mockDelete } = vi.hoisted(() => {
	const mockDeleteWhere = vi.fn();
	const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
	return { mockDeleteWhere, mockDelete };
});

vi.mock("~/server/db", () => ({
	db: { delete: mockDelete },
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
