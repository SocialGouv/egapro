import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@sentry/nextjs", () => ({
	init: vi.fn(),
	replayIntegration: vi.fn(),
}));

describe("instrumentation-client", () => {
	afterEach(() => {
		z.config({ jitless: false });
	});

	it("turns Zod's eval-based parser compilation off before any schema runs in the browser", async () => {
		z.config({ jitless: false });

		await import("~/instrumentation-client");

		expect(z.config().jitless).toBe(true);
	});
});
