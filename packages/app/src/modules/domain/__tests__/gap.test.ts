import { describe, expect, it } from "vitest";

import {
	computeAverageGap,
	computeGap,
	computeTotal,
	gapLevel,
	hasGapsAboveThreshold,
} from "../shared/gap";

describe("computeGap", () => {
	it("computes gap as absolute percentage", () => {
		expect(computeGap("100", "200")).toBeCloseTo(50);
	});

	it("returns positive value regardless of direction", () => {
		expect(computeGap("200", "100")).toBeCloseTo(100);
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
});

describe("computeTotal", () => {
	it("sums base and variable", () => {
		expect(computeTotal("100", "50")).toBe(150);
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

describe("computeAverageGap", () => {
	it("returns null for an empty input", () => {
		expect(computeAverageGap([])).toBeNull();
	});

	it("returns null when no pair is exploitable", () => {
		expect(
			computeAverageGap([
				{ annualBaseWomen: null, annualBaseMen: null },
				{ hourlyBaseWomen: undefined, hourlyBaseMen: undefined },
			]),
		).toBeNull();
	});

	it("returns the single gap when only one pair is valid", () => {
		expect(
			computeAverageGap([{ annualBaseWomen: "90", annualBaseMen: "100" }]),
		).toBeCloseTo(10);
	});

	it("averages gaps across multiple pairs within one category", () => {
		const result = computeAverageGap([
			{
				annualBaseWomen: "90",
				annualBaseMen: "100", // 10%
				hourlyBaseWomen: "80",
				hourlyBaseMen: "100", // 20%
			},
		]);
		expect(result).toBeCloseTo(15);
	});

	it("averages across multiple categories, skipping unexploitable pairs", () => {
		const result = computeAverageGap([
			{ annualBaseWomen: "90", annualBaseMen: "100" }, // 10%
			{ annualBaseWomen: "80", annualBaseMen: "100" }, // 20%
			{ annualBaseWomen: null, annualBaseMen: "100" }, // skipped
			{ annualBaseWomen: "100", annualBaseMen: "0" }, // skipped (men = 0)
		]);
		expect(result).toBeCloseTo(15);
	});
});
