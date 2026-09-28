import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	CampaignDeadlines,
	RepresentationDeclarationStatus,
} from "~/modules/domain";
import {
	getCurrentYear,
	getDefaultCampaignDeadlines,
	getReferenceYearFor,
} from "~/modules/domain";
import {
	companies,
	declarationStatusHistory,
	declarations,
	files,
	gipMdsData,
	representationDeclarations,
} from "~/server/db/schema";

const { getRepresentationWorkforceHistoryMock, getCampaignDeadlinesMock } =
	vi.hoisted(() => ({
		getRepresentationWorkforceHistoryMock: vi.fn(),
		getCampaignDeadlinesMock: vi.fn(),
	}));

vi.mock("~/server/services/suit");
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/getRepresentationWorkforceHistory", () => ({
	getRepresentationWorkforceHistory: getRepresentationWorkforceHistoryMock,
}));
vi.mock("~/server/db/getCampaignDeadlines", () => ({
	getCampaignDeadlines: getCampaignDeadlinesMock,
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

/** Shaped like the router's select: the mock builder does not filter, so the
 * reference year the row is stored under is asserted on the query instead. */
function makeRepresentationDeclarationRow(
	overrides: Partial<{
		status: RepresentationDeclarationStatus;
		currentStep: number | null;
		updatedAt: Date | null;
	}> = {},
) {
	return {
		status: "draft" as const,
		currentStep: 0,
		updatedAt: null,
		...overrides,
	};
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
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(getDefaultCampaignDeadlines(y)),
		);
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

	it("falls back to step 0 for a remuneration row with no current step", async () => {
		const { caller } = await makeCaller({
			declRows: [{ ...makeDeclRow(getCurrentYear()), currentStep: null }],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "remuneration"),
		).toMatchObject({ currentStep: 0 });
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
			representationDeclarationRows: [makeRepresentationDeclarationRow()],
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
			representationDeclarationRows: [makeRepresentationDeclarationRow()],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.filter((d) => d.type === "representation"),
		).toHaveLength(1);
	});

	it("scopes the existing-declaration lookup to the company and the reference year", async () => {
		const { caller, queries } = await makeCaller({
			representationDeclarationRows: [makeRepresentationDeclarationRow()],
		});

		await caller.getWithDeclarations({ siren: SIREN });

		const query = findQuery(queries, representationDeclarations);
		const filters = collectEqualityFilters(query?.where);
		expect(filters.get(representationDeclarations.siren)).toBe(SIREN);
		// The représentation funnel stores the reference year (N-1), not the
		// campaign year: filtering on the campaign year never matches a real row.
		expect(filters.get(representationDeclarations.year)).toBe(
			getReferenceYearFor(getCurrentYear()),
		);
		expect(filters.get(representationDeclarations.year)).not.toBe(
			getCurrentYear(),
		);
		// Exactly two filters: no status predicate, so a draft counts as much as a
		// submitted declaration — the line must never disappear once started.
		expect(filters.size).toBe(2);
	});

	it("shows the stub state when the démarche is only offered, with no row yet", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceAboveThreshold,
		);
		const { caller } = await makeCaller({ representationDeclarationRows: [] });

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "to_complete",
			fsmStatus: null,
			currentStep: 0,
			updatedAt: null,
		});
	});

	it("keeps a started draft at 'to_complete' until it leaves the subjection check", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({ status: "draft", currentStep: 0 }),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "to_complete",
			fsmStatus: null,
			currentStep: 0,
		});
	});

	it("maps a draft past the subjection check to 'in_progress' on its current step", async () => {
		const updatedAt = new Date("2026-02-10T09:00:00.000Z");
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({
					status: "draft",
					currentStep: 3,
					updatedAt,
				}),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "in_progress",
			fsmStatus: null,
			currentStep: 3,
			updatedAt,
		});
	});

	it("maps a submitted row to 'done'", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({
					status: "submitted",
					currentStep: 5,
				}),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "done",
			fsmStatus: null,
			currentStep: 5,
		});
	});

	// The row is reset to step 0 so the funnel can be reopened, but the démarche
	// is settled: the dashboard must not send the company back to complete it.
	it("maps a not-subject row to 'done' even though it sits on step 0", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({
					status: "not_subject",
					currentStep: 0,
				}),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({
			year: getCurrentYear(),
			status: "done",
			fsmStatus: null,
			currentStep: 0,
			notSubject: true,
		});
	});

	// "done" alone cannot tell a submitted démarche from a not-subject one.
	it("flags only the not-subject row, never a submitted one nor the rémunération lines", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			declRows: [makeDeclRow(getCurrentYear())],
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({
					status: "submitted",
					currentStep: 5,
				}),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({ status: "done", notSubject: false });
		expect(
			result.declarations
				.filter((d) => d.type === "remuneration")
				.map((d) => d.notSubject),
		).toEqual([false]);
	});

	it("keeps the démarche listed under the campaign year, not the stored reference year", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({ status: "draft", currentStep: 3 }),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		const representation = result.declarations.filter(
			(d) => d.type === "representation",
		);
		expect(representation).toHaveLength(1);
		expect(representation[0]?.year).toBe(getCurrentYear());
	});

	it("falls back to step 0 when the row carries no current step", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		const { caller } = await makeCaller({
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({ currentStep: null }),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({ status: "to_complete", currentStep: 0 });
	});
});

