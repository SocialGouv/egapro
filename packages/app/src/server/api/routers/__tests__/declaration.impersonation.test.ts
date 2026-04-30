import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "./helpers/declarationTestHelpers";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("../declarationHelpers", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("../declarationHelpers")>();
	return {
		...original,
		fetchAllCategories: vi.fn().mockResolvedValue({
			jobCategories: [],
			employeeCategories: [],
		}),
		deleteJobAndEmployeeCategories: vi.fn().mockResolvedValue(undefined),
		fetchPreviousYearJobCategories: vi.fn().mockResolvedValue(null),
	};
});

const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockTransaction = vi.fn();

function createMockDb() {
	mockUpdateWhere.mockResolvedValue(undefined);
	mockSet.mockReturnValue({ where: mockUpdateWhere });
	mockUpdate.mockReturnValue({ set: mockSet });
	return {
		select: vi.fn(),
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
		transaction: mockTransaction,
	} as unknown;
}

describe("declarationRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("admin impersonation read-only guard", () => {
		const impersonation = { siren: "339787277", name: "Acme" };

		it("refuses updateStep1 when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(
				caller.updateStep1({ totalWomen: 10, totalMen: 20 }),
			).rejects.toThrow("Mode mimoquage");
		});

		it("refuses submit when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(caller.submit()).rejects.toThrow("Mode mimoquage");
		});

		it("refuses submitSecondDeclaration when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(caller.submitSecondDeclaration()).rejects.toThrow(
				"Mode mimoquage",
			);
		});

		it("refuses saveCompliancePath when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(
				caller.saveCompliancePath({ path: "corrective_action" }),
			).rejects.toThrow("Mode mimoquage");
		});

		it("refuses completeCompliancePath when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(caller.completeCompliancePath()).rejects.toThrow(
				"Mode mimoquage",
			);
		});

		it("returns a placeholder declaration in mimoquage when none exists (no insert)", async () => {
			const emptySelect = () =>
				vi.fn().mockImplementation(() => ({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}));
			const insertSpy = vi.fn();
			const tx = {
				select: emptySelect(),
				insert: insertSpy,
				delete: vi.fn(),
			};
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				transaction: mockTransaction,
				select: emptySelect(),
			} as unknown;
			const caller = await createCaller(mockDb, null, impersonation);

			const result = await caller.getOrCreate();
			expect(result.declaration.id).toBe("");
			expect(result.declaration.siren).toBe(impersonation.siren);
			expect(result.declaration.status).toBe("draft");
			expect(result.declaration.currentStep).toBe(0);
			expect(result.jobCategories).toEqual([]);
			expect(result.employeeCategories).toEqual([]);
			expect(insertSpy).not.toHaveBeenCalled();
		});

		it("allows getOrCreate when an existing declaration is returned", async () => {
			const existingTx = (() => {
				const txSelect = vi.fn().mockImplementation(() => ({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									id: "decl-1",
									siren: "339787277",
									year: 2026,
									currentStep: 0,
									status: "draft",
									declarantId: "user-1",
									totalWomen: null,
									totalMen: null,
								},
							]),
						}),
					}),
				}));
				return { select: txSelect, insert: vi.fn(), delete: vi.fn() };
			})();
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(existingTx),
			);
			const mockDb = {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
					}),
				}),
				transaction: mockTransaction,
			} as unknown;
			const caller = await createCaller(mockDb, null, impersonation);

			const result = await caller.getOrCreate();
			expect(result.declaration).toBeDefined();
		});
	});
});
