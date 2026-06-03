import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMatomoMock } = vi.hoisted(() => ({ fetchMatomoMock: vi.fn() }));

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/services/matomo", () => ({
	fetchMatomoEventsReport: fetchMatomoMock,
}));

const adminSession = {
	user: { id: "admin-1", email: "a@b.c", isAdmin: true },
	expires: "",
};

const ACTION_ROWS = [
	{ label: "funnel_start", nb_events: 100 },
	{ label: "step_complete", nb_events: 250 },
	{ label: "funnel_complete", nb_events: 60 },
	{ label: "funnel_abandon", nb_events: 40 },
];

const STEP_ROWS = [
	{ label: "step_2", nb_events: 70, avg_event_value: 30 },
	{ label: "step_1", nb_events: 90, avg_event_value: 12 },
];

beforeEach(() => {
	vi.resetAllMocks();
});

describe("adminStatsRouter.getMatomoFunnel", () => {
	it("maps the Matomo report to funnel counts and per-step rows with domain labels", async () => {
		fetchMatomoMock.mockImplementation(
			async ({ method }: { method: string }) =>
				method === "Events.getAction" ? ACTION_ROWS : STEP_ROWS,
		);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: {},
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getMatomoFunnel({
			year: 2026,
			sizeRange: "50-99",
		});

		expect(result.startedCount).toBe(100);
		expect(result.completedCount).toBe(60);
		expect(result.abandonedCount).toBe(40);
		expect(result.steps).toEqual([
			{
				stepKey: "step_1",
				label: "Effectifs",
				completedCount: 90,
				avgDurationSeconds: 12,
			},
			{
				stepKey: "step_2",
				label: "Écart de rémunération",
				completedCount: 70,
				avgDurationSeconds: 30,
			},
		]);
	});

	it("filters via a segment on the campaign-year and workforce custom dimensions (not by date)", async () => {
		fetchMatomoMock.mockResolvedValue([]);
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: {},
			session: adminSession,
			headers: new Headers(),
		} as never);

		await caller.getMatomoFunnel({ year: 2026, sizeRange: "50-99" });

		const segments = fetchMatomoMock.mock.calls.map(
			(call) => (call[0] as { segment: string }).segment,
		);
		expect(segments.length).toBeGreaterThan(0);
		expect(segments.every((s) => s.includes("dimension1==2026"))).toBe(true);
		expect(segments.every((s) => s.includes("dimension2==50-99"))).toBe(true);
	});

	it("propagates the error when the Matomo client throws (no silent empty data)", async () => {
		fetchMatomoMock.mockRejectedValue(new Error("Matomo non configuré"));
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: {},
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(caller.getMatomoFunnel({ year: 2026 })).rejects.toThrow(
			/Matomo/,
		);
	});

	it("rejects non-admin callers", async () => {
		const { adminStatsRouter } = await import("../adminStats");
		const caller = adminStatsRouter.createCaller({
			db: {},
			session: { user: { id: "u", email: "u@x", isAdmin: false }, expires: "" },
			headers: new Headers(),
		} as never);

		await expect(caller.getMatomoFunnel({ year: 2026 })).rejects.toThrow(
			/administrateurs/i,
		);
	});
});
