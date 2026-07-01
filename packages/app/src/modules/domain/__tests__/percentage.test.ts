import { describe, expect, it } from "vitest";

import { percentageOf, proportionOf } from "../shared/percentage";

describe("proportionOf", () => {
	it("returns the raw ratio of count over total", () => {
		expect(proportionOf(3, 8)).toBe(0.375);
	});

	it("stays stable under GIP 4-decimal rounding", () => {
		expect(Math.round(proportionOf(3, 8) * 10_000) / 10_000).toBe(0.375);
	});

	it("returns 0 when total is zero (no division by zero)", () => {
		expect(proportionOf(1, 0)).toBe(0);
	});
});

describe("percentageOf", () => {
	it("returns the ratio expressed as a percentage", () => {
		expect(percentageOf(1, 4)).toBe(25);
	});

	it("returns 0 when total is zero (no NaN)", () => {
		expect(percentageOf(1, 0)).toBe(0);
	});
});
