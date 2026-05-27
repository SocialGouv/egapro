import { describe, expect, it } from "vitest";

import { computeRate } from "../shared/submissionRate";

describe("computeRate", () => {
	it("returns 0 when obligated = 0 (no division by zero)", () => {
		expect(computeRate(0, 0)).toBe(0);
		expect(computeRate(5, 0)).toBe(0);
	});

	it("returns a percentage rounded to one decimal", () => {
		expect(computeRate(73, 100)).toBe(73);
		expect(computeRate(1, 3)).toBe(33.3);
		expect(computeRate(2, 3)).toBe(66.7);
		expect(computeRate(1, 2)).toBe(50);
	});

	it("computes 100 when submitted === obligated", () => {
		expect(computeRate(42, 42)).toBe(100);
	});
});
