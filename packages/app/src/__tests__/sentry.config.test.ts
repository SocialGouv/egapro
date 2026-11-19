import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ init: vi.fn() }));

function initOptionsOf(init: unknown): Record<string, unknown> | undefined {
	const mock = init as { mock: { calls: unknown[][] } };
	return mock.mock.calls.at(-1)?.[0] as Record<string, unknown> | undefined;
}

describe.each([
	["server", () => import("~/sentry.server.config")],
	["edge", () => import("~/sentry.edge.config")],
])("sentry.%s.config", (_runtime, loadConfig) => {
	beforeEach(() => {
		vi.resetModules();
		vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("initializes Sentry with the privacy options", async () => {
		const { init } = await import("@sentry/nextjs");
		const { sentryPrivacyOptions } = await import("~/modules/observability");

		await loadConfig();

		expect(init).toHaveBeenCalledWith(
			expect.objectContaining(sentryPrivacyOptions),
		);
	});

	it("samples one transaction out of ten in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		const { init } = await import("@sentry/nextjs");

		await loadConfig();

		expect(initOptionsOf(init)?.tracesSampleRate).toBe(0.1);
	});

	it("samples everything outside production", async () => {
		vi.stubEnv("NODE_ENV", "test");
		const { init } = await import("@sentry/nextjs");

		await loadConfig();

		expect(initOptionsOf(init)?.tracesSampleRate).toBe(1);
	});

	it("honours SENTRY_TRACES_SAMPLE_RATE when it is set", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "0.5");
		const { init } = await import("@sentry/nextjs");

		await loadConfig();

		expect(initOptionsOf(init)?.tracesSampleRate).toBe(0.5);
	});

	it("falls back to the environment default on an unusable value", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "much");
		const { init } = await import("@sentry/nextjs");

		await loadConfig();

		expect(initOptionsOf(init)?.tracesSampleRate).toBe(0.1);
	});
});
