import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.fn();
const dbMock = {
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({ limit: limitMock }),
	}),
};

vi.mock("..", () => ({
	db: dbMock,
}));

describe("getActiveCampaignYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		limitMock.mockReset();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the configured active campaign year when a row exists", async () => {
		limitMock.mockResolvedValueOnce([{ activeCampaignYear: 2027 }]);
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");
		expect(await getActiveCampaignYear()).toBe(2027);
	});

	it("falls back to the current calendar year when no row exists", async () => {
		limitMock.mockResolvedValueOnce([]);
		vi.setSystemTime(new Date("2030-05-10"));
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");
		expect(await getActiveCampaignYear()).toBe(2030);
	});

	it("falls back when the row has a null activeCampaignYear", async () => {
		limitMock.mockResolvedValueOnce([{ activeCampaignYear: null }]);
		vi.setSystemTime(new Date("2031-01-01"));
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");
		expect(await getActiveCampaignYear()).toBe(2031);
	});
});

describe("GLOBAL_SETTINGS_ID", () => {
	it("is pinned to 1", async () => {
		const { GLOBAL_SETTINGS_ID } = await import("../getGlobalSettings");
		expect(GLOBAL_SETTINGS_ID).toBe(1);
	});
});
