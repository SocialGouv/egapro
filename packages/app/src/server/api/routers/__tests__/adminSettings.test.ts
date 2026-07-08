import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const validInput = {
	year: 2026,
	gipPublicationDate: "2026-03-01",
	campaignStartDate: "2026-03-15",
	publicDataReleaseDate: "2026-06-01",
	decl1ModificationDeadline: "2026-06-01",
	decl1JustificationDeadline: "2026-06-01",
	decl1JointEvaluationDeadline: "2026-08-01",
	decl2ModificationDeadline: "2026-12-01",
	decl2JustificationDeadline: "2026-12-01",
	decl2JointEvaluationDeadline: "2027-02-01",
};

function buildDb(overrides: Partial<Record<string, unknown>> = {}) {
	const chainQuery = {
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockResolvedValue([]),
	};
	const onConflict = vi.fn().mockResolvedValue(undefined);
	const insertChain = {
		values: vi.fn().mockReturnValue({ onConflictDoUpdate: onConflict }),
	};
	return {
		select: vi.fn().mockReturnValue(chainQuery),
		insert: vi.fn().mockReturnValue(insertChain),
		__chainQuery: chainQuery,
		__insert: insertChain,
		__onConflict: onConflict,
		...overrides,
	};
}

const adminSession = {
	user: { id: "admin-1", email: "a@b.c", isAdmin: true },
	expires: "",
};

describe("adminSettingsRouter — access control", () => {
	beforeEach(() => vi.resetAllMocks());

	it("rejects non-admin callers on getOverview", async () => {
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db: buildDb(),
			session: { user: { id: "u", email: "u@x", isAdmin: false }, expires: "" },
			headers: new Headers(),
		} as never);
		await expect(caller.getOverview()).rejects.toThrow(/administrateurs/i);
	});
});

describe("adminSettingsRouter — getOverview", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns the list of configured years", async () => {
		const db = buildDb();
		db.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({
				orderBy: vi
					.fn()
					.mockResolvedValue([{ year: 2025 }, { year: 2026 }, { year: 2027 }]),
			}),
		});
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.getOverview();
		expect(result.configuredYears).toEqual([2025, 2026, 2027]);
	});

	it("returns an empty list when no deadlines are configured", async () => {
		const db = buildDb();
		db.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([]) }),
		});
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.getOverview();
		expect(result.configuredYears).toEqual([]);
	});
});

describe("adminSettingsRouter — getDeadlinesByYear", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns DB row when present", async () => {
		const db = buildDb();
		db.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{
							year: 2026,
							gipPublicationDate: "2026-03-01",
							campaignStartDate: "2026-03-15",
							publicDataReleaseDate: "2026-06-01",
							decl1ModificationDeadline: "2026-06-01",
							decl1JustificationDeadline: "2026-06-01",
							decl1JointEvaluationDeadline: "2026-08-01",
							decl2ModificationDeadline: "2026-12-01",
							decl2JustificationDeadline: "2026-12-01",
							decl2JointEvaluationDeadline: "2027-02-01",
						},
					]),
				}),
			}),
		});
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.getDeadlinesByYear({ year: 2026 });
		expect(result.exists).toBe(true);
		expect(result.gipPublicationDate).toBe("2026-03-01");
		expect(result.publicDataReleaseDate).toBe("2026-06-01");
		expect(result.decl1ModificationDeadline).toBe("2026-06-01");
	});

	it("returns formatted defaults when no row exists", async () => {
		const db = buildDb();
		db.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({
				where: vi
					.fn()
					.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
			}),
		});
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.getDeadlinesByYear({ year: 2027 });
		expect(result.exists).toBe(false);
		expect(result.gipPublicationDate).toBeNull();
		expect(result.campaignStartDate).toBeNull();
		expect(result.publicDataReleaseDate).toBeNull();
		expect(result.decl1ModificationDeadline).toMatch(/^2027-06-01$/);
	});
});

describe("adminSettingsRouter — upsertCampaignDeadlines", () => {
	beforeEach(() => vi.resetAllMocks());

	it("calls insert().onConflictDoUpdate with the validated values", async () => {
		const db = buildDb();
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		const result = await caller.upsertCampaignDeadlines(validInput);
		expect(result).toEqual({ success: true });
		expect(db.insert).toHaveBeenCalled();
		expect(db.__insert.values).toHaveBeenCalledWith(
			expect.objectContaining({
				year: 2026,
				publicDataReleaseDate: "2026-06-01",
				decl1ModificationDeadline: "2026-06-01",
			}),
		);
		expect(db.__onConflict).toHaveBeenCalled();
	});

	it("rejects when decl2 is not strictly after decl1", async () => {
		const db = buildDb();
		const { adminSettingsRouter } = await import("../adminSettings");
		const caller = adminSettingsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);
		await expect(
			caller.upsertCampaignDeadlines({
				...validInput,
				decl2ModificationDeadline: "2026-05-01",
			}),
		).rejects.toThrow();
	});
});
