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

describe("companyRouter.list", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns companies with declaration status", async () => {
		const companyRows = [{ siren: "339787277", name: "Test Company" }];
		const declRows = [
			{ siren: "339787277", status: "submitted", currentStep: 6 },
		];

		// list uses: select().from().innerJoin().where() (no limit) for companies
		// then select().from().where() for declarations
		let selectCallCount = 0;
		const localMockSelect = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) {
				// companies query
				return {
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(companyRows),
						}),
					}),
				};
			}
			// declarations query
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(declRows),
				}),
			};
		});

		const mockDb = { select: localMockSelect } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.list();

		expect(result).toHaveLength(1);
		expect(result[0]?.siren).toBe("339787277");
		expect(result[0]?.declarationStatus).toBe("done");
	});

	it("returns empty list when user has no companies", async () => {
		const localMockSelect = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		const mockDb = { select: localMockSelect } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.list();

		expect(result).toEqual([]);
	});

	it("skips declaration fetch when no sirens found", async () => {
		const localMockSelect = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		const mockDb = { select: localMockSelect } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		await caller.list();

		// Only 1 select call (companies), no second call for declarations
		expect(localMockSelect).toHaveBeenCalledTimes(1);
	});
});

describe("companyRouter.getWithDeclarations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns company with declaration list", async () => {
		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: true,
		};

		const declRows = [
			{
				siren: "339787277",
				year: 2026,
				status: "submitted",
				currentStep: 6,
				updatedAt: new Date(),
				compliancePath: null,
				secondDeclarationStatus: null,
				complianceCompletedAt: null,
			},
		];

		let selectCallCount = 0;
		const localMockSelect = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) {
				// findUserCompany query
				return {
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([companyRow]),
							}),
						}),
					}),
				};
			}
			if (selectCallCount === 2) {
				// declarations query
				return {
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(declRows),
						}),
					}),
				};
			}
			// cseOpinions + jointEvaluationFiles queries
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};
		});

		const mockDb = { select: localMockSelect } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.company.siren).toBe("339787277");
		expect(result.declarations).toBeDefined();
	});
});

describe("companyRouter.updateHasCse", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("updates hasCse for the given company", async () => {
		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: false,
		};

		mockLimit.mockResolvedValue([companyRow]);
		mockWhere.mockReturnValue({ limit: mockLimit });
		mockInnerJoin.mockReturnValue({ where: mockWhere });
		mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
		mockSelect.mockReturnValue({ from: mockFrom });

		mockUpdateWhere.mockResolvedValue(undefined);
		mockSet.mockReturnValue({ where: mockUpdateWhere });
		mockUpdate.mockReturnValue({ set: mockSet });

		const mockDb = { select: mockSelect, update: mockUpdate } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		await caller.updateHasCse({ siren: "339787277", hasCse: true });

		expect(mockSet).toHaveBeenCalledWith({ hasCse: true });
	});
});

describe("companyRouter.getSanctionStatus", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns sanction status from SUIT API", async () => {
		const { fetchSanctionBySiren } = await import("~/server/services/suit");
		const fetchSanctionMock = vi.mocked(fetchSanctionBySiren);
		fetchSanctionMock.mockResolvedValue({
			hasSanction: false,
			validityDate: null,
		});

		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: true,
		};

		const mockDb = createMockDb([companyRow]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.getSanctionStatus({ siren: "339787277" });

		expect(fetchSanctionMock).toHaveBeenCalledWith("339787277");
		expect(result).toEqual({ hasSanction: false, validityDate: null });
	});

	it("returns default no-sanction when SUIT returns null", async () => {
		const { fetchSanctionBySiren } = await import("~/server/services/suit");
		const fetchSanctionMock = vi.mocked(fetchSanctionBySiren);
		fetchSanctionMock.mockResolvedValue(null);

		const companyRow = {
			siren: "339787277",
			name: "Test Company",
			address: "1 rue de Paris",
			nafCode: "6202A",
			workforce: 100,
			hasCse: true,
		};

		const mockDb = createMockDb([companyRow]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.getSanctionStatus({ siren: "339787277" });

		expect(result).toEqual({ hasSanction: false, validityDate: null });
	});

	it("throws when company is not found", async () => {
		const mockDb = createMockDb([]);

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		await expect(
			caller.getSanctionStatus({ siren: "000000000" }),
		).rejects.toThrow("Company not found or access denied");
	});
});
