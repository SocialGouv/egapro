import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentYear } from "~/modules/domain";
import {
	companies,
	declarationStatusHistory,
	declarations,
	files,
	gipMdsData,
	representationDeclarations,
} from "~/server/db/schema";

const { getRepresentationWorkforceHistoryMock } = vi.hoisted(() => ({
	getRepresentationWorkforceHistoryMock: vi.fn(),
}));

vi.mock("~/server/services/suit");
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/getRepresentationWorkforceHistory", () => ({
	getRepresentationWorkforceHistory: getRepresentationWorkforceHistoryMock,
}));

const SIREN = "339787277";

function makeCompanyRow() {
	return {
		siren: SIREN,
		name: "Test Company",
		address: "1 rue de Paris",
		nafCode: "6202A",
		workforceEma: "100.00",
		hasCse: true,
	};
}

type QueryLog = { table: unknown; where: unknown };

/** Mirrors Drizzle's builder: awaitable at any point of the chain, and keyed on
 * the table passed to `from()` rather than on a call order the router owns. */
type QueryBuilder = Promise<unknown[]> & {
	leftJoin: () => QueryBuilder;
	innerJoin: () => QueryBuilder;
	where: (condition: unknown) => QueryBuilder;
	orderBy: () => QueryBuilder;
	limit: () => QueryBuilder;
};

function makeSelectMock(
	rowsByTable: Map<unknown, unknown[]>,
	queries: QueryLog[],
) {
	return vi.fn(() => ({
		from: (table: unknown) => {
			const log: QueryLog = { table, where: null };
			queries.push(log);
			const builder = Promise.resolve(
				rowsByTable.get(table) ?? [],
			) as QueryBuilder;
			builder.leftJoin = () => builder;
			builder.innerJoin = () => builder;
			builder.where = (condition: unknown) => {
				log.where = condition;
				return builder;
			};
			builder.orderBy = () => builder;
			builder.limit = () => builder;
			return builder;
		},
	}));
}

async function makeCaller({
	declRows = [],
	eventRows = [],
	representationDeclarationRows = [],
}: {
	declRows?: unknown[];
	eventRows?: unknown[];
	representationDeclarationRows?: unknown[];
} = {}) {
	const queries: QueryLog[] = [];
	const rowsByTable = new Map<unknown, unknown[]>([
		[companies, [makeCompanyRow()]],
		[declarations, declRows],
		[files, []],
		[gipMdsData, []],
		[declarationStatusHistory, eventRows],
		[representationDeclarations, representationDeclarationRows],
	]);
	const mockDb = { select: makeSelectMock(rowsByTable, queries) } as unknown;
	const { companyRouter } = await import("../company");
	const caller = companyRouter.createCaller({
		db: mockDb,
		session: { user: { id: "user-1" }, expires: "" },
		headers: new Headers(),
	} as never);
	return { caller, queries };
}

const DECLARATION_ID = "declaration-1";

function makeDeclRow(year: number) {
	return {
		id: DECLARATION_ID,
		siren: SIREN,
		year,
		status: "submitted",
		currentStep: 6,
		updatedAt: new Date(),
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		secondDeclarationSubmittedAt: null,
		demarcheCompletedAt: null,
		cseOpinionCompletedAt: null,
	};
}

function makeRepresentationDeclarationRow(year: number) {
	return { year };
}

/** Flattens a Drizzle `and(eq(col, value), …)` condition into a
 * column-object → parameter-value map, so a test can assert exactly which
 * columns a query filters on without matching generated SQL text. */
function collectEqualityFilters(condition: unknown): Map<unknown, unknown> {
	const filters = new Map<unknown, unknown>();
	let pendingColumn: unknown = null;

	const walk = (node: unknown): void => {
		if (node === null || typeof node !== "object") return;
		if ("queryChunks" in node && Array.isArray(node.queryChunks)) {
			for (const chunk of node.queryChunks) walk(chunk);
			return;
		}
		if ("name" in node && typeof node.name === "string") {
			pendingColumn = node;
			return;
		}
		const column = pendingColumn;
		if ("encoder" in node && "value" in node && column !== null) {
			filters.set(column, node.value);
			pendingColumn = null;
		}
	};

	walk(condition);
	return filters;
}

