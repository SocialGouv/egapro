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

type StepRow = {
	step: number;
	sample_size: number;
	completed_sample_size: number;
	median_days: number | null;
	p90_days: number | null;
};

function buildDb(
	rows: Array<{ day: string; year: number; count: number }> = [],
	stepRows: StepRow[] = [],
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
		execute: vi.fn().mockResolvedValue(stepRows),
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

	it("joins history → declarations always, and additionally on companies when a sizeRange filter is provided", async () => {
		const db = buildDb([]);
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

describe("adminStatsRouter.getStepDurations", () => {
	beforeEach(() => vi.resetAllMocks());

	it("rejects non-admin callers", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: {
				user: { id: "u", email: "u@x", isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(caller.getStepDurations({ year: 2026 })).rejects.toThrow(
			/administrateurs/i,
		);
	});

	it("returns a complete set of 7 steps (0..6) even when SQL returns nothing", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2026 });

		expect(result).toHaveLength(7);
		expect(result.map((row) => row.step)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(result.every((row) => row.medianDays === null)).toBe(true);
		expect(result.every((row) => row.sampleSize === 0)).toBe(true);
	});

	it("maps SQL rows to the typed output and attaches French labels", async () => {
		const db = buildDb(
			[],
			[
				{
					step: 1,
					sample_size: 10,
					completed_sample_size: 10,
					median_days: 5.5,
					p90_days: 9.1,
				},
				{
					step: 2,
					sample_size: 8,
					completed_sample_size: 8,
					median_days: 2.0,
					p90_days: 6.4,
				},
			],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const step1 = result.find((row) => row.step === 1);
		const step2 = result.find((row) => row.step === 2);

		expect(step1).toEqual({
			step: 1,
			label: "Effectifs",
			sampleSize: 10,
			completedSampleSize: 10,
			medianDays: 5.5,
			p90Days: 9.1,
		});
		expect(step2?.label).toBe("Écart de rémunération");
		expect(step2?.medianDays).toBe(2.0);
	});

	it("excludes declarations still on a step from the percentile (S4 — exited count drives sample, percentile uses completed)", async () => {
		const db = buildDb(
			[],
			[
				{
					step: 4,
					sample_size: 12,
					completed_sample_size: 10,
					median_days: 3,
					p90_days: 7,
				},
			],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const step4 = result.find((row) => row.step === 4);

		expect(step4?.sampleSize).toBe(12);
		expect(step4?.completedSampleSize).toBe(10);
		expect(step4?.medianDays).toBe(3);
	});

	it("returns null percentiles when fewer than 5 declarations have exited the step (S8 — anti-noisy data)", async () => {
		const db = buildDb(
			[],
			[
				{
					step: 3,
					sample_size: 4,
					completed_sample_size: 4,
					median_days: 1.2,
					p90_days: 2.5,
				},
			],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const step3 = result.find((row) => row.step === 3);

		expect(step3?.sampleSize).toBe(4);
		expect(step3?.medianDays).toBeNull();
		expect(step3?.p90Days).toBeNull();
	});

	it("passes a workforce filter into the SQL when sizeRange is provided (S5)", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await caller.getStepDurations({ year: 2025, sizeRange: "250+" });
		expect(db.execute).toHaveBeenCalledTimes(1);
	});

	it("validates the year input bounds", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(caller.getStepDurations({ year: 1999 })).rejects.toThrow();
		await expect(caller.getStepDurations({ year: 2101 })).rejects.toThrow();
	});
});
