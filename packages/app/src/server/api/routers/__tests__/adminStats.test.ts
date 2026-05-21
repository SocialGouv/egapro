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

type MilestoneRow = {
	sample_size: number;
	completed_sample_size: number;
	median_days: number | null;
	p90_days: number | null;
};

/**
 * Builds a mock Drizzle db where each call to `execute()` returns the next
 * planned rowset. For `getStepDurations` the order is fixed: wizard, then
 * milestones 1..5 (`submit_to_path_choice`, `path_choice_to_action`,
 * `revision_choice_to_action`, `action_to_cse_opinion`,
 * `last_action_to_complete`).
 */
function buildDb(
	rows: Array<{ day: string; year: number; count: number }> = [],
	stepRows: StepRow[] = [],
	milestoneRows: Array<MilestoneRow | undefined> = [
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
	],
) {
	const orderBy = vi.fn().mockResolvedValue(rows);
	const chain: SelectChain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy,
	};
	const execute = vi.fn();
	execute.mockResolvedValueOnce(stepRows);
	for (const milestone of milestoneRows) {
		execute.mockResolvedValueOnce(milestone ? [milestone] : []);
	}
	return {
		select: vi.fn().mockReturnValue(chain),
		execute,
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

	it("returns the 7 wizard steps + 5 post-submit milestones (12 rows) even when SQL returns nothing", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2026 });

		expect(result).toHaveLength(12);
		const wizard = result.filter((row) => row.phase === "wizard");
		const postSubmit = result.filter((row) => row.phase === "post_submit");
		expect(wizard).toHaveLength(7);
		expect(postSubmit).toHaveLength(5);
		expect(wizard.map((row) => row.step)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(postSubmit.map((row) => row.key)).toEqual([
			"submit_to_path_choice",
			"path_choice_to_action",
			"revision_choice_to_action",
			"action_to_cse_opinion",
			"last_action_to_complete",
		]);
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
			key: "step_1",
			phase: "wizard",
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
		// 1 wizard query + 5 milestone queries = 6 execute calls
		expect(db.execute).toHaveBeenCalledTimes(6);
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

	// S-K4-9 — nominal post-submit: each milestone row maps correctly to
	// its typed output (label, phase, percentiles, sample size).
	it("maps post-submit milestone rows to the typed output with FR labels (S-K4-9)", async () => {
		const db = buildDb(
			[],
			[],
			[
				{
					sample_size: 20,
					completed_sample_size: 20,
					median_days: 4.5,
					p90_days: 10.0,
				},
				{
					sample_size: 15,
					completed_sample_size: 15,
					median_days: 7.0,
					p90_days: 14.0,
				},
				{
					sample_size: 6,
					completed_sample_size: 6,
					median_days: 2.5,
					p90_days: 5.0,
				},
				{
					sample_size: 8,
					completed_sample_size: 8,
					median_days: 9.5,
					p90_days: 18.0,
				},
				{
					sample_size: 12,
					completed_sample_size: 12,
					median_days: 30.0,
					p90_days: 90.0,
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
		const postSubmit = result.filter((row) => row.phase === "post_submit");

		expect(postSubmit).toHaveLength(5);
		expect(postSubmit[0]).toMatchObject({
			key: "submit_to_path_choice",
			phase: "post_submit",
			step: null,
			label: "Soumission → choix conformité",
			sampleSize: 20,
			medianDays: 4.5,
			p90Days: 10.0,
		});
		expect(postSubmit[1]?.key).toBe("path_choice_to_action");
		expect(postSubmit[1]?.label).toBe("Choix conformité → action soumise");
		expect(postSubmit[2]?.key).toBe("revision_choice_to_action");
		expect(postSubmit[3]?.key).toBe("action_to_cse_opinion");
		expect(postSubmit[3]?.medianDays).toBe(9.5);
		expect(postSubmit[4]?.key).toBe("last_action_to_complete");
		expect(postSubmit[4]?.sampleSize).toBe(12);
	});

	// S-K4-10 — sub-set coherence: when a milestone has no rows (e.g. no
	// declaration with a path_choice), the row keeps a 0 sample and null
	// percentiles, but unrelated milestones still surface their data.
	it("keeps milestones independent: empty sub-set does not blank out the others (S-K4-10)", async () => {
		const db = buildDb(
			[],
			[],
			[
				undefined, // submit_to_path_choice — no path_choice round=1
				undefined, // path_choice_to_action — no action
				undefined, // revision_choice_to_action — no path_choice round=2
				undefined, // action_to_cse_opinion — no CSE
				{
					sample_size: 7,
					completed_sample_size: 7,
					median_days: 45.0,
					p90_days: 120.0,
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
		const postSubmit = result.filter((row) => row.phase === "post_submit");

		expect(postSubmit[0]?.sampleSize).toBe(0);
		expect(postSubmit[0]?.medianDays).toBeNull();
		expect(postSubmit[3]?.sampleSize).toBe(0);
		expect(postSubmit[4]?.sampleSize).toBe(7);
		expect(postSubmit[4]?.medianDays).toBe(45.0);
	});

	// S-K4-11 — revision cycle: jalon 3 captures path_choice round=2 →
	// joint_evaluation_submit round=2, independently from the round=1 jalons.
	it("captures the revision cycle independently of the first wave (S-K4-11)", async () => {
		const db = buildDb(
			[],
			[],
			[
				{
					sample_size: 10,
					completed_sample_size: 10,
					median_days: 5.0,
					p90_days: 10.0,
				},
				{
					sample_size: 10,
					completed_sample_size: 10,
					median_days: 6.0,
					p90_days: 11.0,
				},
				{
					sample_size: 5,
					completed_sample_size: 5,
					median_days: 20.0,
					p90_days: 40.0,
				},
				undefined,
				undefined,
			],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const revisionRow = result.find(
			(row) => row.key === "revision_choice_to_action",
		);

		expect(revisionRow).toMatchObject({
			phase: "post_submit",
			sampleSize: 5,
			completedSampleSize: 5,
			medianDays: 20.0,
			p90Days: 40.0,
		});
	});

	// S-K4-12 — fallback n < 5: sample below threshold → null percentiles,
	// but sample size stays visible so consumers know data exists.
	it("returns null percentiles for milestones with completedSampleSize < 5 (S-K4-12)", async () => {
		const db = buildDb(
			[],
			[],
			[
				{
					sample_size: 4,
					completed_sample_size: 4,
					median_days: 3.0,
					p90_days: 5.5,
				},
				undefined,
				undefined,
				undefined,
				undefined,
			],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const firstMilestone = result.find(
			(row) => row.key === "submit_to_path_choice",
		);

		expect(firstMilestone?.sampleSize).toBe(4);
		expect(firstMilestone?.medianDays).toBeNull();
		expect(firstMilestone?.p90Days).toBeNull();
	});

	// S-K4-13 — sample size 0: a milestone with no qualifying declarations
	// keeps a 0 sample size and null percentiles. Drives the "no data yet"
	// state in the table.
	it("renders milestones with no data as zero-sample / null-percentile rows (S-K4-13)", async () => {
		const db = buildDb(
			[],
			[],
			[undefined, undefined, undefined, undefined, undefined],
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const postSubmit = result.filter((row) => row.phase === "post_submit");

		expect(postSubmit).toHaveLength(5);
		for (const row of postSubmit) {
			expect(row.sampleSize).toBe(0);
			expect(row.completedSampleSize).toBe(0);
			expect(row.medianDays).toBeNull();
			expect(row.p90Days).toBeNull();
		}
	});
});
