import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCaller,
	mockDeclaration,
} from "./helpers/declarationTestHelpers";
import { withLockMiddleware } from "./helpers/lockTestHelpers";

// The 9 write mutations run through `declarationLockedWriteProcedure`, whose
// middleware issues two extra `ctx.db.select` calls (declaration resolution +
// active-lock lookup) before the handler. `withLockMiddleware` answers both
// with the current user holding the lock so the handler logic under test runs.
function createLockedCaller(
	mockDb: unknown,
	siret?: string | null,
	impersonation?: { siren: string; name: string } | null,
) {
	return createCaller(withLockMiddleware(mockDb), siret, impersonation);
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
	indicatorAAnnualWomen?: string | null;
	indicatorAAnnualMen?: string | null;
	indicatorAHourlyWomen?: string | null;
	indicatorAHourlyMen?: string | null;
	indicatorBAnnualWomen?: string | null;
	indicatorBAnnualMen?: string | null;
	indicatorBHourlyWomen?: string | null;
	indicatorBHourlyMen?: string | null;
	indicatorCAnnualWomen?: string | null;
	indicatorCAnnualMen?: string | null;
	indicatorCHourlyWomen?: string | null;
	indicatorCHourlyMen?: string | null;
	indicatorDAnnualWomen?: string | null;
	indicatorDAnnualMen?: string | null;
	indicatorDHourlyWomen?: string | null;
	indicatorDHourlyMen?: string | null;
	indicatorEWomen?: string | null;
	indicatorEMen?: string | null;
	indicatorFAnnualWomen1?: number | null;
	indicatorFAnnualWomen2?: number | null;
	indicatorFAnnualWomen3?: number | null;
	indicatorFAnnualWomen4?: number | null;
	indicatorFAnnualMen1?: number | null;
	indicatorFAnnualMen2?: number | null;
	indicatorFAnnualMen3?: number | null;
	indicatorFAnnualMen4?: number | null;
	indicatorFHourlyWomen1?: number | null;
	indicatorFHourlyWomen2?: number | null;
	indicatorFHourlyWomen3?: number | null;
	indicatorFHourlyWomen4?: number | null;
	indicatorFHourlyMen1?: number | null;
	indicatorFHourlyMen2?: number | null;
	indicatorFHourlyMen3?: number | null;
	indicatorFHourlyMen4?: number | null;
	draft?: Record<string, unknown> | null;
	draftUpdatedAt?: Date | null;
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

function createMutationTxMock(txSelectRows: unknown[] = []) {
	const update = vi.fn();
	const set = vi.fn();
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	set.mockReturnValue({ where: updateWhere });
	update.mockReturnValue({ set });

	const insertReturning = vi.fn().mockResolvedValue([]);
	const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
	const insert = vi.fn().mockReturnValue({ values: insertValues });

	const transaction = vi
		.fn()
		.mockImplementation(async (fn: (tx: unknown) => unknown) => {
			const txSelect = vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockImplementation(() => {
						const promise = Promise.resolve(txSelectRows);
						return Object.assign(promise, {
							limit: vi.fn().mockResolvedValue(txSelectRows),
						});
					}),
				}),
			});
			const txInsert = vi.fn().mockReturnValue({ values: insertValues });
			return fn({
				select: txSelect,
				insert: txInsert,
				update,
				delete: vi.fn(),
			});
		});

	return { update, set, insert, insertValues, transaction };
}

function createSubmitMockDb(
	declaration: DeclarationStateRow,
	company: CompanyRow,
	employeeCategories: Array<Record<string, unknown>> = [],
	gipWorkforceEma: string | null = null,
) {
	const joinRows = employeeCategories.map((ec) => ({ employee_category: ec }));
	const gipRows =
		gipWorkforceEma === null ? [] : [{ workforceEma: gipWorkforceEma }];
	const selectQueue = createSelectQueue([
		[declaration],
		[company],
		gipRows,
		joinRows,
	]);

	const m = createMutationTxMock([declaration]);

	return {
		db: {
			select: selectQueue.select,
			update: m.update,
			insert: m.insert,
			transaction: m.transaction,
		} as unknown,
		set: m.set,
		update: m.update,
		insert: m.insert,
		insertValues: m.insertValues,
	};
}

