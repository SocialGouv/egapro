import { describe, expect, it } from "vitest";
import {
	GAP_LEVEL_LABELS,
	computeGap,
	computePercentage,
	computeProportion,
	computeTotal,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatTotal,
	gapBadgeClass,
	gapLevel,
	parseNumber,
} from "../gapUtils";

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

	it("returns NaN for non-numeric input", () => {
		expect(parseNumber("abc")).toBeNaN();
	});
});

describe("computeGap", () => {
	it("computes gap as absolute percentage", () => {
		const gap = computeGap("100", "200");
		expect(gap).toBeCloseTo(50);
	});

	it("returns positive value regardless of direction", () => {
		const gap = computeGap("200", "100");
		expect(gap).toBeCloseTo(100);
	});

	it("returns null when men value is zero", () => {
		expect(computeGap("100", "0")).toBeNull();
	});

	it("returns null when women value is empty", () => {
		expect(computeGap("", "100")).toBeNull();
	});

	it("returns null when men value is empty", () => {
		expect(computeGap("100", "")).toBeNull();
	});

	it("returns null for non-numeric inputs", () => {
		expect(computeGap("abc", "100")).toBeNull();
	});

	it("handles equal values (0% gap)", () => {
		expect(computeGap("100", "100")).toBeCloseTo(0);
	});
});

describe("formatGap", () => {
	it("formats a gap with French decimal separator", () => {
		expect(formatGap(5.3)).toBe("5,3 %");
	});

	it("returns dash for null", () => {
		expect(formatGap(null)).toBe("-");
	});

	it("formats zero", () => {
		expect(formatGap(0)).toBe("0,0 %");
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
	it("returns low for gap below 5%", () => {
		expect(gapLevel(3)).toBe("low");
	});

	it("returns high for gap at 5%", () => {
		expect(gapLevel(5)).toBe("high");
	});

	it("returns high for gap above 5%", () => {
		expect(gapLevel(15)).toBe("high");
	});

	it("returns null for null input", () => {
		expect(gapLevel(null)).toBeNull();
	});

	it("returns low for zero gap", () => {
		expect(gapLevel(0)).toBe("low");
	});
});

describe("GAP_LEVEL_LABELS", () => {
	it("maps low to French label", () => {
		expect(GAP_LEVEL_LABELS.low).toBe("faible");
	});

	it("maps high to French label", () => {
		expect(GAP_LEVEL_LABELS.high).toBe("élevé");
	});
});

describe("gapBadgeClass", () => {
	it("returns info badge for low", () => {
		expect(gapBadgeClass("low")).toContain("fr-badge--info");
	});

	it("returns warning badge for high", () => {
		expect(gapBadgeClass("high")).toContain("fr-badge--warning");
	});
});

describe("computeProportion", () => {
	it("computes percentage from count and total", () => {
		expect(computeProportion("25", 100)).toBe("25,0 %");
	});

	it("returns dash for non-numeric count", () => {
		expect(computeProportion("abc", 100)).toBe("-");
	});

	it("returns dash when total is zero", () => {
		expect(computeProportion("10", 0)).toBe("-");
	});

	it("returns dash when total is undefined", () => {
		expect(computeProportion("10")).toBe("-");
	});
});

describe("formatCurrency", () => {
	it("formats a number with euro sign", () => {
		expect(formatCurrency("1234.5")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns dash for undefined", () => {
		expect(formatCurrency(undefined)).toBe("-");
	});

	it("returns dash for empty string", () => {
		expect(formatCurrency("")).toBe("-");
	});

	it("returns dash for non-numeric input", () => {
		expect(formatCurrency("abc")).toBe("-");
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

	it("returns base when variable is NaN", () => {
		expect(computeTotal("100", "")).toBe(100);
	});

	it("returns variable when base is NaN", () => {
		expect(computeTotal("", "50")).toBe(50);
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
