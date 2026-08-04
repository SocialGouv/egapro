import { describe, expect, it } from "vitest";

import { DIVERGENT_HOURLY_MEDIAN } from "~/test/gipGapFixtures";
import { GAP_ALERT_THRESHOLD } from "../shared/constants";
import type { GipGapReference } from "../shared/gap";
import {
	computeGap,
	computeGapBetween,
	computeGapRatio,
	computeTotal,
	gapDirection,
	gapLevel,
	gapMagnitude,
	gapRatioToPercent,
	hasGapsAboveThreshold,
	hasHighGap,
	resolveGap,
	resolveGapRatio,
} from "../shared/gap";

describe("regulatory constants", () => {
	// The decision table (#3975) is fully symbolic — a drifting constant would
	// silently shift every boundary test, so the literal value is pinned here.
	it("pins the gap alert threshold at 5%", () => {
		expect(GAP_ALERT_THRESHOLD).toBe(5);
	});
});

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

describe("resolveGapRatio", () => {
	const reference = (
		overrides: Partial<GipGapReference> = {},
	): GipGapReference => ({
		women: "1000",
		men: "1100",
		gap: "0.0887",
		...overrides,
	});

	it("keeps the GIP gap while both operands are untouched", () => {
		expect(resolveGapRatio("1000", "1100", reference())).toBe(0.0887);
	});

	it("keeps the GIP gap when an operand is written with a different precision", () => {
		expect(resolveGapRatio("1000.00", "1100.0", reference())).toBe(0.0887);
	});

	it("keeps the GIP gap when an operand uses the French decimal comma", () => {
		expect(resolveGapRatio("1000,00", "1100", reference())).toBe(0.0887);
	});

	it("recomputes once the women operand is modified", () => {
		expect(resolveGapRatio("900", "1100", reference())).toBeCloseTo(
			(1100 - 900) / 1100,
		);
	});

	it("recomputes once the men operand is modified", () => {
		expect(resolveGapRatio("1000", "1200", reference())).toBeCloseTo(
			(1200 - 1000) / 1200,
		);
	});

	it("recomputes when no GIP reference is available", () => {
		expect(resolveGapRatio("1000", "1100", undefined)).toBeCloseTo(
			(1100 - 1000) / 1100,
		);
	});

	it("recomputes when the GIP reference is null", () => {
		expect(resolveGapRatio("1000", "1100", null)).toBeCloseTo(
			(1100 - 1000) / 1100,
		);
	});

	it("recomputes when the GIP published no gap for the block", () => {
		expect(
			resolveGapRatio("1000", "1100", reference({ gap: null })),
		).toBeCloseTo((1100 - 1000) / 1100);
	});

	it("recomputes when the GIP published no women operand", () => {
		expect(
			resolveGapRatio("1000", "1100", reference({ women: null })),
		).toBeCloseTo((1100 - 1000) / 1100);
	});

	it("recomputes when the GIP published no men operand", () => {
		expect(
			resolveGapRatio("1000", "1100", reference({ men: null })),
		).toBeCloseTo((1100 - 1000) / 1100);
	});

	it("recomputes when the GIP gap is not a number", () => {
		expect(
			resolveGapRatio("1000", "1100", reference({ gap: "N/A" })),
		).toBeCloseTo((1100 - 1000) / 1100);
	});

	it("recomputes when the declared operand is not a number", () => {
		expect(resolveGapRatio("abc", "1100", reference())).toBeNull();
	});

	it("recomputes when the GIP operand is not a number", () => {
		expect(
			resolveGapRatio("1000", "1100", reference({ women: "N/A" })),
		).toBeCloseTo((1100 - 1000) / 1100);
	});

	it("returns null when the men operand is zero and no GIP gap applies", () => {
		expect(resolveGapRatio("100", "0", undefined)).toBeNull();
	});
});

