import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCK_TIMEOUT_MINUTES } from "~/modules/domain";
import { campaignDeadlines, representationCampaigns } from "~/server/db/schema";

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

const validRepresentationInput = {
	year: 2026,
	campaignStartDate: "2026-02-01",
	campaignEndDate: "2026-11-30",
	declarationDeadline: "2026-04-15",
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

const nonAdminSession = {
	user: { id: "u", email: "u@x", isAdmin: false },
	expires: "",
};

async function buildCaller(
	db: ReturnType<typeof buildDb>,
	session: typeof adminSession | typeof nonAdminSession = adminSession,
) {
	const { adminSettingsRouter } = await import("../adminSettings");
	return adminSettingsRouter.createCaller({
		db,
		session,
		headers: new Headers(),
	} as never);
}

describe("adminSettingsRouter — access control", () => {
	beforeEach(() => vi.resetAllMocks());

	it("rejects non-admin callers on getOverview", async () => {
		const caller = await buildCaller(buildDb(), nonAdminSession);
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
		const caller = await buildCaller(db);
		const result = await caller.getOverview();
		expect(result.configuredYears).toEqual([2025, 2026, 2027]);
	});

	it("returns an empty list when no deadlines are configured", async () => {
		const db = buildDb();
		db.select.mockReturnValueOnce({
			from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([]) }),
		});
		const caller = await buildCaller(db);
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
		const caller = await buildCaller(db);
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
		const caller = await buildCaller(db);
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
		const caller = await buildCaller(db);
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
		const caller = await buildCaller(buildDb());
		await expect(
			caller.upsertCampaignDeadlines({
				...validInput,
				decl2ModificationDeadline: "2026-05-01",
			}),
		).rejects.toThrow();
	});
});

describe("adminSettingsRouter — lock timeout", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns the stored timeout", async () => {
		const db = buildDb();
		db.__chainQuery.limit.mockResolvedValue([
			{ declarationLockTimeoutMinutes: 45 },
		]);
		const caller = await buildCaller(db);

		expect(await caller.getLockTimeout()).toEqual({ timeoutMinutes: 45 });
	});

	it("falls back to the default timeout when nothing is stored", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		expect(await caller.getLockTimeout()).toEqual({
			timeoutMinutes: DEFAULT_LOCK_TIMEOUT_MINUTES,
		});
	});

	it("writes the new timeout and stamps the acting admin", async () => {
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where });
		const db = buildDb({ update: vi.fn().mockReturnValue({ set }) });
		const caller = await buildCaller(db);

		const result = await caller.updateLockTimeout({ timeoutMinutes: 60 });

		expect(result).toEqual({ success: true });
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				declarationLockTimeoutMinutes: 60,
				updatedBy: "admin-1",
			}),
		);
	});

	it.each([
		0, 1441, 12.5,
	])("rejects an out-of-range timeout (%s)", async (v) => {
		const update = vi.fn();
		const caller = await buildCaller(buildDb({ update }));

		await expect(
			caller.updateLockTimeout({ timeoutMinutes: v }),
		).rejects.toThrow();
		expect(update).not.toHaveBeenCalled();
	});
});

describe("adminSettingsRouter — getRepresentationCampaignByYear", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns the stored override when a row exists", async () => {
		const db = buildDb();
		db.__chainQuery.limit.mockResolvedValue([
			{
				year: 2026,
				campaignStartDate: "2026-02-01",
				campaignEndDate: "2026-11-30",
				declarationDeadline: "2026-04-15",
			},
		]);
		const caller = await buildCaller(db);

		const result = await caller.getRepresentationCampaignByYear({ year: 2026 });

		expect(result).toEqual({
			year: 2026,
			isDefault: false,
			campaignStartDate: "2026-02-01",
			campaignEndDate: "2026-11-30",
			declarationDeadline: "2026-04-15",
		});
	});

	it("falls back to the domain defaults when no row exists", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		const result = await caller.getRepresentationCampaignByYear({ year: 2027 });

		expect(result).toEqual({
			year: 2027,
			isDefault: true,
			campaignStartDate: "2027-01-01",
			campaignEndDate: "2027-12-31",
			declarationDeadline: "2027-03-01",
		});
	});

	it("reads the representation_campaign table, never campaign_deadline", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		await caller.getRepresentationCampaignByYear({ year: 2026 });

		expect(db.__chainQuery.from).toHaveBeenCalledWith(representationCampaigns);
		expect(db.__chainQuery.from).not.toHaveBeenCalledWith(campaignDeadlines);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);
		await expect(
			caller.getRepresentationCampaignByYear({ year: 1999 }),
		).rejects.toThrow();
	});

	it("rejects non-admin callers", async () => {
		const caller = await buildCaller(buildDb(), nonAdminSession);
		await expect(
			caller.getRepresentationCampaignByYear({ year: 2026 }),
		).rejects.toThrow(/administrateurs/i);
	});
});

describe("adminSettingsRouter — upsertRepresentationCampaign", () => {
	beforeEach(() => vi.resetAllMocks());

	it("inserts the validated values into representation_campaign", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		const result = await caller.upsertRepresentationCampaign(
			validRepresentationInput,
		);

		expect(result).toEqual({ success: true });
		expect(db.insert).toHaveBeenCalledWith(representationCampaigns);
		expect(db.__insert.values).toHaveBeenCalledWith(validRepresentationInput);
	});

	it("updates the existing row on conflict instead of duplicating the year", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		await caller.upsertRepresentationCampaign(validRepresentationInput);

		expect(db.__onConflict).toHaveBeenCalledWith({
			target: representationCampaigns.year,
			set: validRepresentationInput,
		});
	});

	it("never writes to campaign_deadline", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		await caller.upsertRepresentationCampaign(validRepresentationInput);

		expect(db.insert).not.toHaveBeenCalledWith(campaignDeadlines);
	});

	it("rejects when the start date is not strictly before the end date", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		await expect(
			caller.upsertRepresentationCampaign({
				...validRepresentationInput,
				campaignEndDate: "2026-01-15",
			}),
		).rejects.toThrow();
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("rejects a malformed date", async () => {
		const db = buildDb();
		const caller = await buildCaller(db);

		await expect(
			caller.upsertRepresentationCampaign({
				...validRepresentationInput,
				declarationDeadline: "15/04/2026",
			}),
		).rejects.toThrow();
	});

	it("rejects non-admin callers", async () => {
		const caller = await buildCaller(buildDb(), nonAdminSession);
		await expect(
			caller.upsertRepresentationCampaign(validRepresentationInput),
		).rejects.toThrow(/administrateurs/i);
	});
});
