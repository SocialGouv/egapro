import { describe, expect, it } from "vitest";

import {
	computeGap,
	computeGapBetween,
	computeGapRatio,
	computeTotal,
	gapLevel,
	hasGapsAboveThreshold,
} from "../shared/gap";

describe("computeGapRatio", () => {
	it("returns positive ratio when men earn more", () => {
		expect(computeGapRatio("100", "110")).toBeCloseTo((110 - 100) / 110);
	});

	it("returns negative ratio when women earn more", () => {
		expect(computeGapRatio("110", "100")).toBeCloseTo(-0.1);
	});

	it("returns 0 for equal values", () => {
		expect(computeGapRatio("100", "100")).toBe(0);
	});

	it("returns null when women value is empty", () => {
		expect(computeGapRatio("", "100")).toBeNull();
	});

	it("returns null when men value is zero (division by zero)", () => {
		expect(computeGapRatio("100", "0")).toBeNull();
	});

	it("returns null when men value is empty", () => {
		expect(computeGapRatio("100", "")).toBeNull();
	});

	it("returns null for non-numeric women value", () => {
		expect(computeGapRatio("abc", "100")).toBeNull();
	});
});

describe("computeGap", () => {
	it("computes a positive gap when men earn more", () => {
		expect(computeGap("100", "200")).toBeCloseTo(50);
	});

	it("returns a negative value when women earn more (signed, GIP convention)", () => {
		expect(computeGap("200", "100")).toBeCloseTo(-100);
	});

	it("returns null when men value is zero (division by zero)", () => {
		expect(computeGap("100", "0")).toBeNull();
	});

	it("returns null when women value is empty", () => {
		expect(computeGap("", "100")).toBeNull();
	});

	it("handles equal values (0% gap)", () => {
		expect(computeGap("100", "100")).toBeCloseTo(0);
	});

	it("computes 100% gap when women earn 0", () => {
		expect(computeGap("0", "100")).toBeCloseTo(100);
	});
});

describe("computeGapBetween", () => {
	it("computes a positive gap as a percentage of the men value", () => {
		expect(computeGapBetween(90, 100)).toBe(10);
	});

	it("returns a negative value when women earn more than men (signed)", () => {
		expect(computeGapBetween(110, 100)).toBe(-10);
	});

	it("returns 0 for equal values", () => {
		expect(computeGapBetween(100, 100)).toBe(0);
	});

	it("returns null when the men value is zero (division by zero)", () => {
		expect(computeGapBetween(1, 0)).toBeNull();
	});
});

describe("gapLevel", () => {
	it("returns low for gap below threshold", () => {
		expect(gapLevel(3)).toBe("low");
	});

	it("returns high for gap at threshold (5%)", () => {
		expect(gapLevel(5)).toBe("high");
	});

	it("returns high for gap above threshold", () => {
		expect(gapLevel(15)).toBe("high");
	});

	it("returns null for null input", () => {
		expect(gapLevel(null)).toBeNull();
	});

	it("returns low for zero gap", () => {
		expect(gapLevel(0)).toBe("low");
	});

	it("returns low for a negative gap (women earn more, no alert)", () => {
		expect(gapLevel(-6)).toBe("low");
	});
});

describe("computeTotal", () => {
	it("sums base and variable", () => {
		expect(computeTotal("100", "50")).toBe(150);
	});

	it("treats an invalid base as zero when variable is valid", () => {
		expect(computeTotal("", "50")).toBe(50);
	});

	it("treats an invalid variable as zero when base is valid", () => {
		expect(computeTotal("100", "")).toBe(100);
	});

	it("returns null when both are NaN", () => {
		expect(computeTotal("", "")).toBeNull();
	});
});

describe("hasGapsAboveThreshold", () => {
	it("returns true when a category has a gap >= 5%", () => {
		expect(
			hasGapsAboveThreshold([{ annualBaseWomen: "90", annualBaseMen: "100" }]),
		).toBe(true);
	});

	it("returns false when all gaps are below 5%", () => {
		expect(
			hasGapsAboveThreshold([{ annualBaseWomen: "97", annualBaseMen: "100" }]),
		).toBe(false);
	});

	it("returns false when women earn more (negative gap, no alert)", () => {
		expect(
			hasGapsAboveThreshold([{ annualBaseWomen: "110", annualBaseMen: "100" }]),
		).toBe(false);
	});

	it("returns false for empty categories", () => {
		expect(hasGapsAboveThreshold([])).toBe(false);
	});

	it("detects gaps in hourly fields", () => {
		expect(
			hasGapsAboveThreshold([{ hourlyBaseWomen: "10", hourlyBaseMen: "20" }]),
		).toBe(true);
	});

	it("uses custom threshold when provided", () => {
		expect(
			hasGapsAboveThreshold(
				[{ annualBaseWomen: "97", annualBaseMen: "100" }],
				2,
			),
		).toBe(true);
	});
});
