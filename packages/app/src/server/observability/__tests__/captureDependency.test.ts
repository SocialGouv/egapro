import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({
	captureException: mocks.captureException,
}));

import { captureDependencyFailure } from "../captureDependency";

describe("captureDependencyFailure", () => {
	beforeEach(() => {
		mocks.captureException.mockReset();
	});

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
});
