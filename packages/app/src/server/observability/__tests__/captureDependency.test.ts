import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({
	captureException: mocks.captureException,
}));

type Module = typeof import("../captureDependency");

let captureDependencyFailure: Module["captureDependencyFailure"];

beforeEach(async () => {
	// Fresh module per test: the throttle window is module state.
	vi.resetModules();
	mocks.captureException.mockReset();
	({ captureDependencyFailure } = await import("../captureDependency"));
});

describe("captureDependencyFailure", () => {
	it("groups every occurrence of a dependency under one fingerprint", () => {
		captureDependencyFailure("weez", new Error("network down"));

		expect(mocks.captureException).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				fingerprint: ["dependency", "weez"],
				tags: { dependency: "weez" },
			}),
		);
	});

	it("gives each dependency its own group", () => {
		captureDependencyFailure("s3", new Error("bucket missing"));
		captureDependencyFailure("valkey", new Error("ECONNREFUSED"));

		const fingerprints = mocks.captureException.mock.calls.map(
			(call) => (call[1] as { fingerprint: string[] }).fingerprint,
		);
		expect(fingerprints).toEqual([
			["dependency", "s3"],
			["dependency", "valkey"],
		]);
	});

	it("forwards the bounded extra context untouched", () => {
		captureDependencyFailure("suit", new Error("HTTP 503"), {
			status: 503,
			call: "cse",
		});

		expect(mocks.captureException).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({ extra: { status: 503, call: "cse" } }),
		);
	});

	it("omits extra entirely when none is given", () => {
		captureDependencyFailure("matomo", new Error("unreachable"));

		const options = mocks.captureException.mock.calls[0]?.[1] as
			| Record<string, unknown>
			| undefined;
		expect(options).not.toHaveProperty("extra");
	});

	it("wraps a non-Error rejection so Sentry does not lump them together", () => {
		captureDependencyFailure("queue", "connection refused");

		const captured = mocks.captureException.mock.calls[0]?.[0] as Error;
		expect(captured).toBeInstanceOf(Error);
		expect(captured.message).toBe("connection refused");
		expect(captured.cause).toBe("connection refused");
	});

	it("keeps a real Error as-is, cause untouched", () => {
		const error = new Error("weez exploded");

		captureDependencyFailure("weez", error);

		expect(mocks.captureException.mock.calls[0]?.[0]).toBe(error);
	});

	describe("throttle", () => {
		it("posts one event per dependency per window, whatever the request count", () => {
			for (let i = 0; i < 50; i++) {
				captureDependencyFailure("valkey", new Error("ECONNREFUSED"));
			}

			expect(mocks.captureException).toHaveBeenCalledTimes(1);
		});

		it("does not throttle one dependency with another's failures", () => {
			captureDependencyFailure("valkey", new Error("down"));
			captureDependencyFailure("weez", new Error("down"));

			expect(mocks.captureException).toHaveBeenCalledTimes(2);
		});

		it("reports again once the window has elapsed", () => {
			vi.useFakeTimers();
			captureDependencyFailure("queue", new Error("first"));
			vi.advanceTimersByTime(60_001);
			captureDependencyFailure("queue", new Error("second"));

			expect(mocks.captureException).toHaveBeenCalledTimes(2);
			vi.useRealTimers();
		});

		it("can be disabled by the caller", () => {
			captureDependencyFailure("s3", new Error("a"), undefined, {
				throttleMs: 0,
			});
			captureDependencyFailure("s3", new Error("b"), undefined, {
				throttleMs: 0,
			});

			expect(mocks.captureException).toHaveBeenCalledTimes(2);
		});
	});
});
