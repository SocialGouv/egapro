import { afterEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "./helpers/declarationTestHelpers";
import { withLockMiddleware } from "./helpers/lockTestHelpers";

// submit and updateStep1 run through `declarationLockedWriteProcedure`: the
// lock middleware issues two `ctx.db.select` calls (declaration resolution +
// active-lock lookup) before the handler. `withLockMiddleware` answers both
// with the current user holding the lock; getOrCreate stays on `createCaller`.
function createLockedCaller(db: unknown) {
	return createCaller(withLockMiddleware(db));
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

const ACTIVE_FILTER_TOKEN = Symbol("activeDeclarationFilter");

vi.mock("drizzle-orm", async (importOriginal) => {
	const actual = await importOriginal<typeof import("drizzle-orm")>();
	return {
		...actual,
		isNull: vi.fn((col: unknown) => ({
			__type: "isNull",
			col,
			[ACTIVE_FILTER_TOKEN]: true,
		})),
	};
});

type StoredRow = {
	id: string;
	siren: string;
	year: number;
	declarantId: string;
	currentStep: number;
	status: string;
	totalWomen: number | null;
	totalMen: number | null;
	cancelledAt: Date | null;
	submittedAt: Date | null;
};

const SIREN = "339787277";
const YEAR = 2026;

let store: StoredRow[];

let lastInsertedRow: StoredRow | null;
let updateSetCalls: Array<Record<string, unknown>>;

function buildActiveStore(rows: StoredRow[]) {
	store = rows;
	lastInsertedRow = null;
	updateSetCalls = [];
}

function findUpdateSet(
	predicate: (values: Record<string, unknown>) => boolean,
): Record<string, unknown> | undefined {
	return updateSetCalls.find(predicate);
}

function activeRows() {
	return store.filter((row) => row.cancelledAt === null);
}

function buildTx() {
	return {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: async () =>
						activeRows()
							.slice(0, 1)
							.map((row) => ({ ...row, ...nullIndicators() })),
				}),
			}),
		}),
		insert: () => ({
			values: (values: Partial<StoredRow>) => ({
				onConflictDoNothing: () => ({
					returning: async () => {
						const conflict = activeRows().some(
							(row) => row.siren === values.siren && row.year === values.year,
						);
						if (conflict) return [];
						const newRow: StoredRow = {
							id: `decl-new-${store.length + 1}`,
							siren: values.siren ?? SIREN,
							year: values.year ?? YEAR,
							declarantId: values.declarantId ?? "user-1",
							currentStep: values.currentStep ?? 0,
							status: values.status ?? "draft",
							totalWomen: null,
							totalMen: null,
							cancelledAt: null,
							submittedAt: null,
						};
						store.push(newRow);
						lastInsertedRow = newRow;
						return [newRow];
					},
				}),
			}),
		}),
		delete: vi.fn(),
		update: () => ({
			set: (values: Record<string, unknown>) => ({
				where: async () => {
					updateSetCalls.push(values);
					const target = activeRows()[0];
					if (target) {
						Object.assign(target, values);
					}
					return undefined;
				},
			}),
		}),
	};
}

const INDICATOR_FIELDS = [
	"indicatorAAnnualWomen",
	"indicatorAAnnualMen",
	"indicatorAHourlyWomen",
	"indicatorAHourlyMen",
	"indicatorBAnnualWomen",
	"indicatorBAnnualMen",
	"indicatorBHourlyWomen",
	"indicatorBHourlyMen",
	"indicatorCAnnualWomen",
	"indicatorCAnnualMen",
	"indicatorCHourlyWomen",
	"indicatorCHourlyMen",
	"indicatorDAnnualWomen",
	"indicatorDAnnualMen",
	"indicatorDHourlyWomen",
	"indicatorDHourlyMen",
	"indicatorEWomen",
	"indicatorEMen",
	"indicatorFAnnualWomen1",
	"indicatorFAnnualWomen2",
	"indicatorFAnnualWomen3",
	"indicatorFAnnualWomen4",
	"indicatorFAnnualMen1",
	"indicatorFAnnualMen2",
	"indicatorFAnnualMen3",
	"indicatorFAnnualMen4",
	"indicatorFHourlyWomen1",
	"indicatorFHourlyWomen2",
	"indicatorFHourlyWomen3",
	"indicatorFHourlyWomen4",
	"indicatorFHourlyMen1",
	"indicatorFHourlyMen2",
	"indicatorFHourlyMen3",
	"indicatorFHourlyMen4",
] as const;

function nullIndicators() {
	return Object.fromEntries(INDICATOR_FIELDS.map((k) => [k, null]));
}

function buildDb() {
	const tx = buildTx();
	let selectCallCount = 0;
	const select = () => {
		selectCallCount++;
		const call = selectCallCount;
		return {
			from: () => ({
				where: () => {
					if (call === 1) {
						return {
							limit: async () => {
								const row = activeRows()[0];
								if (!row) return [];
								return [
									{
										...row,
										...nullIndicators(),
										rulesVersion: "2027.1",
										cseRequired: false,
										firstDeclarationPathChoice: null,
										secondDeclarationPathChoice: null,
									},
								];
							},
						};
					}
					return {
						limit: async () => [{ siren: SIREN, workforce: 80, hasCse: false }],
					};
				},
				innerJoin: () => ({
					where: async () => [],
				}),
			}),
		};
	};
	return {
		transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(tx)),
		select,
		update: tx.update,
	};
}

