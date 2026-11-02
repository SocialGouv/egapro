import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ init: vi.fn() }));

describe.each([
	["server", () => import("~/sentry.server.config")],
	["edge", () => import("~/sentry.edge.config")],
])("sentry.%s.config", (_runtime, loadConfig) => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("initializes Sentry with the privacy options", async () => {
		const { init } = await import("@sentry/nextjs");
		const { sentryPrivacyOptions } = await import("~/modules/observability");

		await loadConfig();

		expect(init).toHaveBeenCalledWith(
			expect.objectContaining(sentryPrivacyOptions),
		);
	});
});