function createOneRowSelectDb(
	declaration: DeclarationStateRow,
	correctionCategories: Array<Record<string, unknown>> = [],
	txRows: unknown[] = [],
) {
	const joinRows = correctionCategories.map((ec) => ({
		employee_category: ec,
	}));
	const selectQueue = createSelectQueue([[declaration], joinRows]);

	const m = createMutationTxMock(txRows);

	return {
		db: {
			select: selectQueue.select,
			update: m.update,
			insert: m.insert,
			transaction: m.transaction,
		} as unknown,
		set: m.set,
		update: m.update,
		insert: m.insert,
		insertValues: m.insertValues,
	};
}

function createSimpleSelectDb(
	declaration: DeclarationStateRow,
	historyForRound: unknown[] = [],
	historyForLock: unknown[] = [],
	txRows: unknown[] = [],
) {
	const queue = createSelectQueue([
		[declaration],
		historyForRound,
		historyForLock,
	]);
	const m = createMutationTxMock(txRows);

	return {
		db: {
			select: queue.select,
			update: m.update,
			insert: m.insert,
			transaction: m.transaction,
		} as unknown,
		set: m.set,
		update: m.update,
		insert: m.insert,
		insertValues: m.insertValues,
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
			const caller = await createLockedCaller(ctx.db);

			const result = await caller.submit();

			expect(result).toEqual({ success: true });
			expect(ctx.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "demarche_completed",
					currentStep: 6,
				}),
			);
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual([
				"submit",
				"demarche_complete",
			]);
		});

		it("transitions draft → awaiting_cse_opinion for 120-employee with CSE without gap (S3)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 120, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "100", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(
				declaration,
				company,
				employeeCategories,
				"120.00",
			);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual(["submit"]);
		});

		it("transitions draft → awaiting_compliance_path_choice when gap detected and workforce >= 100 (S8)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 130, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "85", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(
				declaration,
				company,
				employeeCategories,
				"130.00",
			);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_compliance_path_choice");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual(["submit"]);
		});

		it("drives the FSM from the GIP workforce, not from the Weez company workforce (#3929)", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 82, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "85", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(
				declaration,
				company,
				employeeCategories,
				"70.00",
			);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			expect(setCall.cseRequired).toBe(false);
		});

		it("treats a company absent from the GIP file as not subject, whatever the Weez workforce says", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ workforce: 1183, hasCse: true });
			const employeeCategories = [
				{ annualBaseWomen: "85", annualBaseMen: "100" },
			];
			const ctx = createSubmitMockDb(
				declaration,
				company,
				employeeCategories,
				null,
			);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			expect(setCall.cseRequired).toBe(false);
		});

		it("does not duplicate submit events when called from a non-draft state", async () => {
			const declaration = buildDeclaration({ status: "awaiting_cse_opinion" });
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createLockedCaller(ctx.db);
			await expect(caller.submit()).rejects.toThrow(/No matching transition/);
		});

		it("persists computed percentage columns on submit", async () => {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const percentageSet = setCalls.find((c) => "globalAnnualMeanGap" in c);
			expect(percentageSet).toBeDefined();
			const expectedGlobalAnnualMeanGap = (110 - 100) / 110;
			expect(Number(percentageSet?.globalAnnualMeanGap)).toBeCloseTo(
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
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

			await expect(caller.submit()).rejects.toThrow("Entreprise introuvable");
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb, null as never);

			await expect(caller.submit()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});

		it("purges the main draft slice and keeps other slices after submit", async () => {
			const declaration = buildDeclaration({
				status: "draft",
				draft: { main: { step1: { foo: "bar" } }, cse: { step1: {} } },
			});
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toEqual({ cse: { step1: {} } });
			expect(purgeCall?.draftUpdatedAt).toBeInstanceOf(Date);
		});

		it("sets draft to null when main was the only slice after submit", async () => {
			const declaration = buildDeclaration({
				status: "draft",
				draft: { main: { step1: { foo: "bar" } } },
			});
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toBeNull();
			expect(purgeCall?.draftUpdatedAt).toBeNull();
		});

		it("does not call draft update when draft is null after submit", async () => {
			const declaration = buildDeclaration({ status: "draft", draft: null });
			const company = buildCompany();
			const ctx = createSubmitMockDb(declaration, company, []);
			const caller = await createLockedCaller(ctx.db);

			await caller.submit();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeUndefined();
		});
	});

	describe("submit — cseRequired snapshot", () => {
		async function submitAndReadSnapshot(
			gipWorkforceEma: string | null,
			hasCse: boolean | null,
		): Promise<boolean> {
			const declaration = buildDeclaration({ status: "draft" });
			const company = buildCompany({ hasCse });
			const ctx = createSubmitMockDb(declaration, company, [], gipWorkforceEma);
			const caller = await createLockedCaller(ctx.db);
			await caller.submit();
			const projectionCall = ctx.set.mock.calls
				.map((c) => c[0] as Record<string, unknown>)
				.find((c) => "cseRequired" in c);
			return projectionCall?.cseRequired as boolean;
		}

		it("snapshots true for >= 100 GIP employees with a CSE", async () => {
			expect(await submitAndReadSnapshot("100.00", true)).toBe(true);
		});

		it("snapshots false just below the 100-employee threshold", async () => {
			expect(await submitAndReadSnapshot("99.00", true)).toBe(false);
		});

		it("snapshots false for a fractional GIP workforce just below 100", async () => {
			expect(await submitAndReadSnapshot("99.97", true)).toBe(false);
		});

		it("snapshots false for >= 100 GIP employees without a CSE", async () => {
			expect(await submitAndReadSnapshot("120.00", false)).toBe(false);
		});

		it("snapshots false when hasCse is null", async () => {
			expect(await submitAndReadSnapshot("250.00", null)).toBe(false);
		});

		it("snapshots false when the company is absent from the GIP file", async () => {
			expect(await submitAndReadSnapshot(null, true)).toBe(false);
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
			const caller = await createLockedCaller(ctx.db);

			const result = await caller.submitSecondDeclaration();

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_revision_choice");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
				round: number | null;
			}>;
			expect(insertedEvents).toEqual([
				expect.objectContaining({
					eventType: "second_declaration_submit",
					round: 2,
				}),
			]);
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
			const caller = await createLockedCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual([
				"second_declaration_submit",
				"demarche_complete",
			]);
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
			const caller = await createLockedCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
		});

		it("throws NOT_FOUND when declaration is missing", async () => {
			const selectQueue = createSelectQueue([[]]);
			const mockDb = {
				select: selectQueue.select,
				update: vi.fn(),
			} as unknown;
			const caller = await createLockedCaller(mockDb);

			await expect(caller.submitSecondDeclaration()).rejects.toThrow();
		});

		it("purges the second draft slice and keeps other slices after submitSecondDeclaration", async () => {
			const declaration = buildDeclaration({
				status: "corrective_actions_chosen",
				cseRequired: false,
				draft: { second: { step1: { foo: "bar" } }, main: { step1: {} } },
			});
			const ctx = createOneRowSelectDb(declaration, [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toEqual({ main: { step1: {} } });
			expect(purgeCall?.draftUpdatedAt).toBeInstanceOf(Date);
		});

		it("sets draft to null when second was the only slice after submitSecondDeclaration", async () => {
			const declaration = buildDeclaration({
				status: "corrective_actions_chosen",
				cseRequired: false,
				draft: { second: { step1: { foo: "bar" } } },
			});
			const ctx = createOneRowSelectDb(declaration, [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.submitSecondDeclaration();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toBeNull();
			expect(purgeCall?.draftUpdatedAt).toBeNull();
		});
	});

	describe("saveCompliancePath (rules engine)", () => {
		it("transitions awaiting_compliance_path_choice → corrective_actions_chosen for corrective_action (S11)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createLockedCaller(ctx.db);

			const result = await caller.saveCompliancePath({
				path: "corrective_action",
			});

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("corrective_actions_chosen");
			expect(setCall.firstDeclarationPathChoice).toBe("corrective_action");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
				value: string | null;
				round: number | null;
			}>;
			expect(insertedEvents).toEqual([
				expect.objectContaining({
					eventType: "path_choice",
					value: "corrective_action",
					round: 1,
				}),
			]);
		});

		it("transitions awaiting_compliance_path_choice → awaiting_cse_opinion for justify with CSE (S9)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createLockedCaller(ctx.db);

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
			const caller = await createLockedCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual([
				"path_choice",
				"demarche_complete",
			]);
		});

		it("writes secondDeclarationPathChoice when state is awaiting_revision_choice (S16)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
			});
			const ctx = createSimpleSelectDb(
				declaration,
				[{ eventType: "second_declaration_submit" }],
				[],
			);
			const caller = await createLockedCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			expect(setCall.secondDeclarationPathChoice).toBe("justify");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
				round: number | null;
			}>;
			expect(insertedEvents).toEqual([
				expect.objectContaining({
					eventType: "path_choice",
					round: 2,
				}),
			]);
		});

		it("rejects corrective_action when state is awaiting_revision_choice", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
			});
			const ctx = createSimpleSelectDb(
				declaration,
				[{ eventType: "second_declaration_submit" }],
				[],
			);
			const caller = await createLockedCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "corrective_action" }),
			).rejects.toThrow(/action corrective/i);
		});

		it("rejects path change after a joint_evaluation_submit event is recorded for the round (path locked)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "justify",
			});
			const ctx = createSimpleSelectDb(
				declaration,
				[],
				[{ eventType: "joint_evaluation_submit", round: 1 }],
			);
			const caller = await createLockedCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "corrective_action" }),
			).rejects.toThrow(/parcours ne peut plus/i);
		});

		it("rejects path change in round 2 after cse_opinion_submit event (path locked)", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_revision_choice",
				cseRequired: true,
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "justify",
			});
			const ctx = createSimpleSelectDb(
				declaration,
				[{ eventType: "second_declaration_submit" }],
				[{ eventType: "cse_opinion_submit", round: null }],
			);
			const caller = await createLockedCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "joint_evaluation" }),
			).rejects.toThrow(/parcours ne peut plus/i);
		});

		it("rejects invalid compliance path", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createLockedCaller(ctx.db);

			await expect(
				caller.saveCompliancePath({ path: "invalid_path" as never }),
			).rejects.toThrow();
		});

		it("purges the compliance draft slice and keeps other slices after saveCompliancePath", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
				draft: {
					compliance: { step1: { path: "justify" } },
					main: { step1: {} },
				},
			});
			const ctx = createSimpleSelectDb(declaration, [], [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toEqual({ main: { step1: {} } });
			expect(purgeCall?.draftUpdatedAt).toBeInstanceOf(Date);
		});

		it("sets draft to null when compliance was the only slice after saveCompliancePath", async () => {
			const declaration = buildDeclaration({
				status: "awaiting_compliance_path_choice",
				cseRequired: true,
				draft: { compliance: { step1: { path: "justify" } } },
			});
			const ctx = createSimpleSelectDb(declaration, [], [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.saveCompliancePath({ path: "justify" });

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toBeNull();
			expect(purgeCall?.draftUpdatedAt).toBeNull();
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
			const caller = await createLockedCaller(ctx.db);

			const result = await caller.submitJointEvaluation();

			expect(result).toEqual({ success: true });
			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("awaiting_cse_opinion");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
				round: number | null;
			}>;
			expect(insertedEvents).toEqual([
				expect.objectContaining({
					eventType: "joint_evaluation_submit",
					round: 1,
				}),
			]);
		});

		it("transitions revised_joint_evaluation_chosen → demarche_completed without CSE (S17)", async () => {
			const declaration = buildDeclaration({
				status: "revised_joint_evaluation_chosen",
				cseRequired: false,
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			});
			const ctx = createSimpleSelectDb(declaration);
			const caller = await createLockedCaller(ctx.db);

			await caller.submitJointEvaluation();

			const setCall = ctx.set.mock.calls[0]?.[0] as Record<string, unknown>;
			expect(setCall.status).toBe("demarche_completed");
			const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
				eventType: string;
			}>;
			expect(insertedEvents.map((e) => e.eventType)).toEqual([
				"joint_evaluation_submit",
				"demarche_complete",
			]);
		});

		it("throws NOT_FOUND when declaration is missing", async () => {
			const selectQueue = createSelectQueue([[]]);
			const mockDb = {
				select: selectQueue.select,
				update: vi.fn(),
			} as unknown;
			const caller = await createLockedCaller(mockDb);

			await expect(caller.submitJointEvaluation()).rejects.toThrow();
		});

		it("purges the joint draft slice and keeps other slices after submitJointEvaluation", async () => {
			const declaration = buildDeclaration({
				status: "joint_evaluation_chosen",
				cseRequired: true,
				firstDeclarationPathChoice: "joint_evaluation",
				draft: {
					joint: { step1: { foo: "bar" } },
					cse: { step1: {} },
				},
			});
			const ctx = createSimpleSelectDb(declaration, [], [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.submitJointEvaluation();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toEqual({ cse: { step1: {} } });
			expect(purgeCall?.draftUpdatedAt).toBeInstanceOf(Date);
		});

		it("sets draft to null when joint was the only slice after submitJointEvaluation", async () => {
			const declaration = buildDeclaration({
				status: "joint_evaluation_chosen",
				cseRequired: true,
				firstDeclarationPathChoice: "joint_evaluation",
				draft: { joint: { step1: { foo: "bar" } } },
			});
			const ctx = createSimpleSelectDb(declaration, [], [], [declaration]);
			const caller = await createLockedCaller(ctx.db);

			await caller.submitJointEvaluation();

			const setCalls = ctx.set.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const purgeCall = setCalls.find((c) => "draft" in c);
			expect(purgeCall).toBeDefined();
			expect(purgeCall?.draft).toBeNull();
			expect(purgeCall?.draftUpdatedAt).toBeNull();
		});
	});

	describe("updateStep1", () => {
		it("updates totalWomen and totalMen", async () => {
			const tx = createMockTx([mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb, null as never);

			await expect(
				caller.updateStep1({ totalWomen: 10, totalMen: 20 }),
			).rejects.toThrow("SIRET manquant ou invalide dans la session");
		});

		it("resets percentage columns when indicators are reset (totals changed)", async () => {
			const rowAfterReset = buildDeclaration({
				indicatorAAnnualWomen: null,
				indicatorAAnnualMen: null,
				indicatorAHourlyWomen: null,
				indicatorAHourlyMen: null,
				indicatorBAnnualWomen: null,
				indicatorBAnnualMen: null,
				indicatorBHourlyWomen: null,
				indicatorBHourlyMen: null,
				indicatorCAnnualWomen: null,
				indicatorCAnnualMen: null,
				indicatorCHourlyWomen: null,
				indicatorCHourlyMen: null,
				indicatorDAnnualWomen: null,
				indicatorDAnnualMen: null,
				indicatorDHourlyWomen: null,
				indicatorDHourlyMen: null,
				indicatorEWomen: null,
				indicatorEMen: null,
				indicatorFAnnualWomen1: null,
				indicatorFAnnualWomen2: null,
				indicatorFAnnualWomen3: null,
				indicatorFAnnualWomen4: null,
				indicatorFAnnualMen1: null,
				indicatorFAnnualMen2: null,
				indicatorFAnnualMen3: null,
				indicatorFAnnualMen4: null,
				indicatorFHourlyWomen1: null,
				indicatorFHourlyWomen2: null,
				indicatorFHourlyWomen3: null,
				indicatorFHourlyWomen4: null,
				indicatorFHourlyMen1: null,
				indicatorFHourlyMen2: null,
				indicatorFHourlyMen3: null,
				indicatorFHourlyMen4: null,
			});
			const tx = createMockTx([rowAfterReset]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep1({ totalWomen: 50, totalMen: 60 });

			const setCalls = mockSet.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const percentageSet = setCalls.find((c) => "globalAnnualMeanGap" in c);
			expect(percentageSet).toBeDefined();
			expect(percentageSet?.globalAnnualMeanGap).toBeNull();
			expect(percentageSet?.variableProportionWomen).toBeNull();
			expect(percentageSet?.annualQuartile1ProportionWomen).toBeNull();
		});
	});

	describe("updateStep2", () => {
		it("saves indicator A and C values", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

			const result = await caller.updateStep2({});

			expect(result).toEqual({ success: true });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb, null as never);

			await expect(caller.updateStep2({})).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});

		it("recomputes percentage columns after updateStep2", async () => {
			const freshRowAfterUpdate = buildDeclaration({
				indicatorAAnnualWomen: "200",
				indicatorAAnnualMen: "100",
			});
			const tx = createMockTx([freshRowAfterUpdate]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				update: mockUpdate,
				transaction: mockTransaction,
			} as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep2({
				indicatorAAnnualWomen: "200",
				indicatorAAnnualMen: "100",
				indicatorAHourlyWomen: "20",
				indicatorAHourlyMen: "22",
				indicatorCAnnualWomen: "95",
				indicatorCAnnualMen: "105",
				indicatorCHourlyWomen: "18",
				indicatorCHourlyMen: "20",
			});

			const setCalls = mockSet.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const percentageSet = setCalls.find((c) => "globalAnnualMeanGap" in c);
			expect(percentageSet).toBeDefined();
			expect(Number(percentageSet?.globalAnnualMeanGap)).toBeCloseTo(
				(100 - 200) / 100,
			);
		});
	});

	describe("updateStep3", () => {
		it("saves indicator B, D and E values", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

			const result = await caller.updateStep3({});

			expect(result).toEqual({ success: true });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb, null as never);

			await expect(caller.updateStep3({})).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});

		it("recomputes percentage columns after updateStep3", async () => {
			const freshRowAfterUpdate = buildDeclaration({
				indicatorBAnnualWomen: "100",
				indicatorBAnnualMen: "200",
			});
			const tx = createMockTx([freshRowAfterUpdate]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				update: mockUpdate,
				transaction: mockTransaction,
			} as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep3({
				indicatorBAnnualWomen: "100",
				indicatorBAnnualMen: "200",
				indicatorBHourlyWomen: "10",
				indicatorBHourlyMen: "11",
				indicatorDAnnualWomen: "45",
				indicatorDAnnualMen: "50",
				indicatorDHourlyWomen: "9",
				indicatorDHourlyMen: "10",
				indicatorEWomen: "30",
				indicatorEMen: "70",
			});

			const setCalls = mockSet.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const percentageSet = setCalls.find((c) => "globalAnnualMeanGap" in c);
			expect(percentageSet).toBeDefined();
			expect(Number(percentageSet?.variableAnnualMeanGap)).toBeCloseTo(
				(200 - 100) / 200,
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
			const caller = await createLockedCaller(mockDb);

			const result = await caller.updateStep4(step4Input);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({ currentStep: 4 }),
			);
		});

		it("maps 3 thresholds + 4 counts per table with no *Threshold4 column", async () => {
			const mockDb = createMockDb();
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb);

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
			const caller = await createLockedCaller(mockDb, null as never);

			await expect(caller.updateStep4(step4Input)).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});

		it("recomputes percentage columns after updateStep4", async () => {
			const freshRowAfterUpdate = buildDeclaration({
				indicatorFAnnualWomen1: 30,
				indicatorFAnnualMen1: 70,
			});
			const tx = createMockTx([freshRowAfterUpdate]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = {
				update: mockUpdate,
				transaction: mockTransaction,
			} as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep4(step4Input);

			const setCalls = mockSet.mock.calls.map(
				(c) => c[0] as Record<string, unknown>,
			);
			const percentageSet = setCalls.find((c) => "globalAnnualMeanGap" in c);
			expect(percentageSet).toBeDefined();
			expect(Number(percentageSet?.annualQuartile1ProportionWomen)).toBeCloseTo(
				0.3,
			);
			expect(Number(percentageSet?.annualQuartile1ProportionMen)).toBeCloseTo(
				0.7,
			);
		});
	});

	describe("step_change instrumentation (K4 — délai par étape)", () => {
		it("inserts a step_change row when updateStep1 advances from step 0 (S1)", async () => {
			const tx = createMockTx([mockDeclaration]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep1({ totalWomen: 30, totalMen: 40 });

			const insertedRows = mockValues.mock.calls
				.map((c) => c[0])
				.filter(
					(v): v is { eventType?: string } =>
						typeof v === "object" && v !== null && "eventType" in v,
				);
			const stepChange = insertedRows.find(
				(row) => row.eventType === "step_change",
			);
			expect(stepChange).toMatchObject({
				eventType: "step_change",
				value: "from:0|to:1",
				round: 1,
			});
		});

		it("does not insert a step_change row when the new step equals the existing one (idempotent re-save)", async () => {
			const declarationAtStep2 = { ...mockDeclaration, currentStep: 2 };
			const tx = createMockTx([declarationAtStep2]);
			mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
				fn(tx),
			);
			const mockDb = { transaction: mockTransaction } as unknown;
			const caller = await createLockedCaller(mockDb);

			await caller.updateStep2({
				indicatorAAnnualWomen: "30000",
				indicatorAAnnualMen: "32000",
			});

			const insertedRows = mockValues.mock.calls
				.map((c) => c[0])
				.filter(
					(v): v is { eventType?: string } =>
						typeof v === "object" && v !== null && "eventType" in v,
				);
			const stepChange = insertedRows.find(
				(row) => row.eventType === "step_change",
			);
			expect(stepChange).toBeUndefined();
		});
	});

	describe("getStatusHistory", () => {
		const SIREN = "339787277";
		const YEAR = 2026;

		const mockHistoryItem = {
			id: "hist-1",
			eventType: "declaration_submit" as const,
			value: null,
			round: 1,
			createdAt: new Date("2026-01-15T10:00:00Z"),
			actorFirstName: "Alice",
			actorLastName: "Dupont",
			actorEmail: "alice@example.fr",
		};

		type SelectSpies = {
			limit: ReturnType<typeof vi.fn>;
			offset: ReturnType<typeof vi.fn>;
		};

		function buildMockDb(responses: unknown[][]) {
			let callIndex = 0;
			const selectSpies: SelectSpies[] = [];

			const select = vi.fn().mockImplementation(() => {
				const idx = callIndex++;
				const rows = responses[idx] ?? [];

				const offset = vi.fn().mockResolvedValue(rows);
				const limitResult = Object.assign(Promise.resolve(rows), { offset });
				const limit = vi.fn().mockReturnValue(limitResult);
				const orderBy = vi.fn().mockReturnValue({ limit });
				const where = vi
					.fn()
					.mockImplementation(() =>
						Object.assign(Promise.resolve(rows), { limit, orderBy }),
					);
				const leftJoin = vi.fn().mockReturnValue({ where });
				const from = vi.fn().mockReturnValue({ where, leftJoin });

				selectSpies.push({ limit, offset });
				return { from };
			});

			return { db: { select } as unknown, selectSpies };
		}

		it("returns history items with actor for an authorized user", async () => {
			const { db: mockDb } = buildMockDb([
				[{ siren: SIREN }],
				[{ id: "decl-1" }],
				[mockHistoryItem],
				[{ total: 1 }],
			]);
			const caller = await createCaller(mockDb);

			const result = await caller.getStatusHistory({
				siren: SIREN,
				year: YEAR,
			});

			expect(result.items).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.items[0]).toMatchObject({
				id: "hist-1",
				eventType: "declaration_submit",
				actor: {
					firstName: "Alice",
					lastName: "Dupont",
					email: "alice@example.fr",
				},
			});
		});

		it("returns null actor when actorEmail is null", async () => {
			const itemWithoutActor = { ...mockHistoryItem, actorEmail: null };
			const { db: mockDb } = buildMockDb([
				[{ siren: SIREN }],
				[{ id: "decl-1" }],
				[itemWithoutActor],
				[{ total: 1 }],
			]);
			const caller = await createCaller(mockDb);

			const result = await caller.getStatusHistory({
				siren: SIREN,
				year: YEAR,
			});

			expect(result.items[0]?.actor).toBeNull();
		});

		it("throws FORBIDDEN when user has no access to the siren", async () => {
			const { db: mockDb } = buildMockDb([[]]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.getStatusHistory({ siren: SIREN, year: YEAR }),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		});

		it("throws NOT_FOUND when declaration does not exist", async () => {
			const { db: mockDb } = buildMockDb([[{ siren: SIREN }], []]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.getStatusHistory({ siren: SIREN, year: YEAR }),
			).rejects.toMatchObject({ code: "NOT_FOUND" });
		});

		it("skips access check when admin is impersonating the siren", async () => {
			const impersonation = { siren: SIREN, name: "Test Co" };
			const { db: mockDb } = buildMockDb([
				[{ id: "decl-1" }],
				[mockHistoryItem],
				[{ total: 1 }],
			]);
			const caller = await createCaller(mockDb, null, impersonation);

			const result = await caller.getStatusHistory({
				siren: SIREN,
				year: YEAR,
			});

			expect(result.total).toBe(1);
		});

		it("returns correct total and subset for paginated queries", async () => {
			const item2 = { ...mockHistoryItem, id: "hist-2" };
			const { db: mockDb, selectSpies } = buildMockDb([
				[{ siren: SIREN }],
				[{ id: "decl-1" }],
				[item2],
				[{ total: 5 }],
			]);
			const caller = await createCaller(mockDb);

			const result = await caller.getStatusHistory({
				siren: SIREN,
				year: YEAR,
				limit: 1,
				offset: 1,
			});

			expect(result.items).toHaveLength(1);
			expect(result.total).toBe(5);
			expect(selectSpies[2]?.limit).toHaveBeenCalledWith(1);
			expect(selectSpies[2]?.offset).toHaveBeenCalledWith(1);
		});
	});
});