describe("companyRouter.getWithDeclarations — past-campaign closure", () => {
	const PAST_YEAR = getCurrentYear() - 2;
	const OTHER_PAST_YEAR = getCurrentYear() - 3;
	// A fixed year 2000 deadline is unambiguously elapsed no matter when the
	// suite runs, unlike relying on `getDefaultCampaignDeadlines(PAST_YEAR)`
	// racing the real system clock near a year boundary.
	const ELAPSED = new Date(2000, 0, 1);
	const NOT_YET_ELAPSED = new Date(2999, 0, 1);

	function pastDeadlines(
		year: number,
		overrides: Partial<CampaignDeadlines>,
	): CampaignDeadlines {
		return { ...getDefaultCampaignDeadlines(year), ...overrides };
	}

	beforeEach(() => {
		vi.resetAllMocks();
		getRepresentationWorkforceHistoryMock.mockResolvedValue([]);
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(getDefaultCampaignDeadlines(y)),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("S1 — closes a past-year in_progress declaration as closed_incomplete once its step deadline elapsed", async () => {
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(
				y === PAST_YEAR
					? pastDeadlines(y, { decl2ModificationDeadline: ELAPSED })
					: getDefaultCampaignDeadlines(y),
			),
		);
		const { caller } = await makeCaller({
			declRows: [
				{ ...makeDeclRow(PAST_YEAR), status: "corrective_actions_chosen" },
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === PAST_YEAR,
			),
		).toMatchObject({ status: "closed_incomplete" });
	});

	it("S2 — closes a past-year to_complete declaration as closed_not_done once its step deadline elapsed", async () => {
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(
				y === PAST_YEAR
					? pastDeadlines(y, { decl1ModificationDeadline: ELAPSED })
					: getDefaultCampaignDeadlines(y),
			),
		);
		const { caller } = await makeCaller({
			declRows: [
				{
					...makeDeclRow(PAST_YEAR),
					status: "draft",
					currentStep: 0,
				},
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === PAST_YEAR,
			),
		).toMatchObject({ status: "closed_not_done" });
	});

	it("S3 — keeps a past-year row open while its step deadline has not yet elapsed", async () => {
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(
				y === PAST_YEAR
					? pastDeadlines(y, { decl2CseOpinionDeadline: NOT_YET_ELAPSED })
					: getDefaultCampaignDeadlines(y),
			),
		);
		const { caller } = await makeCaller({
			declRows: [{ ...makeDeclRow(PAST_YEAR), status: "awaiting_cse_opinion" }],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === PAST_YEAR,
			),
		).toMatchObject({ status: "in_progress" });
	});

	it("S4 — a demarche_completed past-year row stays done, never closed", async () => {
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(
				y === PAST_YEAR
					? pastDeadlines(y, { decl2CseOpinionDeadline: ELAPSED })
					: getDefaultCampaignDeadlines(y),
			),
		);
		const { caller } = await makeCaller({
			declRows: [{ ...makeDeclRow(PAST_YEAR), status: "demarche_completed" }],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === PAST_YEAR,
			),
		).toMatchObject({ status: "done" });
	});

	it("S5 — the current-year row is never closed, whatever its deadline", async () => {
		const currentYear = getCurrentYear();
		const { caller } = await makeCaller({
			declRows: [
				{ ...makeDeclRow(currentYear), status: "draft", currentStep: 0 },
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === currentYear,
			),
		).toMatchObject({ status: "to_complete" });
		expect(getCampaignDeadlinesMock).not.toHaveBeenCalledWith(currentYear);
	});

	it("S7 — resolves each past year's deadlines independently, one call per distinct year", async () => {
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(
				y === PAST_YEAR
					? pastDeadlines(y, { decl1ModificationDeadline: ELAPSED })
					: pastDeadlines(y, { decl2ModificationDeadline: ELAPSED }),
			),
		);
		const { caller } = await makeCaller({
			declRows: [
				{
					...makeDeclRow(PAST_YEAR),
					id: "declaration-past",
					status: "draft",
					currentStep: 0,
				},
				{
					...makeDeclRow(OTHER_PAST_YEAR),
					id: "declaration-other-past",
					status: "corrective_actions_chosen",
				},
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === PAST_YEAR,
			),
		).toMatchObject({ status: "closed_not_done" });
		expect(
			result.declarations.find(
				(d) => d.type === "remuneration" && d.year === OTHER_PAST_YEAR,
			),
		).toMatchObject({ status: "closed_incomplete" });
		expect(getCampaignDeadlinesMock).toHaveBeenCalledTimes(2);
		expect(getCampaignDeadlinesMock).toHaveBeenCalledWith(PAST_YEAR);
		expect(getCampaignDeadlinesMock).toHaveBeenCalledWith(OTHER_PAST_YEAR);
	});

	it("S6 — a past-year representation-line badge is unaffected by remuneration closure", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue(
			workforceBelowThreshold,
		);
		getCampaignDeadlinesMock.mockImplementation((y: number) =>
			Promise.resolve(pastDeadlines(y, { decl1ModificationDeadline: ELAPSED })),
		);
		const { caller } = await makeCaller({
			declRows: [
				{ ...makeDeclRow(PAST_YEAR), status: "draft", currentStep: 0 },
			],
			representationDeclarationRows: [
				makeRepresentationDeclarationRow({ status: "submitted" }),
			],
		});

		const result = await caller.getWithDeclarations({ siren: SIREN });

		expect(
			result.declarations.find((d) => d.type === "representation"),
		).toMatchObject({ status: "done" });
	});
});
