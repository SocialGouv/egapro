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
	};
});

const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoNothing = vi.fn();
const mockReturning = vi.fn();
const mockTransaction = vi.fn();

function createMockTx(selectRows: unknown[] = []) {
	mockLimit.mockResolvedValue(selectRows);
	mockWhere.mockReturnValue({ limit: mockLimit });
	mockFrom.mockReturnValue({ where: mockWhere });
	mockSelect.mockReturnValue({ from: mockFrom });

	mockUpdateWhere.mockResolvedValue(undefined);
	mockSet.mockReturnValue({ where: mockUpdateWhere });
	mockUpdate.mockReturnValue({ set: mockSet });

	mockDeleteWhere.mockResolvedValue(undefined);
	mockDelete.mockReturnValue({ where: mockDeleteWhere });

	mockReturning.mockResolvedValue(selectRows);
	mockOnConflictDoNothing.mockReturnValue({ returning: mockReturning });
	mockValues.mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
	mockInsert.mockReturnValue({ values: mockValues });

	return {
		select: mockSelect,
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
	};
}

function createMockDb(selectRows: unknown[] = []) {
	const tx = createMockTx(selectRows);

	mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
		fn(tx),
	);

	return {
		select: mockSelect,
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
		transaction: mockTransaction,
	} as unknown;
}

function createCaller(mockDb: unknown, siret = "33978727700015") {
	return import("../declaration").then(({ declarationRouter }) =>
		declarationRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1", siret }, expires: "" },
			headers: new Headers(),
		} as never),
	);
}

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

