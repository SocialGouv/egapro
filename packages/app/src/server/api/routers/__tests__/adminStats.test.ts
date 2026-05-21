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
 * milestones 1..4 (`submit_to_path_choice`,
 * `path_choice_to_second_declaration`, `path_choice_to_joint_evaluation`,
 * `action_to_cse_opinion`).
 */
function buildDb(
	rows: Array<{ day: string; year: number; count: number }> = [],
	stepRows: StepRow[] = [],
	milestoneRows: Array<MilestoneRow | undefined> = [
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

// FIFO queue: 4 parallel COUNT queries each consume one result in call order.
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

	it("uses gte (open-ended) workforce filter when sizeRange is 250+", async () => {
		const db = buildDb([]);
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

	it("returns the 6 wizard steps + 4 post-submit milestones (10 rows) even when SQL returns nothing", async () => {
		const db = buildDb([], []);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2026 });

		expect(result).toHaveLength(10);
		const wizard = result.filter((row) => row.phase === "wizard");
		const postSubmit = result.filter((row) => row.phase === "post_submit");
		expect(wizard).toHaveLength(6);
		expect(postSubmit).toHaveLength(4);
		expect(wizard.map((row) => row.step)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(postSubmit.map((row) => row.key)).toEqual([
			"submit_to_path_choice",
			"path_choice_to_second_declaration",
			"path_choice_to_joint_evaluation",
			"action_to_cse_opinion",
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
		expect(db.execute).toHaveBeenCalledTimes(5);
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
					sample_size: 9,
					completed_sample_size: 9,
					median_days: 7.0,
					p90_days: 14.0,
				},
				{
					sample_size: 6,
					completed_sample_size: 6,
					median_days: 5.5,
					p90_days: 11.0,
				},
				{
					sample_size: 8,
					completed_sample_size: 8,
					median_days: 9.5,
					p90_days: 18.0,
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

		expect(postSubmit).toHaveLength(4);
		expect(postSubmit[0]).toMatchObject({
			key: "submit_to_path_choice",
			phase: "post_submit",
			step: null,
			label: "Délai avant choix du parcours",
			sampleSize: 20,
			medianDays: 4.5,
			p90Days: 10.0,
		});
		expect(postSubmit[1]?.key).toBe("path_choice_to_second_declaration");
		expect(postSubmit[1]?.label).toBe("Temps passé sur la seconde déclaration");
		expect(postSubmit[1]?.medianDays).toBe(7.0);
		expect(postSubmit[2]?.key).toBe("path_choice_to_joint_evaluation");
		expect(postSubmit[2]?.label).toBe("Temps passé sur l'évaluation conjointe");
		expect(postSubmit[2]?.medianDays).toBe(5.5);
		expect(postSubmit[3]?.key).toBe("action_to_cse_opinion");
		expect(postSubmit[3]?.label).toBe("Temps passé sur l'avis CSE");
		expect(postSubmit[3]?.medianDays).toBe(9.5);
	});

	it("keeps milestones independent: empty sub-set does not blank out the others (S-K4-10)", async () => {
		const db = buildDb(
			[],
			[],
			[
				undefined, // submit_to_path_choice — no path_choice round=1
				undefined, // path_choice_to_second_declaration — no second decl
				undefined, // path_choice_to_joint_evaluation — no joint eval
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
		expect(postSubmit[2]?.sampleSize).toBe(0);
		expect(postSubmit[3]?.sampleSize).toBe(7);
		expect(postSubmit[3]?.medianDays).toBe(45.0);
	});

	it("aggregates initial and revision joint-evaluation cycles under a single milestone (S-K4-16)", async () => {
		const db = buildDb(
			[],
			[],
			[
				undefined,
				undefined,
				{
					sample_size: 8,
					completed_sample_size: 8,
					median_days: 12.5,
					p90_days: 30.0,
				},
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
		const jointEvaluationRow = result.find(
			(row) => row.key === "path_choice_to_joint_evaluation",
		);

		expect(jointEvaluationRow).toMatchObject({
			phase: "post_submit",
			step: null,
			label: "Temps passé sur l'évaluation conjointe",
			sampleSize: 8,
			completedSampleSize: 8,
			medianDays: 12.5,
			p90Days: 30.0,
		});

		expect(
			result.find((row) => row.key === "revision_choice_to_action"),
		).toBeUndefined();
		expect(
			result.find((row) => row.key === "last_action_to_complete"),
		).toBeUndefined();
	});

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

	it("renders milestones with no data as zero-sample / null-percentile rows (S-K4-13)", async () => {
		const db = buildDb([], [], [undefined, undefined, undefined, undefined]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getStepDurations({ year: 2025 });
		const postSubmit = result.filter((row) => row.phase === "post_submit");

		expect(postSubmit).toHaveLength(4);
		for (const row of postSubmit) {
			expect(row.sampleSize).toBe(0);
			expect(row.completedSampleSize).toBe(0);
			expect(row.medianDays).toBeNull();
			expect(row.p90Days).toBeNull();
		}
	});

	it("surfaces second_declaration and joint_evaluation as two separate post-submit lines (S-K4-14)", async () => {
		const db = buildDb(
			[],
			[],
			[
				undefined,
				{
					sample_size: 11,
					completed_sample_size: 11,
					median_days: 8.0,
					p90_days: 16.0,
				},
				{
					sample_size: 7,
					completed_sample_size: 7,
					median_days: 12.0,
					p90_days: 22.0,
				},
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
		const secondDeclarationRow = result.find(
			(row) => row.key === "path_choice_to_second_declaration",
		);
		const jointEvaluationRow = result.find(
			(row) => row.key === "path_choice_to_joint_evaluation",
		);

		expect(secondDeclarationRow).toMatchObject({
			phase: "post_submit",
			step: null,
			label: "Temps passé sur la seconde déclaration",
			sampleSize: 11,
			completedSampleSize: 11,
			medianDays: 8.0,
			p90Days: 16.0,
		});
		expect(jointEvaluationRow).toMatchObject({
			phase: "post_submit",
			step: null,
			label: "Temps passé sur l'évaluation conjointe",
			sampleSize: 7,
			completedSampleSize: 7,
			medianDays: 12.0,
			p90Days: 22.0,
		});
	});

	it("never returns a wizard row with step === 6 (S-K4-15)", async () => {
		const db = buildDb(
			[],
			[
				{
					step: 0,
					sample_size: 12,
					completed_sample_size: 12,
					median_days: 1,
					p90_days: 2,
				},
				{
					step: 5,
					sample_size: 8,
					completed_sample_size: 8,
					median_days: 4,
					p90_days: 9,
				},
				{
					step: 6,
					sample_size: 5,
					completed_sample_size: 0,
					median_days: null,
					p90_days: null,
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
		const wizard = result.filter((row) => row.phase === "wizard");

		expect(wizard.some((row) => row.step === 6)).toBe(false);
		expect(wizard.map((row) => row.step)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(result.find((row) => row.label === "Récapitulatif")).toBeUndefined();
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
