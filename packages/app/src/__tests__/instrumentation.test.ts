// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	clearCampaignYearOverride,
	readCampaignYearOverride,
} from "~/modules/domain";

const { mockEnv, ensureBucket } = vi.hoisted(() => ({
	mockEnv: { EGAPRO_RECETTE_CAMPAIGN_YEAR: undefined as number | undefined },
	ensureBucket: vi.fn(),
}));

vi.mock("~/env.js", () => ({ env: mockEnv }));
vi.mock("~/sentry.server.config", () => ({}));
vi.mock("~/server/services/s3", () => ({ ensureBucket }));
vi.mock("@sentry/nextjs", () => ({ captureRequestError: vi.fn() }));

import { register } from "~/instrumentation";

describe("instrumentation register()", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_RUNTIME", "nodejs");
		mockEnv.EGAPRO_RECETTE_CAMPAIGN_YEAR = undefined;
		ensureBucket.mockReset();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		clearCampaignYearOverride();
	});

	it("pins the campaign year for the whole server process when the recette variable is set", async () => {
		mockEnv.EGAPRO_RECETTE_CAMPAIGN_YEAR = 2030;

		await register();

		expect(readCampaignYearOverride()).toBe(2030);
	});

	it("pins the year before the storage bucket is provisioned", async () => {
		mockEnv.EGAPRO_RECETTE_CAMPAIGN_YEAR = 2030;
		ensureBucket.mockImplementation(() => {
			expect(readCampaignYearOverride()).toBe(2030);
		});

		await register();

		expect(ensureBucket).toHaveBeenCalledOnce();
	});

	it("leaves the campaign clock on the calendar when the recette variable is unset", async () => {
		await register();

		expect(readCampaignYearOverride()).toBeNull();
		expect(ensureBucket).toHaveBeenCalledOnce();
	});
});
