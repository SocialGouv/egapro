import { describe, expect, it } from "vitest";

import {
	getApplicableIndicators,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	INDICATOR_G_TRIENNIAL_MIN,
	INDICATOR_G_UNIVERSAL_YEAR,
	isIndicatorGRequired,
	isTriennialYear,
} from "../shared/indicatorG";

describe("constants", () => {
	it("exports the four regulatory constants", () => {
		expect(INDICATOR_G_ANNUAL_MIN).toBe(250);
		expect(INDICATOR_G_TRIENNIAL_MIN).toBe(150);
		expect(INDICATOR_G_UNIVERSAL_YEAR).toBe(2030);
		expect(INDICATOR_G_TRIENNIAL_BASE_YEAR).toBe(2027);
	});
});

describe("isTriennialYear", () => {
	it("returns true for the base year 2027", () => {
		expect(isTriennialYear(2027)).toBe(true);
	});

	it("returns true for 2030 (2027 + 3)", () => {
		expect(isTriennialYear(2030)).toBe(true);
	});

	it("returns true for 2033 (2027 + 6)", () => {
		expect(isTriennialYear(2033)).toBe(true);
	});

	it("returns false for 2028 (off-cycle)", () => {
		expect(isTriennialYear(2028)).toBe(false);
	});

	it("returns false for 2029 (off-cycle)", () => {
		expect(isTriennialYear(2029)).toBe(false);
	});

	it("returns false for years before 2027", () => {
		expect(isTriennialYear(2026)).toBe(false);
		expect(isTriennialYear(2024)).toBe(false);
	});
});

describe("isIndicatorGRequired", () => {
	it("returns true for workforce >= 250 in a normal year", () => {
		expect(isIndicatorGRequired(300, 2027)).toBe(true);
		expect(isIndicatorGRequired(250, 2027)).toBe(true);
	});

	it("returns true for workforce 150-249 in a triennial year (2027)", () => {
		expect(isIndicatorGRequired(200, 2027)).toBe(true);
		expect(isIndicatorGRequired(150, 2027)).toBe(true);
		expect(isIndicatorGRequired(249, 2027)).toBe(true);
	});

	it("returns false for workforce 150-249 in a non-triennial year (2028)", () => {
		expect(isIndicatorGRequired(200, 2028)).toBe(false);
		expect(isIndicatorGRequired(150, 2028)).toBe(false);
	});

	it("returns false for workforce 150-249 in a non-triennial year (2029)", () => {
		expect(isIndicatorGRequired(200, 2029)).toBe(false);
	});

	it("returns true for workforce 150-249 in triennial year 2030", () => {
		expect(isIndicatorGRequired(200, 2030)).toBe(true);
	});

	it("returns false for workforce < 150 in any year before universal year", () => {
		expect(isIndicatorGRequired(100, 2027)).toBe(false);
		expect(isIndicatorGRequired(149, 2027)).toBe(false);
		expect(isIndicatorGRequired(100, 2029)).toBe(false);
	});

	it("extends the obligation to every tier >= 50 on triennial years from 2030", () => {
		expect(isIndicatorGRequired(50, 2030)).toBe(true);
		expect(isIndicatorGRequired(70, 2030)).toBe(true);
		expect(isIndicatorGRequired(100, 2030)).toBe(true);
		expect(isIndicatorGRequired(249, 2030)).toBe(true);
		expect(isIndicatorGRequired(70, 2033)).toBe(true);
	});

	it("keeps sub-250 tiers on the triennial cadence after 2030 (non-triennial years excluded)", () => {
		expect(isIndicatorGRequired(70, 2031)).toBe(false);
		expect(isIndicatorGRequired(200, 2031)).toBe(false);
		expect(isIndicatorGRequired(249, 2032)).toBe(false);
	});

	it("keeps the voluntary tier (< 50) out of the obligation even from 2030", () => {
		expect(isIndicatorGRequired(49, 2030)).toBe(false);
		expect(isIndicatorGRequired(0, 2033)).toBe(false);
	});

	it("returns true for workforce >= 250 at universal year (2030)", () => {
		expect(isIndicatorGRequired(250, 2030)).toBe(true);
		expect(isIndicatorGRequired(300, 2030)).toBe(true);
	});

	it("returns true for workforce >= 250 after universal year", () => {
		expect(isIndicatorGRequired(300, 2035)).toBe(true);
	});

	it("boundary: workforce 249 (just below annual min) in 2027 — is triennial year, so required", () => {
		expect(isIndicatorGRequired(249, 2027)).toBe(true);
	});

	it("boundary: workforce 149 (just below triennial min) in 2027 — not required", () => {
		expect(isIndicatorGRequired(149, 2027)).toBe(false);
	});
});

describe("getApplicableIndicators", () => {
	it("includes G when isIndicatorGRequired is true", () => {
		const result = getApplicableIndicators(300, 2027);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("excludes G when isIndicatorGRequired is false", () => {
		const result = getApplicableIndicators(100, 2026);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F"]);
	});

	it("excludes G for workforce 200 in non-triennial year 2028", () => {
		const result = getApplicableIndicators(200, 2028);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F"]);
	});

	it("includes G for workforce 200 in triennial year 2027", () => {
		const result = getApplicableIndicators(200, 2027);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("includes G for workforce 100 at universal year 2030 (triennial cadence)", () => {
		const result = getApplicableIndicators(100, 2030);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("excludes G for workforce 100 in 2031 (non-triennial year)", () => {
		const result = getApplicableIndicators(100, 2031);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F"]);
	});

	it("includes G for workforce 250 at universal year 2030", () => {
		const result = getApplicableIndicators(250, 2030);
		expect(result.indicators).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});
});
