import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeDeclarationStatus } from "~/modules/my-space/declarationStatus";

vi.mock("~/server/services/suit");

describe("computeDeclarationStatus", () => {
	it("returns to_complete when no declaration exists", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("returns to_complete for draft status at step 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
	});

	it("returns to_complete for draft status with null step", () => {
		expect(
			computeDeclarationStatus({ status: "draft", currentStep: null }),
		).toBe("to_complete");
	});

	it("returns in_progress for draft status at step > 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("returns done for submitted status", () => {
		expect(
			computeDeclarationStatus({ status: "submitted", currentStep: 6 }),
		).toBe("done");
	});

	it("returns in_progress for any other status", () => {
		expect(computeDeclarationStatus({ status: "review", currentStep: 2 })).toBe(
			"in_progress",
		);
	});
});

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/env", () => ({
	env: {
		NODE_ENV: "test",
		DATABASE_URL: "postgres://localhost/test",
	},
}));

const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockInnerJoin = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

function createMockDb(rows: unknown[]) {
	mockLimit.mockResolvedValue(rows);
	mockWhere.mockReturnValue({ limit: mockLimit });
	mockInnerJoin.mockReturnValue({ where: mockWhere });
	mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
	mockSelect.mockReturnValue({ from: mockFrom });

	mockUpdateWhere.mockResolvedValue(undefined);
	mockSet.mockReturnValue({ where: mockUpdateWhere });
	mockUpdate.mockReturnValue({ set: mockSet });

	return {
		select: mockSelect,
		update: mockUpdate,
	} as unknown;
}

describe("findUserCompany CSE auto-fetch", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches CSE from SUIT API when hasCse is null and updates the DB", async () => {
		const { fetchCseBySiren } = await import("~/server/services/suit");
		const fetchCseMock = vi.mocked(fetchCseBySiren);
		fetchCseMock.mockResolvedValue(true);

		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: null,
		};

		const mockDb = createMockDb([companyRow]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.get({ siren: "339787277" });

		expect(fetchCseMock).toHaveBeenCalledWith("339787277");
		expect(mockUpdate).toHaveBeenCalled();
		expect(mockSet).toHaveBeenCalledWith({ hasCse: true });
		expect(result.hasCse).toBe(true);
	});

	it("does not fetch CSE when hasCse is already set", async () => {
		const { fetchCseBySiren } = await import("~/server/services/suit");
		const fetchCseMock = vi.mocked(fetchCseBySiren);

		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: false,
		};

		const mockDb = createMockDb([companyRow]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.get({ siren: "339787277" });

		expect(fetchCseMock).not.toHaveBeenCalled();
		expect(result.hasCse).toBe(false);
	});

	it("leaves hasCse as null when SUIT API returns null", async () => {
		const { fetchCseBySiren } = await import("~/server/services/suit");
		const fetchCseMock = vi.mocked(fetchCseBySiren);
		fetchCseMock.mockResolvedValue(null);

		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: null,
		};

		const mockDb = createMockDb([companyRow]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.get({ siren: "339787277" });

		expect(fetchCseMock).toHaveBeenCalledWith("339787277");
		expect(mockUpdate).not.toHaveBeenCalled();
		expect(result.hasCse).toBeNull();
	});

	it("throws when company is not found", async () => {
		const mockDb = createMockDb([]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		await expect(caller.get({ siren: "000000000" })).rejects.toThrow(
			"Company not found or access denied",
		);
	});
});
