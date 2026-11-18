import type { Sql } from "postgres";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createReadinessCheck } from "../readiness";

function fakeSql(run: () => Promise<unknown>): Sql {
	return (() => run()) as unknown as Sql;
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
});
