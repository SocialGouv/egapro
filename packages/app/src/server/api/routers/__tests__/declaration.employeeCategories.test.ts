import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const mockDeclaration = {
	id: "decl-1",
	siren: "339787277",
	year: 2026,
	currentStep: 0,
	status: "draft",
	declarantId: "user-1",
	totalWomen: null,
	totalMen: null,
};

function createCaller(
	mockDb: unknown,
	siret: string | null = "33978727700015",
	impersonation: { siren: string; name: string } | null = null,
) {
	return import("../declaration").then(({ declarationRouter }) =>
		declarationRouter.createCaller({
			db: mockDb,
			session: {
				user: {
					id: "user-1",
					siret,
					isAdmin: impersonation !== null,
					impersonation,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never),
	);
}

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

		const employeeInput = {
			declarationType: "initial" as const,
			source: "dads",
			categories: [
				{
					name: "Cadres",
					detail: "Senior",
					data: { womenCount: 10, menCount: 15 },
				},
			],
		};

		it("creates job and employee categories for initial declaration", async () => {
			const tx = createEmployeeTx(mockDeclaration);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

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
			const caller = await createCaller(mockDb);

			const correctionInput = {
				declarationType: "correction" as const,
				source: "dads",
				categories: [
					{
						name: "Cadres",
						detail: "Senior",
						data: { womenCount: 12, menCount: 18 },
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
			const caller = await createCaller(mockDb);

			await expect(
				caller.updateEmployeeCategories(employeeInput),
			).rejects.toThrow("Déclaration introuvable");
		});
	});
});
