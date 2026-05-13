import { describe, expect, it } from "vitest";

import { computeNextRetry } from "../backoff";
import { RETRY_BACKOFF_SECONDS } from "../constants";

describe("computeNextRetry", () => {
	const now = new Date("2026-05-12T10:00:00Z");

	it("uses 60s delay on the first attempt (attemptCount=0)", () => {
		const next = computeNextRetry(0, now);
		expect(next.getTime() - now.getTime()).toBe(60 * 1000);
	});

	it("applies the documented backoff schedule (1m / 5m / 30m / 2h / 12h)", () => {
		expect(RETRY_BACKOFF_SECONDS).toEqual([
			60,
			5 * 60,
			30 * 60,
			2 * 60 * 60,
			12 * 60 * 60,
		]);
		for (let i = 0; i < RETRY_BACKOFF_SECONDS.length; i++) {
			const delay = RETRY_BACKOFF_SECONDS[i] ?? 0;
			expect(computeNextRetry(i, now).getTime() - now.getTime()).toBe(
				delay * 1000,
			);
		}
	});

	it("clamps to the last bucket beyond the schedule length", () => {
		const last = RETRY_BACKOFF_SECONDS[RETRY_BACKOFF_SECONDS.length - 1] ?? 0;
		expect(computeNextRetry(99, now).getTime() - now.getTime()).toBe(
			last * 1000,
		);
	});

	it("clamps negative attempt counts to the first bucket", () => {
		const first = RETRY_BACKOFF_SECONDS[0] ?? 0;
		expect(computeNextRetry(-1, now).getTime() - now.getTime()).toBe(
			first * 1000,
		);
	});
});
