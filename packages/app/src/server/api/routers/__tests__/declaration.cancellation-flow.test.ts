import { afterEach, describe, expect, it, vi } from "vitest";
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
let lastUpdateSet: Record<string, unknown> | null;

function buildActiveStore(rows: StoredRow[]) {
	store = rows;
	lastInsertedRow = null;
	lastUpdateSet = null;
}

function activeRows() {
	return store.filter((row) => row.cancelledAt === null);
}

function buildTx() {
	return {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: async () => activeRows().slice(0, 1),
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
					lastUpdateSet = values;
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

function buildDb() {
	const tx = buildTx();
	return {
		transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(tx)),
		select: () => ({
			from: (table: unknown) => ({
				where: () => ({
					limit: async () => {
						const t = table as { _?: { name?: string } };
						if (t?._?.name === "app_declaration") {
							const row = activeRows()[0];
							if (!row) return [];
							return [{ submittedAt: row.submittedAt }];
						}
						return [];
					},
				}),
			}),
		}),
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
		const caller = await createCaller(db);

		const result = await caller.submit();

		expect(result).toEqual({ success: true });
		expect(activeRow.status).toBe("submitted");
		expect(activeRow.currentStep).toBe(6);
		expect(activeRow.submittedAt).not.toBeNull();
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
		const caller = await createCaller(db);

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
		const caller = await createCaller(db);

		await caller.submit();

		expect(lastUpdateSet).not.toBeNull();
		expect(lastUpdateSet?.status).toBe("submitted");
		const submittedAt = lastUpdateSet?.submittedAt as Date;
		expect(submittedAt).toBeInstanceOf(Date);
		expect(cancelledRow.submittedAt?.toISOString()).toContain(`${YEAR}-03-01`);
	});
});