afterEach(() => {
	vi.resetAllMocks();
});

describe("declaration cancellation redeposit flow", () => {
	it("getOrCreate inserts a fresh row when only a cancelled row exists for (siren, year)", async () => {
		buildActiveStore([
			{
				id: "decl-cancelled",
				siren: SIREN,
				year: YEAR,
				declarantId: "user-1",
				currentStep: 6,
				status: "submitted",
				totalWomen: 30,
				totalMen: 40,
				cancelledAt: new Date(`${YEAR}-04-01T08:00:00Z`),
				submittedAt: new Date(`${YEAR}-03-25T08:00:00Z`),
			},
		]);

		const db = buildDb();
		const caller = await createCaller(db);

		const result = await caller.getOrCreate();

		expect(result.declaration.cancelledAt).toBeNull();
		expect(result.declaration.id).not.toBe("decl-cancelled");
		expect(lastInsertedRow).not.toBeNull();
		expect(lastInsertedRow?.siren).toBe(SIREN);
		expect(lastInsertedRow?.year).toBe(YEAR);
		expect(store).toHaveLength(2);
	});

	it("getOrCreate reuses the active row when one exists alongside a cancelled row", async () => {
		buildActiveStore([
			{
				id: "decl-cancelled",
				siren: SIREN,
				year: YEAR,
				declarantId: "user-1",
				currentStep: 6,
				status: "submitted",
				totalWomen: 30,
				totalMen: 40,
				cancelledAt: new Date(`${YEAR}-04-01T08:00:00Z`),
				submittedAt: new Date(`${YEAR}-03-25T08:00:00Z`),
			},
			{
				id: "decl-active",
				siren: SIREN,
				year: YEAR,
				declarantId: "user-1",
				currentStep: 1,
				status: "draft",
				totalWomen: null,
				totalMen: null,
				cancelledAt: null,
				submittedAt: null,
			},
		]);

		const db = buildDb();
		const caller = await createCaller(db);

		const result = await caller.getOrCreate();

		expect(result.declaration.id).toBe("decl-active");
		expect(lastInsertedRow).toBeNull();
	});

	it("submit only transitions the active row, leaving the cancelled row untouched", async () => {
		const cancelledRow: StoredRow = {
			id: "decl-cancelled",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 6,
			status: "submitted",
			totalWomen: 30,
			totalMen: 40,
			cancelledAt: new Date(`${YEAR}-04-01T08:00:00Z`),
			submittedAt: new Date(`${YEAR}-03-25T08:00:00Z`),
		};
		const activeRow: StoredRow = {
			id: "decl-active",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 5,
			status: "draft",
			totalWomen: 50,
			totalMen: 60,
			cancelledAt: null,
			submittedAt: null,
		};
		buildActiveStore([cancelledRow, activeRow]);

		const db = buildDb();
		const caller = await createLockedCaller(db);

		const result = await caller.submit();

		expect(result).toEqual({ success: true });
		expect(activeRow.status).toBe("demarche_completed");
		expect(activeRow.currentStep).toBe(6);
		expect(cancelledRow.status).toBe("submitted");
		expect(cancelledRow.cancelledAt).toBeInstanceOf(Date);
	});

	it("updateStep1 mutates only the active row when a cancelled row exists", async () => {
		const cancelledRow: StoredRow = {
			id: "decl-cancelled",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 6,
			status: "submitted",
			totalWomen: 12,
			totalMen: 18,
			cancelledAt: new Date(`${YEAR}-04-01T08:00:00Z`),
			submittedAt: new Date(`${YEAR}-03-25T08:00:00Z`),
		};
		const activeRow: StoredRow = {
			id: "decl-active",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 0,
			status: "draft",
			totalWomen: null,
			totalMen: null,
			cancelledAt: null,
			submittedAt: null,
		};
		buildActiveStore([cancelledRow, activeRow]);

		const db = buildDb();
		const caller = await createLockedCaller(db);

		await caller.updateStep1({ totalWomen: 70, totalMen: 80 });

		expect(activeRow.totalWomen).toBe(70);
		expect(activeRow.totalMen).toBe(80);
		expect(cancelledRow.totalWomen).toBe(12);
		expect(cancelledRow.totalMen).toBe(18);
	});

	it("submit fresh insertion preserves submittedAt from the active row only", async () => {
		const cancelledRow: StoredRow = {
			id: "decl-cancelled",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 6,
			status: "submitted",
			totalWomen: 30,
			totalMen: 40,
			cancelledAt: new Date(`${YEAR}-04-01T08:00:00Z`),
			submittedAt: new Date(`${YEAR}-03-01T08:00:00Z`),
		};
		const activeRow: StoredRow = {
			id: "decl-active",
			siren: SIREN,
			year: YEAR,
			declarantId: "user-1",
			currentStep: 5,
			status: "draft",
			totalWomen: 50,
			totalMen: 60,
			cancelledAt: null,
			submittedAt: null,
		};
		buildActiveStore([cancelledRow, activeRow]);

		const db = buildDb();
		const caller = await createLockedCaller(db);

		await caller.submit();

		const statusSet = findUpdateSet((v) => "status" in v);
		expect(statusSet).toBeDefined();
		expect(statusSet?.status).toBe("demarche_completed");
		expect(cancelledRow.submittedAt?.toISOString()).toContain(`${YEAR}-03-01`);
	});
});
