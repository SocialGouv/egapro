import { describe, expect, it } from "vitest";

import {
	alignCampaignYear,
	CAMPAIGN_YEAR_ALIGNED_ON_V2,
} from "../shared/campaignAlignment";
import { V2_FIRST_CAMPAIGN_YEAR } from "../shared/constants";
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

// The triennial cycle around the base year and every pre-2030 isIndicatorGRequired
// combination are covered symbolically by demarcheDecisionTable.test.ts (#3975).
describe("isTriennialYear — pre-base guard", () => {
	// base − 3 is on-modulo, so only the pre-base guard rejects it — the decision
	// table's base − 1 case cannot discriminate that guard.
	it("keeps on-cycle years before the base year out of the triennial cadence", () => {
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR - 3)).toBe(false);
	});
});

// The decision table (#3975) deliberately keeps its matrix below
// INDICATOR_G_UNIVERSAL_YEAR, so the 2030+ down-extension regime is owned here.
describe("isIndicatorGRequired — universal year (2030+) regime", () => {
	it("returns true for workforce 150-249 in triennial year 2030", () => {
		expect(isIndicatorGRequired(200, 2030)).toBe(true);
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

	it("requires the voluntary tier (< 50) every year — 7-indicator volunteering (2026-07 arbitrage)", () => {
		for (let year = 2027; year <= 2033; year++) {
			expect(isIndicatorGRequired(0, year)).toBe(true);
			expect(isIndicatorGRequired(49, year)).toBe(true);
		}
		// Pinned: the < 50 tier carries all 7 indicators with no year cadence, like
		// the >= 250 branch. The V2 scheme starts fresh in March 2027 with no
		// pre-2027 declarations, so these pre-campaign pins may never be "corrected".
		expect(isIndicatorGRequired(0, 2018)).toBe(true);
		expect(isIndicatorGRequired(49, 2026)).toBe(true);
	});

	it("returns true for workforce >= 250 at universal year (2030)", () => {
		expect(isIndicatorGRequired(250, 2030)).toBe(true);
		expect(isIndicatorGRequired(300, 2030)).toBe(true);
	});

	it("returns true for workforce >= 250 after universal year", () => {
		expect(isIndicatorGRequired(300, 2035)).toBe(true);
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

// #4240 recette bridge: the 2026 campaign is temporarily lifted onto the first V2
// campaign (2027) rules so 2026 manual testing follows the test-book journeys.
// This block locks what the bridge changes and — just as important — what it must
// leave untouched (cadence, constants, pre-V2 years).
describe("#4240 — 2026 recette bridge aligns 2026 on the 2027 rules", () => {
	it("makes 2026 a triennial year (lifted onto the base year)", () => {
		expect(isTriennialYear(CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(true);
	});

	it("computes indicator G for the 150-249 band in 2026 (as if 2027)", () => {
		expect(isIndicatorGRequired(200, CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(true);
		expect(
			getApplicableIndicators(200, CAMPAIGN_YEAR_ALIGNED_ON_V2).indicators,
		).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("leaves the other 2026 size tiers unchanged", () => {
		// Volunteering (< 50) carries all 7 indicators every year — unchanged.
		expect(isIndicatorGRequired(30, CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(true);
		// 50-99 mandatory band stays below the triennial floor: still no indicator G.
		expect(isIndicatorGRequired(75, CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(false);
		// 100-149 is below INDICATOR_G_TRIENNIAL_MIN: still excluded even once lifted.
		expect(isIndicatorGRequired(120, CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(false);
		// >= 250 is required every year regardless of cadence — unchanged.
		expect(isIndicatorGRequired(300, CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(true);
	});

	it("leaves the triennial cadence itself intact for the real V2 years", () => {
		expect(isTriennialYear(2027)).toBe(true);
		expect(isTriennialYear(2028)).toBe(false);
		expect(isTriennialYear(2029)).toBe(false);
		expect(isTriennialYear(2030)).toBe(true);
		expect(isTriennialYear(2031)).toBe(false);
		expect(isTriennialYear(2032)).toBe(false);
		expect(isTriennialYear(2033)).toBe(true);
	});

	it("does not move the regulatory constants", () => {
		expect(V2_FIRST_CAMPAIGN_YEAR).toBe(2027);
		expect(INDICATOR_G_TRIENNIAL_BASE_YEAR).toBe(2027);
	});

	it("does not lift any pre-V2 year other than 2026", () => {
		expect(isTriennialYear(2025)).toBe(false);
		expect(isTriennialYear(2024)).toBe(false);
	});

	it("alignCampaignYear maps only 2026 → 2027 and is otherwise the identity", () => {
		expect(alignCampaignYear(2025)).toBe(2025);
		expect(alignCampaignYear(CAMPAIGN_YEAR_ALIGNED_ON_V2)).toBe(
			V2_FIRST_CAMPAIGN_YEAR,
		);
		expect(alignCampaignYear(2027)).toBe(2027);
		expect(alignCampaignYear(2033)).toBe(2033);
		// Idempotent: aligning the already-aligned year is a fixed point.
		expect(
			alignCampaignYear(alignCampaignYear(CAMPAIGN_YEAR_ALIGNED_ON_V2)),
		).toBe(V2_FIRST_CAMPAIGN_YEAR);
	});
});
