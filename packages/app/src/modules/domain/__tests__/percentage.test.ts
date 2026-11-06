import { describe, expect, it } from "vitest";

import {
	percentageOf,
	proportionOf,
	ratioToPercentPoints,
} from "../shared/percentage";

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

describe("ratioToPercentPoints", () => {
	it("converts a stored ratio to percentage points", () => {
		expect(ratioToPercentPoints(0.074)).toBe(7.4);
	});

	it("truncates toward zero at 2 decimals, never rounds", () => {
		expect(ratioToPercentPoints(0.07179)).toBe(7.17);
	});

	it("keeps the sign of a negative ratio", () => {
		expect(ratioToPercentPoints(-0.005)).toBe(-0.5);
	});

	it("scales a large ratio past 1 (e.g. 46 %)", () => {
		expect(ratioToPercentPoints(0.46)).toBe(46);
	});

	it("accepts a numeric string, same as a number", () => {
		expect(ratioToPercentPoints("0.074")).toBe(7.4);
	});

	it("returns null for null, undefined or a blank string", () => {
		expect(ratioToPercentPoints(null)).toBeNull();
		expect(ratioToPercentPoints(undefined)).toBeNull();
		expect(ratioToPercentPoints("")).toBeNull();
	});

	it("returns null for a non-numeric string", () => {
		expect(ratioToPercentPoints("abc")).toBeNull();
	});
});
