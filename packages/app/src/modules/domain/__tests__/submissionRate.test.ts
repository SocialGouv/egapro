import { describe, expect, it } from "vitest";

import {
	computeRate,
	formatPointsAbs,
	roundOneDecimal,
} from "../shared/submissionRate";

describe("roundOneDecimal", () => {
	it("rounds to one decimal place (banker-agnostic)", () => {
		expect(roundOneDecimal(73.42)).toBe(73.4);
		expect(roundOneDecimal(73.45)).toBe(73.5);
		expect(roundOneDecimal(73.44)).toBe(73.4);
		expect(roundOneDecimal(73.0)).toBe(73);
	});

	it("handles negatives", () => {
		expect(roundOneDecimal(-2.07)).toBe(-2.1);
		expect(roundOneDecimal(-0.04)).toBeCloseTo(0, 10);
	});
});

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

describe("formatPointsAbs", () => {
	it("returns absolute value rounded to 1 decimal, French separator", () => {
		expect(formatPointsAbs(2.07)).toBe("2,1");
		expect(formatPointsAbs(-2.07)).toBe("2,1");
		expect(formatPointsAbs(0)).toBe("0,0");
		expect(formatPointsAbs(0.5)).toBe("0,5");
		expect(formatPointsAbs(-0.04)).toBe("0,0");
	});
});