function findQuery(queries: QueryLog[], table: unknown) {
	return queries.find((q) => q.table === table);
}

const workforceBelowThreshold = [
	{ year: getCurrentYear(), workforceEma: 1200 },
	{ year: getCurrentYear() - 1, workforceEma: 940 },
	{ year: getCurrentYear() - 2, workforceEma: 1400 },
];

const workforceAboveThreshold = [
	{ year: getCurrentYear(), workforceEma: 1200 },
	{ year: getCurrentYear() - 1, workforceEma: 1050 },
	{ year: getCurrentYear() - 2, workforceEma: 1400 },
];

describe("companyRouter.getWithDeclarations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		getRepresentationWorkforceHistoryMock.mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns company with declaration list", async () => {
		const { caller } = await makeCaller({
			declRows: [makeDeclRow(getCurrentYear())],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.company.siren).toBe(SIREN);
		expect(result.declarations).toBeDefined();
	});

	it("excludes cancelled declarations from the timeline", async () => {
		const { caller } = await makeCaller({
			declRows: [makeDeclRow(getCurrentYear())],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		const remunerationDecls = result.declarations.filter(
			(d) => d.type === "remuneration",
		);
		expect(remunerationDecls).toHaveLength(1);
	});

	it("flags the second declaration and the CSE opinion from the status history", async () => {
		const { caller } = await makeCaller({
			declRows: [makeDeclRow(getCurrentYear())],
			eventRows: [
				{
					declarationId: DECLARATION_ID,
					eventType: "second_declaration_submit",
				},
				{ declarationId: DECLARATION_ID, eventType: "cse_opinion_submit" },
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "remuneration"),
		).toMatchObject({
			hasSubmittedSecondDeclaration: true,
			hasSubmittedCseOpinion: true,
		});
	});

	it("offers the representation démarche when the whole window reaches the threshold", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceAboveThreshold,
		);
		const { caller } = await makeCaller();

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			true,
		);
	});

	it("hides the representation démarche when a year of the window is below the threshold", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller();

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			false,
		);
		expect(result.declarations.some((d) => d.type === "remuneration")).toBe(
			true,
		);
	});

	it("offers the representation démarche when no workforce is known", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue([]);
		const { caller } = await makeCaller();

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			true,
		);
	});

	it("keeps an existing representation declaration visible even when the workforce filter would hide it", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow(getCurrentYear()),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			true,
		);
	});

	it("keeps the representation démarche hidden when the workforce filter excludes it and no declaration exists", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({ representationDeclarationRows: [] });

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			false,
		);
	});

	it("lists the representation démarche once when both the workforce filter and an existing declaration make it visible", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceAboveThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow(getCurrentYear()),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.filter((d) => d.type === "representation"),
		).toHaveLength(1);
	});

	it("scopes the existing-declaration lookup to the company and the current year", async () => {
		const { caller, queries } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow(getCurrentYear()),
			],
		});

		await caller.getWithDeclarations({ siren: SIREN });

		const query = findQuery(queries, representationDeclarations);
		const filters = collectEqualityFilters(query?.where);
		expect(filters.get(representationDeclarations.siren)).toBe(SIREN);
		expect(filters.get(representationDeclarations.year)).toBe(getCurrentYear());
		// Exactly two filters: no status predicate, so a draft counts as much as a
		// submitted declaration — the line must never disappear once started.
		expect(filters.size).toBe(2);
	});

	it("shows the existing representation declaration with the generic stub state", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow(getCurrentYear()),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		// Visibility only: mapping the representation state machine onto the row is
		// owned by the "panneau latéral & activation" ticket, not this one.
		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "to_complete",
			fsmStatus: null,
			currentStep: 0,
		});
	});
});