describe("declarationRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getOrCreate", () => {
		function createGetOrCreateTx(
			existingRows: unknown[],
			insertReturns: unknown[] | null = null,
			retryRows: unknown[] | null = null,
		) {
			let selectCallCount = 0;
			const txSelect = vi.fn().mockImplementation(() => ({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockImplementation(() => {
							selectCallCount++;
							if (selectCallCount === 1) return Promise.resolve(existingRows);
							if (retryRows && selectCallCount === 2)
								return Promise.resolve(retryRows);
							return Promise.resolve([]);
						}),
					}),
				}),
			}));

			const txInsert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoNothing: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue(insertReturns ?? []),
					}),
				}),
			});

			return { select: txSelect, insert: txInsert, delete: mockDelete };
		}

		// Mock for the GIP data select outside the transaction (returns empty = no prefill)
		function gipSelect() {
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([]),
					}),
				}),
			};
		}

		it("returns existing declaration when found", async () => {
			const tx = createGetOrCreateTx([mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				select: vi.fn().mockImplementation(gipSelect),
				transaction: mockTransaction,
			} as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.getOrCreate();

			expect(result.declaration).toBeDefined();
			expect(mockTransaction).toHaveBeenCalled();
		});

		it("creates new declaration when none exists", async () => {
			const tx = createGetOrCreateTx([], [mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				select: vi.fn().mockImplementation(gipSelect),
				transaction: mockTransaction,
			} as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.getOrCreate();

			expect(result.declaration).toBeDefined();
			expect(result.jobCategories).toEqual([]);
			expect(result.employeeCategories).toEqual([]);
		});

		it("retries select after concurrent insert (onConflictDoNothing returns empty)", async () => {
			const tx = createGetOrCreateTx([], [], [mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				select: vi.fn().mockImplementation(gipSelect),
				transaction: mockTransaction,
			} as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.getOrCreate();

			expect(result.declaration).toBeDefined();
		});

		it("throws NOT_FOUND when existing row is unexpectedly undefined", async () => {
			// existing.length > 0 but existing[0] is undefined (defensive branch)
			const tx = createGetOrCreateTx([undefined]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.getOrCreate()).rejects.toThrow(
				"Declaration introuvable",
			);
		});

		it("throws INTERNAL_SERVER_ERROR when retry also fails", async () => {
			const tx = createGetOrCreateTx([], [], []);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.getOrCreate()).rejects.toThrow(
				"Erreur lors de la création",
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.getOrCreate()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("submit", () => {
		it("sets status to submitted and step to 6", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.submit();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "submitted",
					currentStep: 6,
				}),
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.submit()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("submitSecondDeclaration", () => {
		it("sets secondDeclarationStatus to submitted and step to 3", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.submitSecondDeclaration();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					secondDeclarationStatus: "submitted",
					secondDeclarationStep: 3,
				}),
			);
		});
	});

	describe("saveCompliancePath", () => {
		it("saves a valid compliance path", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.saveCompliancePath({
				path: "corrective_action",
			});

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					compliancePath: "corrective_action",
				}),
			);
		});

		it("saves joint_evaluation path", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.saveCompliancePath({
				path: "joint_evaluation",
			});

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					compliancePath: "joint_evaluation",
				}),
			);
		});

		it("rejects invalid compliance path", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			await expect(
				caller.saveCompliancePath({ path: "invalid_path" as never }),
			).rejects.toThrow();
		});
	});

	describe("completeCompliancePath", () => {
		it("sets complianceCompletedAt timestamp", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.completeCompliancePath();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					complianceCompletedAt: expect.any(Date),
					updatedAt: expect.any(Date),
				}),
			);
		});
	});

	describe("updateStep1", () => {
		it("updates totalWomen and totalMen", async () => {
			const tx = createMockTx([mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep1({
				totalWomen: 30,
				totalMen: 40,
			});

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
		});

		it("skips reset when totals have not changed", async () => {
			const unchangedDecl = {
				...mockDeclaration,
				totalWomen: 30,
				totalMen: 40,
			};
			const tx = createMockTx([unchangedDecl]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep1({
				totalWomen: 30,
				totalMen: 40,
			});

			expect(result).toEqual({ success: true });
			// set should NOT include score resets
			expect(mockSet).toHaveBeenCalledWith(
				expect.not.objectContaining({ remunerationScore: null }),
			);
		});

		it("resets downstream scores when totals change", async () => {
			const tx = createMockTx([mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep1({
				totalWomen: 50,
				totalMen: 60,
			});

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ remunerationScore: null }),
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(
				caller.updateStep1({ totalWomen: 10, totalMen: 20 }),
			).rejects.toThrow("SIRET manquant ou invalide dans la session");
		});
	});

	describe("updateStep2", () => {
		it("saves indicator A and C values", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep2({
				indicatorAAnnualWomen: "30000",
				indicatorAAnnualMen: "32000",
				indicatorAHourlyWomen: "18.5",
				indicatorAHourlyMen: "19.0",
				indicatorCAnnualWomen: "28000",
				indicatorCAnnualMen: "29000",
				indicatorCHourlyWomen: "17.0",
				indicatorCHourlyMen: "17.5",
			});

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ currentStep: 2 }),
			);
		});

		it("saves with all optional fields undefined", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep2({});

			expect(result).toEqual({ success: true });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.updateStep2({})).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("updateStep3", () => {
		it("saves indicator B, D and E values", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep3({
				indicatorBAnnualWomen: "31000",
				indicatorBAnnualMen: "33000",
				indicatorBHourlyWomen: "17.5",
				indicatorBHourlyMen: "18.0",
				indicatorDAnnualWomen: "27000",
				indicatorDAnnualMen: "28000",
				indicatorDHourlyWomen: "16.0",
				indicatorDHourlyMen: "16.5",
				indicatorEWomen: "5000",
				indicatorEMen: "6000",
			});

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ currentStep: 3 }),
			);
		});

		it("saves with all optional fields undefined", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep3({});

			expect(result).toEqual({ success: true });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.updateStep3({})).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("updateStep4", () => {
		type Quartile = { threshold?: string; women?: number; men?: number };
		type Step4Input = {
			annual: [Quartile, Quartile, Quartile, Quartile];
			hourly: [Quartile, Quartile, Quartile, Quartile];
		};
		const step4Input: Step4Input = {
			annual: [
				{ threshold: "25000", women: 10, men: 12 },
				{ threshold: "35000", women: 8, men: 9 },
				{ threshold: "50000", women: 5, men: 6 },
				{},
			],
			hourly: [
				{ threshold: "15", women: 20, men: 22 },
				{ threshold: "20", women: 15, men: 18 },
				{ threshold: "30", women: 10, men: 11 },
				{},
			],
		};

		it("saves indicator F annual and hourly thresholds", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.updateStep4(step4Input);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ currentStep: 4 }),
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.updateStep4(step4Input)).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
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
