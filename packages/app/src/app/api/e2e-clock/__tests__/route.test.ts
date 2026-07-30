import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		EGAPRO_E2E_CLOCK: true as boolean,
		NODE_ENV: "test" as "development" | "test" | "production",
	},
}));

vi.mock("~/env.js", () => ({ env: mockEnv }));

import { DELETE, GET, POST } from "../route";

type CampaignClockGlobal = { __egaproCampaignYear?: number };

function enableClock(): void {
	mockEnv.EGAPRO_E2E_CLOCK = true;
	mockEnv.NODE_ENV = "test";
}

function buildPost(body: unknown, serialized?: string): Request {
	return new Request("http://localhost/api/e2e-clock", {
		method: "POST",
		body: serialized ?? JSON.stringify(body),
	});
}

function readOverride(): number | undefined {
	return (globalThis as CampaignClockGlobal).__egaproCampaignYear;
}

describe("/api/e2e-clock", () => {
	beforeEach(() => {
		enableClock();
	});

	afterEach(() => {
		delete (globalThis as CampaignClockGlobal).__egaproCampaignYear;
	});

	describe("disabled locks (404)", () => {
		it("404s POST when EGAPRO_E2E_CLOCK is off, without writing the override", async () => {
			mockEnv.EGAPRO_E2E_CLOCK = false;
			mockEnv.NODE_ENV = "test";

			const response = await POST(buildPost({ campaignYear: 2030 }));

			expect(response.status).toBe(404);
			expect(readOverride()).toBeUndefined();
		});

		it("404s POST in production even when the flag is on", async () => {
			mockEnv.EGAPRO_E2E_CLOCK = true;
			mockEnv.NODE_ENV = "production";

			const response = await POST(buildPost({ campaignYear: 2030 }));

			expect(response.status).toBe(404);
			expect(readOverride()).toBeUndefined();
		});

		it("404s GET and DELETE when disabled", async () => {
			mockEnv.EGAPRO_E2E_CLOCK = false;
			mockEnv.NODE_ENV = "test";

			expect((await GET()).status).toBe(404);
			expect((await DELETE()).status).toBe(404);
		});
	});

	describe("POST", () => {
		it("sets the campaign-year override and echoes it back", async () => {
			const response = await POST(buildPost({ campaignYear: 2030 }));

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ campaignYear: 2030 });
			expect(readOverride()).toBe(2030);
		});

		it("returns 400 on an out-of-bounds year without setting the override", async () => {
			const response = await POST(buildPost({ campaignYear: 1900 }));

			expect(response.status).toBe(400);
			expect(readOverride()).toBeUndefined();
		});

		it("returns 400 on a malformed JSON body", async () => {
			const response = await POST(buildPost(undefined, "{ not json"));

			expect(response.status).toBe(400);
			expect(readOverride()).toBeUndefined();
		});
	});

	describe("GET", () => {
		it("returns the effective override year once posted", async () => {
			await POST(buildPost({ campaignYear: 2030 }));

			const response = await GET();

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ campaignYear: 2030 });
		});
	});

	describe("DELETE", () => {
		it("clears the override and reports the year after reset", async () => {
			await POST(buildPost({ campaignYear: 2030 }));
			expect(readOverride()).toBe(2030);

			const response = await DELETE();

			expect(response.status).toBe(200);
			expect(readOverride()).toBeUndefined();
			const body = (await response.json()) as { campaignYear: number };
			expect(body.campaignYear).toBe(new Date().getFullYear());
		});
	});
});
