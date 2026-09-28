import { describe, expect, it } from "vitest";

import { quartileProportion } from "../apiLabels";

describe("quartileProportion", () => {
	it("returns null when count is null", () => {
		expect(quartileProportion(null, 10)).toBeNull();
	});

	it("returns null when totalCount is null", () => {
		expect(quartileProportion(5, null)).toBeNull();
	});

	it("returns null when totalCount is zero (no division by zero)", () => {
		expect(quartileProportion(5, 0)).toBeNull();
	});

	it("returns the exact ratio when it fits within 4 decimals", () => {
		expect(quartileProportion(1, 4)).toBe(0.25);
		expect(quartileProportion(3, 5)).toBe(0.6);
	});

	it("rounds to 4 decimals for GIP CSV parity", () => {
		expect(quartileProportion(1, 3)).toBe(0.3333);
		expect(quartileProportion(2, 3)).toBe(0.6667);
		expect(quartileProportion(5, 9)).toBe(0.5556);
	});

	it("returns 0 for a zero count over a non-zero total", () => {
		expect(quartileProportion(0, 10)).toBe(0);
	});

	// GIP CSV parity guard: proportionOf must match the raw count/total arithmetic it replaced.
	it("matches raw count/totalCount rounding across a value spread", () => {
		const pairs: Array<[number, number]> = [
			[1, 3],
			[2, 3],
			[7, 13],
			[123, 456],
			[9, 9],
			[0, 5],
		];
		for (const [count, total] of pairs) {
			const expected = Math.round((count / total) * 10_000) / 10_000;
			expect(quartileProportion(count, total)).toBe(expected);
		}
	});
});
