import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

type SelectChain = {
	from: ReturnType<typeof vi.fn>;
	innerJoin: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	groupBy: ReturnType<typeof vi.fn>;
	orderBy: ReturnType<typeof vi.fn>;
};

function buildDb(
	rows: Array<{ day: string; year: number; count: number }> = [],
) {
	const orderBy = vi.fn().mockResolvedValue(rows);
	const chain: SelectChain = {
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

const adminSession = {
	user: { id: "admin-1", email: "a@b.c", isAdmin: true },
	expires: "",
};

describe("adminStatsRouter — access control", () => {
	beforeEach(() => vi.resetAllMocks());

	it("rejects non-admin callers", async () => {
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: buildDb(),
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
});

describe("adminStatsRouter.getCampaignProgression", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns an empty array when no rows are found", async () => {
		const db = buildDb([]);
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
		const db = buildDb([
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

	it("joins on companies only when a sizeRange filter is provided", async () => {
		const db = buildDb([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await caller.getCampaignProgression({ years: [2026] });
		expect(db.__chain.innerJoin).not.toHaveBeenCalled();

		await caller.getCampaignProgression({
			years: [2026],
			sizeRange: "50-99",
		});
		expect(db.__chain.innerJoin).toHaveBeenCalledTimes(1);
	});

	it("validates the years array (min 1, max 5)", async () => {
		const db = buildDb([]);
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

// ------------------------------------------------------------------
// K8 — getGapAlertRate
// ------------------------------------------------------------------

type GapRateRow = { total: number; alerts: number };
type GapRateDb = ReturnType<typeof buildGapRateDb>;

/**
 * Build a DB mock for `getGapAlertRate` — the procedure calls computeYearRate
 * twice (current year + N-1), so we queue two row sets and track which chain
 * gets returned on each `select()` call.
 */
function buildGapRateDb(rowsPerCall: GapRateRow[]) {
	const calls: Array<{
		innerJoin: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
	}> = [];

	const select = vi.fn().mockImplementation(() => {
		const row = rowsPerCall[calls.length];
		const where = vi.fn().mockResolvedValue(row ? [row] : []);
		const innerJoin = vi.fn().mockImplementation(() => ({ where }));
		const from = vi.fn().mockImplementation(() => ({ innerJoin, where }));
		calls.push({ innerJoin, where });
		return { from };
	});

	return { select, calls };
}

function buildCaller(db: GapRateDb | ReturnType<typeof buildDb>) {
	return import("../adminStats").then(({ adminStatsRouter }) =>
		adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never),
	);
}

describe("adminStatsRouter.getGapAlertRate", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns nulls for rate / delta and sampleSize=0 when no declaration matches", async () => {
		const db = buildGapRateDb([
			{ total: 0, alerts: 0 },
			{ total: 0, alerts: 0 },
		]);
		const caller = await buildCaller(db);

		const result = await caller.getGapAlertRate({ year: 2026 });

		expect(result).toEqual({
			rate: null,
			previousRate: null,
			delta: null,
			sampleSize: 0,
		});
	});

	it("returns delta=null when the previous year has no sample", async () => {
		const db = buildGapRateDb([
			{ total: 1000, alerts: 420 },
			{ total: 0, alerts: 0 },
		]);
		const caller = await buildCaller(db);

		const result = await caller.getGapAlertRate({ year: 2026 });

		expect(result.rate).toBe(42);
		expect(result.previousRate).toBeNull();
		expect(result.delta).toBeNull();
		expect(result.sampleSize).toBe(1000);
	});

	it("computes a positive delta when the rate rises (degradation)", async () => {
		const db = buildGapRateDb([
			{ total: 1000, alerts: 423 }, // 42.3% in 2026
			{ total: 1000, alerts: 411 }, // 41.1% in 2025
		]);
		const caller = await buildCaller(db);

		const result = await caller.getGapAlertRate({ year: 2026 });

		expect(result.rate).toBe(42.3);
		expect(result.previousRate).toBe(41.1);
		expect(result.delta).toBeCloseTo(1.2, 5);
		expect(result.sampleSize).toBe(1000);
	});

	it("computes a negative delta when the rate improves", async () => {
		const db = buildGapRateDb([
			{ total: 1000, alerts: 388 }, // 38.8%
			{ total: 1000, alerts: 411 }, // 41.1%
		]);
		const caller = await buildCaller(db);

		const result = await caller.getGapAlertRate({ year: 2026 });

		expect(result.delta).toBeCloseTo(-2.3, 5);
	});

	it("joins on companies only when a sizeRange or nafCodePrefix filter is given", async () => {
		const db = buildGapRateDb([
			{ total: 10, alerts: 1 },
			{ total: 10, alerts: 1 },
			{ total: 10, alerts: 1 },
			{ total: 10, alerts: 1 },
			{ total: 10, alerts: 1 },
			{ total: 10, alerts: 1 },
		]);
		const caller = await buildCaller(db);

		// No filter → no companies join
		await caller.getGapAlertRate({ year: 2026 });
		expect(db.calls[0]?.innerJoin).not.toHaveBeenCalled();
		expect(db.calls[1]?.innerJoin).not.toHaveBeenCalled();

		// sizeRange only → join
		await caller.getGapAlertRate({ year: 2026, sizeRange: "50-99" });
		expect(db.calls[2]?.innerJoin).toHaveBeenCalledTimes(1);
		expect(db.calls[3]?.innerJoin).toHaveBeenCalledTimes(1);

		// nafCodePrefix only → join
		await caller.getGapAlertRate({ year: 2026, nafCodePrefix: "J" });
		expect(db.calls[4]?.innerJoin).toHaveBeenCalledTimes(1);
		expect(db.calls[5]?.innerJoin).toHaveBeenCalledTimes(1);
	});

	it("rejects invalid NAF code prefixes (must be a single letter A–U)", async () => {
		const db = buildGapRateDb([]);
		const caller = await buildCaller(db);

		await expect(
			caller.getGapAlertRate({ year: 2026, nafCodePrefix: "Z" }),
		).rejects.toThrow();
		await expect(
			caller.getGapAlertRate({ year: 2026, nafCodePrefix: "AB" }),
		).rejects.toThrow();
		await expect(
			caller.getGapAlertRate({ year: 2026, nafCodePrefix: "a" }),
		).rejects.toThrow();
	});
});
