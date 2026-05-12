import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCaller,
	mockDeclaration,
} from "./helpers/declarationTestHelpers";

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
		const mockDeclarationWithIndicators = {
			submittedAt: null,
			indicatorAAnnualWomen: "100",
			indicatorAAnnualMen: "110",
			indicatorAHourlyWomen: "20",
			indicatorAHourlyMen: "22",
			indicatorBAnnualWomen: "50",
			indicatorBAnnualMen: "55",
			indicatorBHourlyWomen: "10",
			indicatorBHourlyMen: "11",
			indicatorCAnnualWomen: "95",
			indicatorCAnnualMen: "105",
			indicatorCHourlyWomen: "18",
			indicatorCHourlyMen: "20",
			indicatorDAnnualWomen: "45",
			indicatorDAnnualMen: "50",
			indicatorDHourlyWomen: "9",
			indicatorDHourlyMen: "10",
			indicatorEWomen: "30",
			indicatorEMen: "70",
			indicatorFAnnualWomen1: 10,
			indicatorFAnnualWomen2: 20,
			indicatorFAnnualWomen3: 30,
			indicatorFAnnualWomen4: 40,
			indicatorFAnnualMen1: 90,
			indicatorFAnnualMen2: 80,
			indicatorFAnnualMen3: 70,
			indicatorFAnnualMen4: 60,
			indicatorFHourlyWomen1: 5,
			indicatorFHourlyWomen2: 15,
			indicatorFHourlyWomen3: 25,
			indicatorFHourlyWomen4: 35,
			indicatorFHourlyMen1: 95,
			indicatorFHourlyMen2: 85,
			indicatorFHourlyMen3: 75,
			indicatorFHourlyMen4: 65,
		};

		it("sets status to awaiting_compliance_path_choice and step to 6", async () => {
			const mockDb = createMockDb([mockDeclarationWithIndicators]);
			const caller = await createCaller(mockDb);

			const result = await caller.submit();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "awaiting_compliance_path_choice",
					currentStep: 6,
				}),
			);
		});

		it("persists computed percentage columns on submit", async () => {
			const mockDb = createMockDb([mockDeclarationWithIndicators]);
			const caller = await createCaller(mockDb);

			await caller.submit();

			const setCall = mockSet.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall).toBeDefined();

			const expectedGlobalAnnualMeanGap = (110 - 100) / 110;
			expect(Number(setCall.globalAnnualMeanGap)).toBeCloseTo(
				expectedGlobalAnnualMeanGap,
			);

			const expectedVariableProportionWomen = 30 / 100;
			expect(Number(setCall.variableProportionWomen)).toBeCloseTo(
				expectedVariableProportionWomen,
			);

			const expectedAnnualQ1ProportionWomen = 10 / 100;
			expect(Number(setCall.annualQuartile1ProportionWomen)).toBeCloseTo(
				expectedAnnualQ1ProportionWomen,
			);
		});

		it("persists null percentage columns as null when inputs are null", async () => {
			const mockDb = createMockDb([
				{
					...mockDeclarationWithIndicators,
					indicatorAAnnualWomen: null,
					indicatorAAnnualMen: null,
				},
			]);
			const caller = await createCaller(mockDb);

			await caller.submit();

			const setCall = mockSet.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall).toBeDefined();
			expect(setCall.globalAnnualMeanGap).toBeNull();
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
		it("sets secondDeclarationSubmittedAt and step to 3", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.submitSecondDeclaration();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					secondDeclarationSubmittedAt: expect.any(Date),
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
					firstDeclarationPathChoice: "corrective_action",
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
					firstDeclarationPathChoice: "joint_evaluation",
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
		it("sets demarcheCompletedAt timestamp", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.completeCompliancePath();

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					demarcheCompletedAt: expect.any(Date),
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
			const setArg = mockSet.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setArg).not.toHaveProperty("indicatorFAnnualThreshold4");
			expect(setArg).not.toHaveProperty("indicatorFHourlyThreshold4");
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

		it("maps 3 thresholds + 4 counts per table with no *Threshold4 column", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			await caller.updateStep4(step4Input);

			const setArg = mockSet.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setArg).toHaveProperty("indicatorFAnnualThreshold1", "25000");
			expect(setArg).toHaveProperty("indicatorFAnnualThreshold2", "35000");
			expect(setArg).toHaveProperty("indicatorFAnnualThreshold3", "50000");
			expect(setArg).not.toHaveProperty("indicatorFAnnualThreshold4");
			expect(setArg).toHaveProperty("indicatorFHourlyThreshold1", "15");
			expect(setArg).toHaveProperty("indicatorFHourlyThreshold2", "20");
			expect(setArg).toHaveProperty("indicatorFHourlyThreshold3", "30");
			expect(setArg).not.toHaveProperty("indicatorFHourlyThreshold4");
			expect(setArg).toHaveProperty("indicatorFAnnualWomen4", null);
			expect(setArg).toHaveProperty("indicatorFHourlyWomen4", null);
		});

		it("stores null for Q4 threshold when it is an empty string", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			await caller.updateStep4({
				annual: [
					{ threshold: "10000", women: 3, men: 4 },
					{ threshold: "20000", women: 3, men: 4 },
					{ threshold: "30000", women: 2, men: 4 },
					{ threshold: "", women: 2, men: 3 },
				],
				hourly: [
					{ threshold: "10", women: 3, men: 4 },
					{ threshold: "20", women: 3, men: 4 },
					{ threshold: "30", women: 2, men: 4 },
					{ threshold: "", women: 2, men: 3 },
				],
			});

			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					indicatorFAnnualThreshold3: "30000",
					indicatorFHourlyThreshold3: "30",
				}),
			);
			const setArg = mockSet.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setArg).not.toHaveProperty("indicatorFAnnualThreshold4");
			expect(setArg).not.toHaveProperty("indicatorFHourlyThreshold4");
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.updateStep4(step4Input)).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});
});
