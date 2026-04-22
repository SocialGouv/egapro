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

function buildDb(rows: Array<{ day: Date; year: number; count: number }> = []) {
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
			{ day: new Date("2025-01-05T00:00:00Z"), year: 2025, count: 10 },
			{ day: new Date("2025-01-06T00:00:00Z"), year: 2025, count: 5 },
			{ day: new Date("2026-01-05T00:00:00Z"), year: 2026, count: 20 },
			{ day: new Date("2026-01-08T00:00:00Z"), year: 2026, count: 3 },
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
