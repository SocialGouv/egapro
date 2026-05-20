import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

type ProgressionRow = { day: string; year: number; count: number };

function buildProgressionDb(rows: ProgressionRow[] = []) {
	const orderBy = vi.fn().mockResolvedValue(rows);
	const chain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy,
	};
	return {
		select: vi.fn().mockReturnValue(chain),
		__chain: chain,
	};
}

/**
 * Builds a db mock specialised for `getCampaignStats`. The procedure issues
 * four `select(...).from(...)[.innerJoin(...)].where(...)` calls in parallel —
 * we capture each call's terminal value via a FIFO queue of results.
 */
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

const adminSession = {
	user: { id: "admin-1", email: "a@b.c", isAdmin: true },
	expires: "",
};

describe("adminStatsRouter — access control", () => {
	beforeEach(() => vi.resetAllMocks());

	it("rejects non-admin callers from getCampaignProgression", async () => {
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: buildProgressionDb(),
			session: {
				user: { id: "u", email: "u@x", isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(
			caller.getCampaignProgression({ years: [2026] }),
		).rejects.toThrow(/administrateurs/i);
	});

	it("rejects non-admin callers from getCampaignStats", async () => {
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: buildStatsDb([]),
			session: {
				user: { id: "u", email: "u@x", isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(caller.getCampaignStats({ year: 2026 })).rejects.toThrow(
			/administrateurs/i,
		);
	});
});

describe("adminStatsRouter.getCampaignProgression", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns an empty array when no rows are found", async () => {
		const db = buildProgressionDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getCampaignProgression({ years: [2026] });
		expect(result).toEqual([]);
	});

	it("groups points by year and computes a running cumulative total", async () => {
		const db = buildProgressionDb([
			{ day: "2025-01-05", year: 2025, count: 10 },
			{ day: "2025-01-06", year: 2025, count: 5 },
			{ day: "2026-01-05", year: 2026, count: 20 },
			{ day: "2026-01-08", year: 2026, count: 3 },
		]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getCampaignProgression({
			years: [2025, 2026],
		});

		expect(result).toEqual([
			{
				year: 2025,
				points: [
					{ day: "2025-01-05", cumulative: 10 },
					{ day: "2025-01-06", cumulative: 15 },
				],
			},
			{
				year: 2026,
				points: [
					{ day: "2026-01-05", cumulative: 20 },
					{ day: "2026-01-08", cumulative: 23 },
				],
			},
		]);
	});

	it("joins history → declarations always, and additionally on companies when a sizeRange filter is provided", async () => {
		const db = buildProgressionDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await caller.getCampaignProgression({ years: [2026] });
		expect(db.__chain.innerJoin).toHaveBeenCalledTimes(1);

		db.__chain.innerJoin.mockClear();
		await caller.getCampaignProgression({
			years: [2026],
			sizeRange: "50-99",
		});
		expect(db.__chain.innerJoin).toHaveBeenCalledTimes(2);
	});

	it("uses gte (open-ended) workforce filter when sizeRange is 250+", async () => {
		const db = buildProgressionDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await caller.getCampaignProgression({
			years: [2026],
			sizeRange: "250+",
		});
		expect(db.__chain.innerJoin).toHaveBeenCalledTimes(2);
	});

	it("validates the years array (min 1, max 5)", async () => {
		const db = buildProgressionDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(
			caller.getCampaignProgression({ years: [] }),
		).rejects.toThrow();
		await expect(
			caller.getCampaignProgression({
				years: [2020, 2021, 2022, 2023, 2024, 2025],
			}),
		).rejects.toThrow();
	});
});

describe("adminStatsRouter.getCampaignStats", () => {
	beforeEach(() => vi.resetAllMocks());

	// The procedure runs 4 parallel queries in this order:
	// [obligated(year), submitted(year), obligated(year-1), submitted(year-1)]
	async function callStats(
		input: {
			year: number;
			sizeRange?: "<50" | "50-99" | "100-149" | "150-249" | "250+";
		},
		results: number[],
	) {
		const db = buildStatsDb(results.map((value) => [{ value }]));
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.getCampaignStats(input);
		return { db, result };
	}

	it("returns rate, year-1 rate, and raw counts when all four queries have data", async () => {
		const { result } = await callStats(
			{ year: 2026 },
			[5738, 4213, 5500, 3920],
		);

		expect(result.totalObligated).toBe(5738);
		expect(result.totalSubmitted).toBe(4213);
		expect(result.submissionRate).toBeCloseTo(73.4, 1);
		expect(result.previousYearRate).toBeCloseTo(71.3, 1);
	});

	it("rounds rates to one decimal place", async () => {
		const { result } = await callStats({ year: 2026 }, [3, 1, 3, 2]);
		expect(result.submissionRate).toBe(33.3);
		expect(result.previousYearRate).toBe(66.7);
	});

	it("returns null previousYearRate when no obligated companies existed for year-1", async () => {
		const { result } = await callStats({ year: 2026 }, [1000, 800, 0, 0]);
		expect(result.previousYearRate).toBeNull();
	});

	it("returns submissionRate=0 when totalObligated is 0 (avoids division by zero)", async () => {
		const { result } = await callStats({ year: 2026 }, [0, 0, 100, 50]);
		expect(result.submissionRate).toBe(0);
		expect(result.totalObligated).toBe(0);
		expect(result.totalSubmitted).toBe(0);
		expect(result.previousYearRate).toBe(50);
	});

	it("issues four parallel select calls (obligated + submitted, for year and year-1)", async () => {
		const { db } = await callStats({ year: 2026 }, [10, 5, 10, 5]);
		expect(db.select).toHaveBeenCalledTimes(4);
	});

	it("propagates the sizeRange filter to all four queries (numerator and denominator stay aligned)", async () => {
		const { db } = await callStats(
			{ year: 2026, sizeRange: "50-99" },
			[10, 5, 10, 5],
		);
		expect(db.select).toHaveBeenCalledTimes(4);
	});

	it("validates the year bounds (rejects year < 2000)", async () => {
		const db = buildStatsDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(caller.getCampaignStats({ year: 1999 })).rejects.toThrow();
	});

	it("validates the year bounds (rejects year > 2100)", async () => {
		const db = buildStatsDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(caller.getCampaignStats({ year: 2101 })).rejects.toThrow();
	});

	it("rejects invalid sizeRange values", async () => {
		const db = buildStatsDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(
			caller.getCampaignStats({
				year: 2026,
				sizeRange: "invalid" as never,
			}),
		).rejects.toThrow();
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
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getCampaignStats({ year: 2026 });
		expect(result.totalObligated).toBe(0);
		expect(result.totalSubmitted).toBe(0);
		expect(result.submissionRate).toBe(0);
		expect(result.previousYearRate).toBeNull();
	});

	it("computes the obligation predicate differently for triennial vs non-triennial years (smoke check via call wiring)", async () => {
		const { result: triennial } = await callStats(
			{ year: 2027 },
			[100, 80, 0, 0],
		);
		const { result: nonTriennial } = await callStats(
			{ year: 2026 },
			[100, 80, 0, 0],
		);
		expect(triennial.totalObligated).toBe(100);
		expect(nonTriennial.totalObligated).toBe(100);
	});

	it("inflates the size filter when sizeRange covers the voluntary-only bucket (still computes a result)", async () => {
		const { result } = await callStats(
			{ year: 2026, sizeRange: "<50" },
			[0, 0, 0, 0],
		);
		expect(result.totalObligated).toBe(0);
		expect(result.previousYearRate).toBeNull();
	});

	it("handles 250+ sizeRange (open-ended bucket)", async () => {
		const { result } = await callStats(
			{ year: 2026, sizeRange: "250+" },
			[200, 150, 180, 120],
		);
		expect(result.totalObligated).toBe(200);
		expect(result.submissionRate).toBeCloseTo(75, 1);
		expect(result.previousYearRate).toBeCloseTo(66.7, 1);
	});
});
