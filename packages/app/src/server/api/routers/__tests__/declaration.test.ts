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

type DeclarationStateRow = {
	id: string;
	siren: string;
	year: number;
	status: string;
	rulesVersion: string;
	cseRequired: boolean;
	phase2Required?: boolean;
	indicatorGRequired?: boolean;
	firstDeclarationPathChoice:
		| "justify"
		| "corrective_action"
		| "joint_evaluation"
		| null;
	secondDeclarationPathChoice:
		| "justify"
		| "corrective_action"
		| "joint_evaluation"
		| null;
	submittedAt: Date | null;
	indicatorAAnnualWomen?: string | null;
	indicatorAAnnualMen?: string | null;
};

type CompanyRow = {
	siren: string;
	workforce: number | null;
	hasCse: boolean | null;
};

const INDICATOR_FIELDS_WITHOUT_GAP: Record<string, string | number | null> = {
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

function buildDeclaration(
	overrides: Partial<DeclarationStateRow> = {},
): DeclarationStateRow {
	return {
		id: "decl-1",
		siren: "339787277",
		year: 2027,
		status: "draft",
		rulesVersion: "2027.1",
		cseRequired: false,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		submittedAt: null,
		...INDICATOR_FIELDS_WITHOUT_GAP,
		...overrides,
	};
}

function buildCompany(overrides: Partial<CompanyRow> = {}): CompanyRow {
	return {
		siren: "339787277",
		workforce: 80,
		hasCse: false,
		...overrides,
	};
}

function createSelectQueue(rows: unknown[][]) {
	let index = 0;
	const innerJoin = vi.fn();

	const limit = vi.fn().mockImplementation(() => {
		const current = rows[index] ?? [];
		index++;
		return Promise.resolve(current);
	});

	const where = vi.fn().mockImplementation(() => {
		const current = rows[index] ?? [];
		const promise = Promise.resolve(current);
		return Object.assign(promise, { limit });
	});

	innerJoin.mockReturnValue({ where });
	const from = vi.fn().mockReturnValue({ where, innerJoin });

	const select = vi.fn().mockImplementation(() => {
		return { from };
	});

	const dropFirst = (): unknown[] => {
		const first = rows[index] ?? [];
		index++;
		return first;
	};

	return { select, dropFirst, getIndex: () => index };
}

function createSubmitMockDb(
	declaration: DeclarationStateRow,
	company: CompanyRow,
	employeeCategories: Array<Record<string, unknown>> = [],
) {
	const joinRows = employeeCategories.map((ec) => ({ employee_category: ec }));
	const selectQueue = createSelectQueue([[declaration], [company], joinRows]);

	const update = vi.fn();
	const set = vi.fn();
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	set.mockReturnValue({ where: updateWhere });
	update.mockReturnValue({ set });

	return {
		db: {
			select: selectQueue.select,
			update,
		} as unknown,
		set,
		update,
	};
}

function createOneRowSelectDb(
	declaration: DeclarationStateRow,
	correctionCategories: Array<Record<string, unknown>> = [],
) {
	const joinRows = correctionCategories.map((ec) => ({
		employee_category: ec,
	}));
	const selectQueue = createSelectQueue([[declaration], joinRows]);

	const update = vi.fn();
	const set = vi.fn();
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	set.mockReturnValue({ where: updateWhere });
	update.mockReturnValue({ set });

	return {
		db: {
			select: selectQueue.select,
			update,
		} as unknown,
		set,
		update,
	};
}

function createSimpleSelectDb(declaration: DeclarationStateRow) {
	const selectQueue = createSelectQueue([[declaration]]);
	const update = vi.fn();
	const set = vi.fn();
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	set.mockReturnValue({ where: updateWhere });
	update.mockReturnValue({ set });

	return {
		db: {
			select: selectQueue.select,
			update,
		} as unknown,
		set,
		update,
	};
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

	describe("submit (rules engine)", () => {
		it("transitions draft → demarche_completed for small company without CSE (S1)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 80, hasCse: false });
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createCaller(ctx.db);

			const result = await caller.submit();

			expect(result).toEqual({ success: true });
			expect(ctx.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "demarche_completed",
					currentStep: 6,
					phase2Required: false,
					cseRequired: false,
					indicatorGRequired: false,
				}),
			);
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.submittedAt).toBeInstanceOf(Date);
			expect(setCall.demarcheCompletedAt).toBeInstanceOf(Date);
		});

		it("transitions draft → awaiting_cse_opinion for 120-employee with CSE without gap (S3)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 120, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "100", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(declaration, company, employeeCategories);
			const caller = await createCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.cseRequired).toBe(true);
			expect(setCall.phase2Required).toBe(false);
		});

		it("transitions draft → awaiting_compliance_path_choice when gap detected and workforce >= 100 (S8)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 130, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "85", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(declaration, company, employeeCategories);
			const caller = await createCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_compliance_path_choice");
			expect(setCall.phase2Required).toBe(true);
			expect(setCall.cseRequired).toBe(true);
		});

		it("preserves the original submittedAt on resubmission", async () => {
			const originalDate = new Date("2027-04-01T00:00:00Z");
			const declaration = buildDeclaration({
				status: "draft",
				submittedAt: originalDate,
			});
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.submittedAt).toEqual(originalDate);
		});

		it("persists computed percentage columns on submit", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			const expectedGlobalAnnualMeanGap = (110 - 100) / 110;
			expect(Number(setCall.globalAnnualMeanGap)).toBeCloseTo(
				expectedGlobalAnnualMeanGap,
			);
		});

		it("throws NOT_FOUND when declaration is missing", async () => {
			const selectQueue = createSelectQueue([[]]);
			const update = vi.fn();
			const mockDb = {
				select: selectQueue.select,
				update,
			} as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.submit()).rejects.toThrow();
		});

		it("throws NOT_FOUND when company is missing", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const selectQueue = createSelectQueue([[declaration], []]);
			const update = vi.fn();
			const mockDb = {
				select: selectQueue.select,
				update,
			} as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.submit()).rejects.toThrow("Entreprise introuvable");
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.submit()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("submitSecondDeclaration (rules engine)", () => {
		it("transitions corrective_actions_chosen → awaiting_revision_choice when gap persists (S15)", async () => {
			const declaration = buildDeclaration({
				status: "corrective_actions_chosen",
				cseRequired: true,
			});
			const employeeCategories = [
				{ annualBaseWomen: "80", annualBaseMen: "100" },
			];
			const ctx = createOneRowSelectDb(declaration, employeeCategories);
			const caller = await createCaller(ctx.db);

			const result = await caller.submitSecondDeclaration();

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_revision_choice");
			expect(setCall.phase2RevisionRequired).toBe(true);
			expect(setCall.secondDeclarationSubmittedAt).toBeInstanceOf(Date);
		});

		it("transitions corrective_actions_chosen → demarche_completed when gap resolved without CSE (S13)", async () => {
			const declaration = buildDeclaration({
				status: "corrective_actions_chosen",
				cseRequired: false,
			});
			const employeeCategories = [
				{ annualBaseWomen: "100", annualBaseMen: "100" },
			];
			const ctx = createOneRowSelectDb(declaration, employeeCategories);
			const caller = await createCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			expect(setCall.phase2RevisionRequired).toBe(false);
			expect(setCall.demarcheCompletedAt).toBeInstanceOf(Date);
		});

		it("transitions corrective_actions_chosen → awaiting_cse_opinion when gap resolved with CSE (S14)", async () => {
			const declaration = buildDeclaration({
				status: "corrective_actions_chosen",
				cseRequired: true,
			});
			const employeeCategories = [
				{ annualBaseWomen: "100", annualBaseMen: "100" },
			];
			const ctx = createOneRowSelectDb(declaration, employeeCategories);
			const caller = await createCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.phase2RevisionRequired).toBe(false);
		});

		it("throws NOT_FOUND when declaration is missing", async () => {
			const selectQueue = createSelectQueue([[]]);
			const mockDb = {
				select: selectQueue.select,
				update: vi.fn(),
			} as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.submitSecondDeclaration()).rejects.toThrow();
		});
	});

	describe("saveCompliancePath (rules engine)", () => {
		it("transitions awaiting_compliance_path_choice → corrective_actions_chosen for corrective_action (S11)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			const result = await caller.saveCompliancePath({
				path: "corrective_action",
			});

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("corrective_actions_chosen");
			expect(setCall.firstDeclarationPathChoice).toBe("corrective_action");
			expect(setCall.firstDeclarationPathChoiceAt).toBeInstanceOf(Date);
		});

		it("transitions awaiting_compliance_path_choice → awaiting_cse_opinion for justify with CSE (S9)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.firstDeclarationPathChoice).toBe("justify");
		});

		it("transitions awaiting_compliance_path_choice → demarche_completed for justify without CSE (S10)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: false,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			expect(setCall.demarcheCompletedAt).toBeInstanceOf(Date);
		});

		it("writes secondDeclarationPathChoice when state is awaiting_revision_choice (S16)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.secondDeclarationPathChoice).toBe("justify");
			expect(setCall.secondDeclarationPathChoiceAt).toBeInstanceOf(Date);
		});

		it("rejects corrective_action when state is awaiting_revision_choice", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "corrective_action" }),
			).rejects.toThrow(/action corrective/i);
		});

		it("rejects re-write of firstDeclarationPathChoice (immutable)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "justify",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "corrective_action" }),
			).rejects.toThrow(/définitif/i);
		});

		it("rejects re-write of secondDeclarationPathChoice (immutable)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "justify",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "joint_evaluation" }),
			).rejects.toThrow(/définitif/i);
		});

		it("rejects invalid compliance path", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "invalid_path" as never }),
			).rejects.toThrow();
		});
	});

	describe("submitJointEvaluation (rules engine)", () => {
		it("transitions joint_evaluation_chosen → awaiting_cse_opinion with CSE (S12)", async () => {
			const declaration = buildDeclaration({
				status: "joint_evaluation_chosen",
				cseRequired: true,
				firstDeclarationPathChoice: "joint_evaluation",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			const result = await caller.submitJointEvaluation();

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.jointEvaluationSubmittedAt).toBeInstanceOf(Date);
		});

		it("transitions revised_joint_evaluation_chosen → demarche_completed without CSE (S17)", async () => {
			const declaration = buildDeclaration({
				status: "revised_joint_evaluation_chosen",
				cseRequired: false,
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createCaller(ctx.db);

			await caller.submitJointEvaluation();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			expect(setCall.jointEvaluationSubmittedAt).toBeInstanceOf(Date);
			expect(setCall.demarcheCompletedAt).toBeInstanceOf(Date);
		});

		it("throws NOT_FOUND when declaration is missing", async () => {
			const selectQueue = createSelectQueue([[]]);
			const mockDb = {
				select: selectQueue.select,
				update: vi.fn(),
			} as unknown;
			const caller = await createCaller(mockDb);

			await expect(caller.submitJointEvaluation()).rejects.toThrow();
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
