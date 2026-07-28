import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCaller,
	mockDeclaration,
} from "./helpers/declarationTestHelpers";
import { withLockMiddleware } from "./helpers/lockTestHelpers";

// updateEmployeeCategories runs through `declarationLockedWriteProcedure`, so
// the lock middleware issues two `ctx.db.select` calls before the handler;
// `withLockMiddleware` answers both with the current user holding the lock.
function createLockedCaller(mockDb: unknown) {
	return createCaller(withLockMiddleware(mockDb));
}

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
const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn();
const mockValues = vi.fn();
const mockInsert = vi.fn();
const mockTransaction = vi.fn();

describe("declarationRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("updateEmployeeCategories", () => {
		function createEmployeeTx(
			declaration: unknown,
			existingJobs: unknown[] = [],
		) {
			let selectCallCount = 0;
			const txSelectWhere = vi.fn().mockImplementation(() => {
				selectCallCount++;
				const result = Promise.resolve(
					selectCallCount === 1 ? [] : existingJobs,
				);
				(result as unknown as Record<string, unknown>).limit = vi
					.fn()
					.mockResolvedValue(declaration ? [declaration] : []);
				return result;
			});
			const txSelectFrom = vi.fn().mockReturnValue({ where: txSelectWhere });
			const txSelect = vi.fn().mockReturnValue({ from: txSelectFrom });

			mockUpdateWhere.mockResolvedValue(undefined);
			mockSet.mockReturnValue({ where: mockUpdateWhere });
			mockUpdate.mockReturnValue({ set: mockSet });

			mockDeleteWhere.mockResolvedValue(undefined);
			mockDelete.mockReturnValue({ where: mockDeleteWhere });

			const mockReturningFn = vi.fn().mockResolvedValue([{ id: "new-job-1" }]);
			mockValues.mockReturnValue({
				returning: mockReturningFn,
				onConflictDoNothing: vi
					.fn()
					.mockReturnValue({ returning: mockReturningFn }),
			});
			mockInsert.mockReturnValue({ values: mockValues });

			return {
				select: txSelect,
				update: mockUpdate,
				delete: mockDelete,
				insert: mockInsert,
			};
		}

		// A category with a non-zero headcount for a sex must carry that sex's 4
		// pay cells, otherwise the schema `.refine()` rejects the input (bug #3948).
		const completePayData = {
			womenCount: 10,
			menCount: 15,
			annualBaseWomen: "30000",
			annualVariableWomen: "2000",
			hourlyBaseWomen: "18",
			hourlyVariableWomen: "1.5",
			annualBaseMen: "32000",
			annualVariableMen: "2500",
			hourlyBaseMen: "19",
			hourlyVariableMen: "1.8",
		};

		const employeeInput = {
			declarationType: "initial" as const,
			source: "dads",
			categories: [
				{
					name: "Cadres",
					detail: "Senior",
					data: completePayData,
				},
			],
		};

		it("creates job and employee categories for initial declaration", async () => {
			const tx = createEmployeeTx(mockDeclaration);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			const result = await caller.updateEmployeeCategories(employeeInput);

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ currentStep: 5 }),
			);
		});

		it("updates employee categories for correction declaration", async () => {
			const existingJobs = [{ id: "job-1", categoryIndex: 0, name: "Cadres" }];
			const tx = createEmployeeTx(mockDeclaration, existingJobs);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			const correctionInput = {
				declarationType: "correction" as const,
				source: "dads",
				categories: [
					{
						name: "Cadres",
						detail: "Senior",
						data: { ...completePayData, womenCount: 12, menCount: 18 },
					},
				],
				referencePeriodStart: "2025-01-01",
				referencePeriodEnd: "2025-12-31",
			};

			const result = await caller.updateEmployeeCategories(correctionInput);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					secondDeclarationStep: 2,
					secondDeclReferencePeriodStart: "2025-01-01",
					secondDeclReferencePeriodEnd: "2025-12-31",
				}),
			);
		});

		it("throws when declaration not found", async () => {
			const tx = createEmployeeTx(null);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			await expect(
				caller.updateEmployeeCategories(employeeInput),
			).rejects.toThrow("Déclaration introuvable");
		});

		it("rejects a category with headcounts but no pay amounts (#3948)", async () => {
			const tx = createEmployeeTx(mockDeclaration);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			const incompleteInput = {
				declarationType: "initial" as const,
				source: "dads",
				categories: [
					{
						name: "Cadres",
						detail: "Senior",
						data: { womenCount: 2, menCount: 2 },
					},
				],
			};

			await expect(
				caller.updateEmployeeCategories(incompleteInput),
			).rejects.toThrow(
				"Veuillez renseigner toutes les données de rémunération avant de passer à l'étape suivante.",
			);
			expect(mockTransaction).not.toHaveBeenCalled();
		});
	});
});
