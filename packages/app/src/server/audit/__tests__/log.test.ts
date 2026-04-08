import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsertValues } = vi.hoisted(() => ({
	mockInsertValues: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {
		insert: () => ({ values: mockInsertValues }),
	},
}));

vi.mock("~/server/db/auditSchema", () => ({
	actionLogs: { __mock: "actionLogs" },
}));

const { logAction } = await import("../log");
const { AUDIT_ACTIONS } = await import("~/modules/audit");

describe("logAction", () => {
	beforeEach(() => {
		mockInsertValues.mockReset();
		mockInsertValues.mockResolvedValue(undefined);
	});

	it("inserts a row with all provided fields and resolves the category from the action key", async () => {
		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
			status: "success",
			userId: "user-1",
			userEmail: "test@example.com",
			siren: "123456789",
			metadata: { year: 2026 },
			ipAddress: "1.2.3.4",
			userAgent: "Mozilla",
			durationMs: 42,
		});

		expect(mockInsertValues).toHaveBeenCalledOnce();
		const row = mockInsertValues.mock.calls[0]?.[0];
		expect(row).toMatchObject({
			action: "declaration.submit",
			category: "mutation",
			status: "success",
			userId: "user-1",
			userEmail: "test@example.com",
			siren: "123456789",
			metadata: { year: 2026 },
			ipAddress: "1.2.3.4",
			userAgent: "Mozilla",
			durationMs: 42,
		});
	});

	it("normalizes optional fields to null when omitted", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGIN,
			status: "success",
		});

		const row = mockInsertValues.mock.calls[0]?.[0];
		expect(row).toMatchObject({
			action: "auth.login",
			category: "auth",
			userId: null,
			userEmail: null,
			siren: null,
			metadata: null,
			ipAddress: null,
			userAgent: null,
			durationMs: null,
		});
	});

	it("never throws even when the database insert fails", async () => {
		mockInsertValues.mockRejectedValueOnce(new Error("db down"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(
			logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN,
				status: "failure",
			}),
		).resolves.toBeUndefined();
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("accepts an explicit category override", async () => {
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGIN,
			status: "success",
			category: "system",
		});
		expect(mockInsertValues.mock.calls[0]?.[0]).toMatchObject({
			category: "system",
		});
	});
});
