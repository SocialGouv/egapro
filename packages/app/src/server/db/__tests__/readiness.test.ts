import type { Sql } from "postgres";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createReadinessCheck } from "../readiness";

function fakeSql(run: () => Promise<unknown>): Sql {
	return (() => run()) as unknown as Sql;
}

type Harness = {
	check: () => Promise<boolean>;
	calls: () => number;
	resolve: (value: unknown) => void;
	reject: (error: unknown) => void;
};

/** Manual control over the pending query, to test coalescing. */
function deferredHarness(cacheMs = 1000): Harness {
	let settle!: { resolve: (v: unknown) => void; reject: (e: unknown) => void };
	const pending = new Promise<unknown>((resolve, reject) => {
		settle = { reject, resolve };
	});
	const calls = vi.fn(() => pending);

	return {
		check: createReadinessCheck(fakeSql(calls), 2000, cacheMs),
		calls: () => calls.mock.calls.length,
		resolve: (value) => settle.resolve(value),
		reject: (error) => settle.reject(error),
	};
}

describe("createReadinessCheck", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("is ready when the database answers", async () => {
		const check = createReadinessCheck(
			fakeSql(async () => [{ "?column?": 1 }]),
		);

		await expect(check()).resolves.toBe(true);
	});

	it("is not ready when the connection or the query fails", async () => {
		const check = createReadinessCheck(
			fakeSql(async () => {
				throw new Error("connect ECONNREFUSED 10.0.0.4:5432");
			}),
		);

		await expect(check()).resolves.toBe(false);
	});

	it("is not ready when the query outlives the deadline", async () => {
		vi.useFakeTimers();
		const check = createReadinessCheck(
			fakeSql(() => new Promise(() => undefined)),
			2000,
		);

		const pending = check();
		await vi.advanceTimersByTimeAsync(2000);

		await expect(pending).resolves.toBe(false);
	});

	it("never rejects, whatever the driver throws", async () => {
		const check = createReadinessCheck(
			fakeSql(async () => {
				throw new TypeError("not-a-promise");
			}),
		);

		await expect(check()).resolves.toBe(false);
	});

	it("shares one query between concurrent callers (anonymous burst on a max:1 pool)", async () => {
		const harness = deferredHarness();

		const burst = [harness.check(), harness.check(), harness.check()];
		harness.resolve([{ ok: 1 }]);

		await expect(Promise.all(burst)).resolves.toEqual([true, true, true]);
		expect(harness.calls()).toBe(1);
	});

	it("reuses the verdict for the cache window, then checks again", async () => {
		vi.useFakeTimers();
		const calls = vi.fn(async () => [{ ok: 1 }]);
		const check = createReadinessCheck(fakeSql(calls), 2000, 1000);

		await check();
		await check();
		expect(calls).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1001);
		await check();
		expect(calls).toHaveBeenCalledTimes(2);
	});

	it("caches a negative verdict too, so a down database is not hammered", async () => {
		const calls = vi.fn(async () => {
			throw new Error("down");
		});
		const check = createReadinessCheck(fakeSql(calls), 2000, 1000);

		await expect(check()).resolves.toBe(false);
		await expect(check()).resolves.toBe(false);

		expect(calls).toHaveBeenCalledTimes(1);
	});

	it("does not stay stuck on a failed check", async () => {
		vi.useFakeTimers();
		const calls = vi
			.fn()
			.mockRejectedValueOnce(new Error("down"))
			.mockResolvedValueOnce([{ ok: 1 }]);
		const check = createReadinessCheck(fakeSql(calls), 2000, 1000);

		await expect(check()).resolves.toBe(false);
		await vi.advanceTimersByTimeAsync(1001);

		await expect(check()).resolves.toBe(true);
		expect(calls).toHaveBeenCalledTimes(2);
	});
});
