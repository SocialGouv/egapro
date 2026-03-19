import { describe, expect, it } from "vitest";

import {
	computeGap,
	computePercentage,
	computeProportion,
	computeTotal,
	displayDecimal,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatTotal,
	gapLevel,
	hasGapsAboveThreshold,
	normalizeDecimalInput,
	parseNumber,
} from "../shared/gap";

describe("parseNumber", () => {
	it("parses a simple number", () => {
		expect(parseNumber("42")).toBe(42);
	});

	it("handles comma as decimal separator", () => {
		expect(parseNumber("3,14")).toBeCloseTo(3.14);
	});

	it("strips spaces (thousand separators)", () => {
		expect(parseNumber("1 000")).toBe(1000);
	});

	it("handles combined spaces and comma", () => {
		expect(parseNumber("1 234,56")).toBeCloseTo(1234.56);
	});

	it("returns NaN for empty string", () => {
		expect(parseNumber("")).toBeNaN();
	});
});

describe("normalizeDecimalInput", () => {
	it("returns empty string as-is", () => {
		expect(normalizeDecimalInput("")).toBe("");
	});

	it("replaces comma with dot", () => {
		expect(normalizeDecimalInput("3,14")).toBe("3.14");
	});

	it("strips spaces", () => {
		expect(normalizeDecimalInput("1 000")).toBe("1000");
	});

	it("rejects letters", () => {
		expect(normalizeDecimalInput("abc")).toBeNull();
	});

	it("rejects minus sign", () => {
		expect(normalizeDecimalInput("-5")).toBeNull();
	});

	it("rejects multiple dots", () => {
		expect(normalizeDecimalInput("1.2.3")).toBeNull();
	});
});

describe("displayDecimal", () => {
	it("returns empty string as-is", () => {
		expect(displayDecimal("")).toBe("");
	});

	it("replaces dot with comma", () => {
		expect(displayDecimal("3.14")).toBe("3,14");
	});

	it("adds thousand separator", () => {
		expect(displayDecimal("1000")).toBe("1\u202F000");
	});

	it("formats large number with decimals", () => {
		expect(displayDecimal("1234567.89")).toBe("1\u202F234\u202F567,89");
	});
});

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

describe("formatGap", () => {
	it("formats a gap with French decimal separator", () => {
		expect(formatGap(5.3)).toBe("5,3 %");
	});

	it("returns dash for null", () => {
		expect(formatGap(null)).toBe("-");
	});
});

describe("formatGapCompact", () => {
	it("formats without percent sign", () => {
		expect(formatGapCompact(5.3)).toBe("5,3");
	});

	it("returns dash for null", () => {
		expect(formatGapCompact(null)).toBe("-");
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

describe("computeProportion", () => {
	it("computes percentage from count and total", () => {
		expect(computeProportion("25", 100)).toBe("25,0 %");
	});

	it("returns dash when total is zero", () => {
		expect(computeProportion("10", 0)).toBe("-");
	});
});

describe("formatCurrency", () => {
	it("formats a number with euro sign", () => {
		expect(formatCurrency("1234.5")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns dash for undefined", () => {
		expect(formatCurrency(undefined)).toBe("-");
	});
});

describe("computePercentage", () => {
	it("computes percentage from count and total", () => {
		expect(computePercentage(25, 100)).toBe("25,0 %");
	});

	it("returns dash when total is zero", () => {
		expect(computePercentage(10, 0)).toBe("-");
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

describe("formatTotal", () => {
	it("formats value with unit", () => {
		expect(formatTotal(1234.5, "€")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns dash for null", () => {
		expect(formatTotal(null, "€")).toBe("-");
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
