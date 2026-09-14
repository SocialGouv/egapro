import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsertValues, mockEmitActivityLog } = vi.hoisted(() => ({
	mockInsertValues: vi.fn(),
	mockEmitActivityLog: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {
		insert: () => ({ values: mockInsertValues }),
	},
}));

vi.mock("~/server/db/auditSchema", () => ({
	actionLogs: { __mock: "actionLogs" },
}));

// Keeps `deriveErrorCode` real (log.ts relies on it) while letting tests spy
// on what `logAction` hands off to the stdout mirror (#3705).
vi.mock("../activityLog", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../activityLog")>();
	return {
		...actual,
		emitActivityLog: (...args: unknown[]) => mockEmitActivityLog(...args),
	};
});

const { logAction } = await import("../log");
const { AUDIT_ACTIONS } = await import("~/modules/audit");

describe("logAction", () => {
	beforeEach(() => {
		mockInsertValues.mockReset();
		mockInsertValues.mockResolvedValue(undefined);
		mockEmitActivityLog.mockReset();
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

	// #3705 — logAction mirrors every event to stdout, before the DB insert.
	describe("stdout activity log mirror (#3705)", () => {
		it("emits before inserting, carrying the resolved category and the origin", async () => {
			const callOrder: string[] = [];
			mockEmitActivityLog.mockImplementation(() => callOrder.push("emit"));
			mockInsertValues.mockImplementation(async () => {
				callOrder.push("insert");
			});

			await logAction({
				action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
				status: "success",
				userId: "user-1",
				siren: "123456789",
				metadata: { year: 2026 },
				ipAddress: "203.0.113.45",
				durationMs: 42,
				origin: {
					source: "trpc",
					route: "declaration.submit",
					operation: "mutation",
				},
			});

			expect(callOrder).toEqual(["emit", "insert"]);
			expect(mockEmitActivityLog).toHaveBeenCalledOnce();
			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				source: "trpc",
				action: "declaration.submit",
				category: "mutation",
				route: "declaration.submit",
				operation: "mutation",
				status: "success",
				durationMs: 42,
				userId: "user-1",
				siren: "123456789",
				ip: "203.0.113.45",
				rawInput: { year: 2026 },
			});
		});

		it("defaults origin fields to null for a direct call (auth events, crons…)", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN,
				status: "success",
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				source: null,
				route: null,
				operation: null,
			});
		});

		it("derives the stdout errorCode from errorMessage", async () => {
			await logAction({
				action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
				status: "failure",
				errorMessage: "OAUTH_CALLBACK_ERROR: {}",
			});

			expect(mockEmitActivityLog.mock.calls[0]?.[0]).toMatchObject({
				errorCode: "OAUTH_CALLBACK_ERROR",
			});
		});

		// S8 — a failure while building/emitting the stdout line must never
		// block the DB insert, nor make logAction reject.
		it("still inserts and resolves when the stdout mirror throws", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockEmitActivityLog.mockImplementation(() => {
				throw new Error("line construction failed");
			});

			await expect(
				logAction({
					action: AUDIT_ACTIONS.AUTH_LOGIN,
					status: "success",
				}),
			).resolves.toBeUndefined();

			expect(mockInsertValues).toHaveBeenCalledOnce();
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});
});