describe("resolveGap", () => {
	it("returns the GIP gap as a signed percentage, not a ratio", () => {
		expect(
			resolveGap("1000", "1100", {
				women: "1000",
				men: "1100",
				gap: "0.0887",
			}),
		).toBeCloseTo(8.87);
	});

	it("preserves the sign of a GIP gap favourable to men", () => {
		expect(
			resolveGap("1100", "1000", {
				women: "1100",
				men: "1000",
				gap: "-0.0975",
			}),
		).toBeCloseTo(-9.75);
	});

	it("recomputes as a percentage once an operand is modified", () => {
		expect(
			resolveGap("900", "1100", {
				women: "1000",
				men: "1100",
				gap: "0.0887",
			}),
		).toBeCloseTo(((1100 - 900) / 1100) * 100);
	});

	it("recomputes as a percentage when no GIP reference is available", () => {
		expect(resolveGap("100", "200", undefined)).toBeCloseTo(50);
	});

	it("returns null when the men operand is zero and no GIP gap applies", () => {
		expect(resolveGap("100", "0", undefined)).toBeNull();
	});

	// The regression this rule exists for: the GIP computes on full-precision
	// figures but publishes operands rounded to 2 decimals, so recomputing an
	// hourly variable rate of a few cents loses the gap entirely.
	it("keeps a GIP gap that recomputation would flatten to zero", () => {
		const { women, men, gap } = DIVERGENT_HOURLY_MEDIAN;
		expect(computeGap(women, men)).toBe(0);
		expect(resolveGap(women, men, { women, men, gap })).toBeCloseTo(7.19);
	});

	it("crosses the alert threshold on the GIP gap where recomputation would not", () => {
		const { women, men, gap } = DIVERGENT_HOURLY_MEDIAN;
		expect(gapLevel(computeGap(women, men))).toBe("low");
		expect(gapLevel(resolveGap(women, men, { women, men, gap }))).toBe("high");
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
	// Positive boundary + null live in demarcheDecisionTable.test.ts (#3975).
	it("returns high for a negative gap reaching the threshold (unfavourable to men)", () => {
		expect(gapLevel(-6)).toBe("high");
	});

	// #3963 — the 5% threshold is symmetric: a gap is classified by absolute
	// magnitude, so gapLevel(x) and gapLevel(-x) must always agree.
	it("classifies a gap identically in both directions (symmetric threshold)", () => {
		expect(gapLevel(-6)).toBe("high");
		expect(gapLevel(-20)).toBe("high");
		expect(gapLevel(6)).toBe(gapLevel(-6));
		expect(gapLevel(20)).toBe(gapLevel(-20));
		expect(gapLevel(GAP_ALERT_THRESHOLD)).toBe(gapLevel(-GAP_ALERT_THRESHOLD));
		expect(gapLevel(GAP_ALERT_THRESHOLD - 1)).toBe(
			gapLevel(-(GAP_ALERT_THRESHOLD - 1)),
		);
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

	it("returns true when women earn more past the threshold (symmetric alert, #3963)", () => {
		expect(
			hasGapsAboveThreshold([{ annualBaseWomen: "110", annualBaseMen: "100" }]),
		).toBe(true);
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

describe("gapMagnitude", () => {
	it("returns the absolute value of a positive gap", () => {
		expect(gapMagnitude(5)).toBe(5);
	});

	it("returns the absolute value of a negative gap", () => {
		expect(gapMagnitude(-5)).toBe(5);
	});

	it("returns null for null input", () => {
		expect(gapMagnitude(null)).toBeNull();
	});
});

describe("hasHighGap", () => {
	it("returns true when a gap reaches the threshold in either direction", () => {
		expect(hasHighGap([2, 5, null])).toBe(true);
	});

	it("returns false when all gaps are below the threshold", () => {
		expect(hasHighGap([2, 3, null])).toBe(false);
	});

	it("returns true for a large negative gap (unfavourable to men, #3963)", () => {
		expect(hasHighGap([-20])).toBe(true);
	});

	it("returns false for an empty list", () => {
		expect(hasHighGap([])).toBe(false);
	});
});

describe("gapDirection", () => {
	it("returns women when women are lower-paid in more rows", () => {
		expect(
			gapDirection([
				{ women: "90", men: "100" },
				{ women: "80", men: "100" },
				{ women: "100", men: "95" },
			]),
		).toBe("women");
	});

	it("returns men when men are lower-paid in more rows", () => {
		expect(
			gapDirection([
				{ women: "100", men: "90" },
				{ women: "100", men: "80" },
			]),
		).toBe("men");
	});

	it("returns balanced on a tie", () => {
		expect(
			gapDirection([
				{ women: "90", men: "100" },
				{ women: "100", men: "90" },
			]),
		).toBe("balanced");
	});

	it("returns balanced for no data", () => {
		expect(gapDirection([])).toBe("balanced");
	});

	it("ignores rows with non-numeric values", () => {
		expect(
			gapDirection([
				{ women: "abc", men: "100" },
				{ women: "90", men: "100" },
			]),
		).toBe("women");
	});
});

describe("gapRatioToPercent", () => {
	it("converts a stored ratio string to a signed percentage", () => {
		expect(gapRatioToPercent("0.0523")).toBeCloseTo(5.23);
	});

	it("converts a negative ratio", () => {
		expect(gapRatioToPercent("-0.1")).toBeCloseTo(-10);
	});

	it("converts a zero ratio to 0 (not null)", () => {
		expect(gapRatioToPercent("0.0000")).toBe(0);
	});

	it("accepts a numeric ratio", () => {
		expect(gapRatioToPercent(0.05)).toBeCloseTo(5);
	});

	it("returns null for null, undefined, and blank", () => {
		expect(gapRatioToPercent(null)).toBeNull();
		expect(gapRatioToPercent(undefined)).toBeNull();
		expect(gapRatioToPercent("")).toBeNull();
	});

	it("returns null for a non-numeric string", () => {
		expect(gapRatioToPercent("abc")).toBeNull();
	});
});
