import { beforeEach, describe, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => ({
	mocks: {
		ensureDedupTable: vi.fn(),
		purgeSentLog: vi.fn(),
		logReminderLogCleanup: vi.fn(),
		logReminderLogCleanupFailure: vi.fn(),
	},
}));

vi.mock("../../eligibility/index.js", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../eligibility/index.js")>();
	return {
		...actual,
		ensureDedupTable: mocks.ensureDedupTable,
		purgeSentLog: mocks.purgeSentLog,
	};
});

vi.mock("../../worker/auditLog.js", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../worker/auditLog.js")>();
	return {
		...actual,
		logReminderLogCleanup: mocks.logReminderLogCleanup,
		logReminderLogCleanupFailure: mocks.logReminderLogCleanupFailure,
	};
});

import {
	REMINDER_LOG_RETENTION_YEARS,
	reminderLogCutoffYear,
} from "../../eligibility/dedup.js";
import { handleReminderLogPurge } from "../handlers.js";

const NOW = new Date("2027-03-15T12:00:00Z");
const SQL = { name: "sql-stub" } as never;
const SUMMARY = { deletedCount: 4, cutoffYear: 2025, retentionYears: 3 };

describe("handleReminderLogPurge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.purgeSentLog.mockResolvedValue(SUMMARY);
	});

	it("purges the log for the current campaign year and audits the count", async () => {
		const summary = await handleReminderLogPurge(SQL, NOW);

		expect(mocks.ensureDedupTable).toHaveBeenCalledWith(SQL);
		expect(mocks.purgeSentLog).toHaveBeenCalledWith(SQL, { currentYear: 2027 });
		expect(mocks.logReminderLogCleanup).toHaveBeenCalledWith(SQL, SUMMARY);
		expect(mocks.logReminderLogCleanupFailure).not.toHaveBeenCalled();
		expect(summary).toEqual(SUMMARY);
	});

	it("audits a failure and rethrows when the purge throws", async () => {
		mocks.purgeSentLog.mockRejectedValue(new Error("delete failed"));

		await expect(handleReminderLogPurge(SQL, NOW)).rejects.toThrow(
			"delete failed",
		);

		expect(mocks.logReminderLogCleanup).not.toHaveBeenCalled();
		expect(mocks.logReminderLogCleanupFailure).toHaveBeenCalledWith(SQL);
	});
});

describe("retention window", () => {
	it("keeps three campaign years", () => {
		expect(REMINDER_LOG_RETENTION_YEARS).toBe(3);
	});

	it("cuts everything before the third campaign year", () => {
		expect(reminderLogCutoffYear(2027)).toBe(2025);
		expect(reminderLogCutoffYear(2030)).toBe(2028);
	});
});
