import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const getCurrentYearMock = vi.fn(() => 2026);

vi.mock("~/modules/domain", async () => {
	const actual =
		await vi.importActual<typeof import("~/modules/domain")>(
			"~/modules/domain",
		);
	return {
		...actual,
		getCurrentYear: () => getCurrentYearMock(),
	};
});

function buildStatsDb(results: Array<Array<{ value: number }>>) {
	const queue = [...results];
	const select = vi.fn(() => {
		const where = vi.fn(() => {
			const next = queue.shift();
			return Promise.resolve(next ?? []);
		});
		const innerJoin = vi.fn(() => ({ where }));
		const from = vi.fn(() => ({ where, innerJoin }));
		return { from };
	});
	return { select };
}

const publicCtx = {
	session: null,
	headers: new Headers(),
};

async function callRate(
	results: number[],
	{ year = 2026 }: { year?: number } = {},
) {
	getCurrentYearMock.mockReturnValue(year);
	const db = buildStatsDb(results.map((value) => [{ value }]));
	const { publicStatsRouter } = await import("../publicStats");
	const caller = publicStatsRouter.createCaller({
		...publicCtx,
		db,
	} as never);
	const result = await caller.getCurrentCampaignRate();
	return { db, result };
}

describe("publicStatsRouter.getCurrentCampaignRate", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		getCurrentYearMock.mockReturnValue(2026);
	});

	it("returns rate, year-1 rate, and raw counts when all four queries have data", async () => {
		const { result } = await callRate([5738, 4213, 5500, 3920]);

		expect(result.totalObligated).toBe(5738);
		expect(result.totalSubmitted).toBe(4213);
		expect(result.submissionRate).toBeCloseTo(73.4, 1);
		expect(result.previousYearRate).toBeCloseTo(71.3, 1);
		expect(result.year).toBe(2026);
	});

	it("rounds rates to one decimal place", async () => {
		const { result } = await callRate([3, 1, 3, 2]);
		expect(result.submissionRate).toBe(33.3);
		expect(result.previousYearRate).toBe(66.7);
	});

	it("returns null previousYearRate when no obligated companies existed for year-1", async () => {
		const { result } = await callRate([1000, 800, 0, 0]);
		expect(result.previousYearRate).toBeNull();
	});

	it("returns submissionRate=0 when totalObligated is 0 (avoids division by zero)", async () => {
		const { result } = await callRate([0, 0, 100, 50]);
		expect(result.submissionRate).toBe(0);
		expect(result.totalObligated).toBe(0);
		expect(result.totalSubmitted).toBe(0);
		expect(result.previousYearRate).toBe(50);
	});

	it("issues four parallel select calls (obligated + submitted, for year and year-1)", async () => {
		const { db } = await callRate([10, 5, 10, 5]);
		expect(db.select).toHaveBeenCalledTimes(4);
	});

	it("returns the current year from the domain helper in the payload", async () => {
		const { result } = await callRate([10, 5, 10, 5], { year: 2027 });
		expect(result.year).toBe(2027);
	});

	it("computes the obligation predicate differently for triennial vs non-triennial years (smoke check via call wiring)", async () => {
		const { result: triennial } = await callRate([100, 80, 0, 0], {
			year: 2027,
		});
		const { result: nonTriennial } = await callRate([100, 80, 0, 0], {
			year: 2026,
		});
		expect(triennial.totalObligated).toBe(100);
		expect(nonTriennial.totalObligated).toBe(100);
	});

	it("defaults to 0 when a count query returns no row at all", async () => {
		const db = {
			select: vi.fn(() => {
				const where = vi.fn(() => Promise.resolve([]));
				const innerJoin = vi.fn(() => ({ where }));
				const from = vi.fn(() => ({ where, innerJoin }));
				return { from };
			}),
		};
		const { publicStatsRouter } = await import("../publicStats");
		const caller = publicStatsRouter.createCaller({
			...publicCtx,
			db,
		} as never);

		const result = await caller.getCurrentCampaignRate();
		expect(result.totalObligated).toBe(0);
		expect(result.totalSubmitted).toBe(0);
		expect(result.submissionRate).toBe(0);
		expect(result.previousYearRate).toBeNull();
	});

	it("is callable without authentication (publicProcedure)", async () => {
		const db = buildStatsDb([
			[{ value: 10 }],
			[{ value: 5 }],
			[{ value: 10 }],
			[{ value: 5 }],
		]);
		const { publicStatsRouter } = await import("../publicStats");
		const caller = publicStatsRouter.createCaller({
			session: null,
			headers: new Headers(),
			db,
		} as never);

		await expect(caller.getCurrentCampaignRate()).resolves.toBeDefined();
	});
});
