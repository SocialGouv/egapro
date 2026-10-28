import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	clearCampaignYearOverride,
	writeCampaignYearOverride,
} from "~/modules/domain";

const limitMock = vi.fn();
const dbMock = {
	select: vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				orderBy: vi.fn().mockReturnValue({ limit: limitMock }),
			}),
		}),
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
		clearCampaignYearOverride();
	});

	it("returns the most recent year whose campaignStartDate is in the past", async () => {
		limitMock.mockResolvedValueOnce([{ year: 2027 }]);
		vi.setSystemTime(new Date("2028-03-10"));
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");
		expect(await getActiveCampaignYear()).toBe(2027);
	});

	it("returns the pinned campaign year without reading the configured campaigns", async () => {
		writeCampaignYearOverride(2031);
		vi.setSystemTime(new Date("2026-10-22"));
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");

		expect(await getActiveCampaignYear()).toBe(2031);
		expect(limitMock).not.toHaveBeenCalled();
	});

	it("falls back to the current calendar year when no campaign has started", async () => {
		limitMock.mockResolvedValueOnce([]);
		vi.setSystemTime(new Date("2030-05-10"));
		vi.resetModules();
		const { getActiveCampaignYear } = await import("../getGlobalSettings");
		expect(await getActiveCampaignYear()).toBe(2030);
	});
});

describe("GLOBAL_SETTINGS_ID", () => {
	it("is pinned to 1", async () => {
		const { GLOBAL_SETTINGS_ID } = await import("../getGlobalSettings");
		expect(GLOBAL_SETTINGS_ID).toBe(1);
	});
});
