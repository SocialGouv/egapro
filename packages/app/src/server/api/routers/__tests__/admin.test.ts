import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({
	adminImpersonationEvents: {
		siren: "siren",
		adminUserId: "adminUserId",
		startedAt: "startedAt",
	},
	companies: { siren: "siren", name: "name" },
	declarations: {
		siren: "siren",
		year: "year",
		status: "status",
	},
	gipMdsData: {
		siren: "siren",
		year: "year",
		workforceEma: "workforceEma",
	},
}));
vi.mock("~/server/services/weez", () => ({ fetchCompanyBySiren: vi.fn() }));

type SelectQueue = unknown[];
let selectQueue: SelectQueue = [];

const CHAIN_METHODS = new Set([
	"from",
	"where",
	"leftJoin",
	"innerJoin",
	"groupBy",
	"orderBy",
	"limit",
	"offset",
]);

function wrapChain(results: unknown): unknown {
	const promise = Promise.resolve(results);
	const chain = new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === "then" || prop === "catch" || prop === "finally") {
					return (promise[prop] as (...args: unknown[]) => unknown).bind(
						promise,
					);
				}
				if (typeof prop === "string" && CHAIN_METHODS.has(prop)) {
					return () => chain;
				}
				return undefined;
			},
		},
	);
	return chain;
}

function makeChain(): unknown {
	return wrapChain(selectQueue.shift() ?? []);
}

function createMockDb() {
	return {
		select: vi.fn(() => makeChain()),
	};
}

async function createCaller(mockDb: unknown, isAdmin = true) {
	const { adminRouter } = await import("../admin");
	return adminRouter.createCaller({
		db: mockDb,
		session: {
			user: { id: "admin-1", email: "admin@gov.fr", isAdmin },
			expires: "",
		},
		headers: new Headers(),
	} as never);
}

describe("adminRouter.getCampaignStats", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		selectQueue = [];
	});

	it("rejects non-admin users", async () => {
		const caller = await createCaller(createMockDb(), false);
		await expect(caller.getCampaignStats({ year: 2026 })).rejects.toMatchObject(
			{
				code: "FORBIDDEN",
			},
		);
	});

	it("computes submission rate and exposes previous-year rate", async () => {
		selectQueue = [
			[{ totalObligated: 5738, totalSubmitted: 4213 }],
			[{ totalObligated: 5500, totalSubmitted: 3900 }],
		];
		const caller = await createCaller(createMockDb());

		const result = await caller.getCampaignStats({ year: 2026 });

		expect(result.totalObligated).toBe(5738);
		expect(result.totalSubmitted).toBe(4213);
		expect(result.submissionRate).toBeCloseTo(73.4, 1);
		expect(result.previousYearRate).toBeCloseTo(70.9, 1);
	});

	it("returns previousYearRate = null when no obligated companies for N-1", async () => {
		selectQueue = [
			[{ totalObligated: 100, totalSubmitted: 60 }],
			[{ totalObligated: 0, totalSubmitted: 0 }],
		];
		const caller = await createCaller(createMockDb());

		const result = await caller.getCampaignStats({ year: 2026 });

		expect(result.submissionRate).toBe(60);
		expect(result.previousYearRate).toBeNull();
	});

	it("returns submissionRate = null when no obligated companies for the year", async () => {
		selectQueue = [
			[{ totalObligated: 0, totalSubmitted: 0 }],
			[{ totalObligated: 0, totalSubmitted: 0 }],
		];
		const caller = await createCaller(createMockDb());

		const result = await caller.getCampaignStats({ year: 2026 });

		expect(result.submissionRate).toBeNull();
		expect(result.previousYearRate).toBeNull();
	});

	it("accepts an optional sizeRange filter", async () => {
		selectQueue = [
			[{ totalObligated: 500, totalSubmitted: 250 }],
			[{ totalObligated: 480, totalSubmitted: 220 }],
		];
		const caller = await createCaller(createMockDb());

		const result = await caller.getCampaignStats({
			year: 2026,
			sizeRange: "50-99",
		});

		expect(result.submissionRate).toBeCloseTo(50, 1);
	});

	it("rejects invalid sizeRange values", async () => {
		const caller = await createCaller(createMockDb());
		await expect(
			caller.getCampaignStats({
				year: 2026,
				sizeRange: "unknown",
			} as unknown as Parameters<typeof caller.getCampaignStats>[0]),
		).rejects.toThrow();
	});
});
