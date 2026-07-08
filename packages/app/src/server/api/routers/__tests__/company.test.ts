import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeDeclarationStatus } from "~/modules/my-space/declarationStatus";

vi.mock("~/server/services/suit");
vi.mock("~/server/services/weez");

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

	it("returns in_progress for awaiting_compliance_path_choice (action still expected)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for corrective_actions_chosen (waiting on 2nd decl)", () => {
		expect(
			computeDeclarationStatus({
				status: "corrective_actions_chosen",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for awaiting_revision_choice (user must pick a revised path)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_revision_choice",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns in_progress for awaiting_cse_opinion (still expecting CSE deposit)", () => {
		expect(
			computeDeclarationStatus({
				status: "awaiting_cse_opinion",
				currentStep: 6,
			}),
		).toBe("in_progress");
	});

	it("returns done only for demarche_completed (terminal FSM state)", () => {
		expect(
			computeDeclarationStatus({
				status: "demarche_completed",
				currentStep: 6,
			}),
		).toBe("done");
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
	// `where` on the from() result supports the impersonation bypass path
	// (no innerJoin); `innerJoin` supports the owner path.
	mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
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

describe("findUserCompany NAF label enrichment", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	async function callGet(companyRow: unknown) {
		const mockDb = createMockDb([companyRow]);
		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);
		return caller.get({ siren: "339787277" });
	}

	it("backfills nafLabel from Weez when null and persists it", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockResolvedValue({
			name: "Test Company",
			address: null,
			nafCode: "62.01Z",
			nafLabel: "Programmation informatique",
			region: null,
			departmentCode: null,
			departmentLabel: null,
			workforce: 100,
			statutDiffusion: null,
		});

		const result = await callGet({
			siren: "339787277",
			name: "Test Company",
			address: null,
			nafCode: "62.01Z",
			nafLabel: null,
			workforce: 100,
			hasCse: true,
		});

		expect(fetchCompanyBySiren).toHaveBeenCalledWith("339787277");
		expect(mockSet).toHaveBeenCalledWith({
			nafLabel: "Programmation informatique",
		});
		expect(result.nafLabel).toBe("Programmation informatique");
	});

	it("does not call Weez when nafLabel is already present", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");

		const result = await callGet({
			siren: "339787277",
			name: "Test Company",
			address: null,
			nafCode: "62.01Z",
			nafLabel: "Programmation informatique",
			workforce: 100,
			hasCse: true,
		});

		expect(fetchCompanyBySiren).not.toHaveBeenCalled();
		expect(result.nafLabel).toBe("Programmation informatique");
	});

	it("does not call Weez for a non-diffusible company (no nafCode)", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");

		const result = await callGet({
			siren: "339787277",
			name: "Entreprise non diffusible",
			address: null,
			nafCode: null,
			nafLabel: null,
			workforce: 100,
			hasCse: true,
		});

		expect(fetchCompanyBySiren).not.toHaveBeenCalled();
		expect(result.nafLabel).toBeNull();
	});

	it("keeps nafLabel null and does not throw when Weez fails", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		vi.mocked(fetchCompanyBySiren).mockRejectedValue(new Error("Weez down"));

		const result = await callGet({
			siren: "339787277",
			name: "Test Company",
			address: null,
			nafCode: "62.01Z",
			nafLabel: null,
			workforce: 100,
			hasCse: true,
		});

		expect(result.nafLabel).toBeNull();
	});

	it("does not backfill during admin impersonation (read-only)", async () => {
		const { fetchCompanyBySiren } = await import("~/server/services/weez");
		const mockDb = createMockDb([
			{
				siren: "339787277",
				name: "Test Company",
				address: null,
				nafCode: "62.01Z",
				nafLabel: null,
				workforce: 100,
				hasCse: true,
			},
		]);
		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: {
				user: {
					id: "admin-1",
					isAdmin: true,
					impersonation: { siren: "339787277" },
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);

		const result = await caller.get({ siren: "339787277" });

		expect(fetchCompanyBySiren).not.toHaveBeenCalled();
		expect(result.nafLabel).toBeNull();
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

	it("refuses the update when the admin is impersonating the company", async () => {
		const mockDb = { select: mockSelect, update: mockUpdate } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: {
				user: {
					id: "user-1",
					isAdmin: true,
					impersonation: { siren: "339787277", name: "Acme" },
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(
			caller.updateHasCse({ siren: "339787277", hasCse: true }),
		).rejects.toThrow("Mode mimoquage");
		expect(mockSet).not.toHaveBeenCalled();
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
