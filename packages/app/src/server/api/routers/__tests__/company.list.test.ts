import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/services/suit");
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

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

		let selectCallCount = 0;
		const localMockSelect = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) {
				return {
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(companyRows),
						}),
					}),
				};
			}
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

		expect(localMockSelect).toHaveBeenCalledTimes(1);
	});

	it("returns to_complete when all declarations for the siren are cancelled", async () => {
		const companyRows = [{ siren: "123456789", name: "Acme" }];

		let selectCallCount = 0;
		const localMockSelect = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) {
				return {
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(companyRows),
						}),
					}),
				};
			}
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

		const result = await caller.list();

		expect(result).toHaveLength(1);
		expect(result[0]?.declarationStatus).toBe("to_complete");
	});

	it("returns status based on the active declaration when cancelled and active coexist", async () => {
		const companyRows = [{ siren: "123456789", name: "Acme" }];
		const activeDeclRows = [
			{ siren: "123456789", status: "submitted", currentStep: 6 },
		];

		let selectCallCount = 0;
		const localMockSelect = vi.fn().mockImplementation(() => {
			selectCallCount++;
			if (selectCallCount === 1) {
				return {
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockResolvedValue(companyRows),
						}),
					}),
				};
			}
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(activeDeclRows),
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
		expect(result[0]?.declarationStatus).toBe("done");
	});
});
