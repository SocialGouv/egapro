import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	classifyCompanySize,
	getCompanySizeRange,
	getOptionalCompanySizeRange,
	isCseRequired,
} from "../shared/companySize";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
} from "../shared/constants";

describe("regulatory size constants", () => {
	// Boundary behavior lives symbolically in demarcheDecisionTable.test.ts
	// (#3975); the literal values are pinned here (COMPANY_SIZE_RANGES below
	// carries its own literals, independent of these constants).
	it("pins the voluntary/mandatory boundary at 50", () => {
		expect(COMPANY_SIZE_VOLUNTARY_MAX).toBe(50);
	});

	it("pins the compliance-obligation + CSE boundary at 100", () => {
		expect(COMPANY_SIZE_ANNUAL_MIN).toBe(100);
	});
});

describe("classifyCompanySize", () => {
	it("classifies each obligation package by its workforce band", () => {
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX - 1)).toBe(
			"voluntary",
		);
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX)).toBe("mandatory");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe("mandatory");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN)).toBe(
			"mandatory_with_compliance",
		);
		expect(classifyCompanySize(300)).toBe("mandatory_with_compliance");
	});
});

describe("COMPANY_SIZE_RANGES", () => {
	it("exposes the five buckets in UI order", () => {
		expect(Object.keys(COMPANY_SIZE_RANGES)).toEqual([
			"<50",
			"50-99",
			"100-149",
			"150-249",
			"250+",
		]);
	});

	it("uses contiguous, non-overlapping bounds", () => {
		expect(COMPANY_SIZE_RANGES["<50"]).toEqual({
			min: 0,
			max: 49,
			label: "Moins de 50 salariés",
		});
		expect(COMPANY_SIZE_RANGES["50-99"]).toEqual({
			min: 50,
			max: 99,
			label: "50 à 99 salariés",
		});
		expect(COMPANY_SIZE_RANGES["100-149"]).toEqual({
			min: 100,
			max: 149,
			label: "100 à 149 salariés",
		});
		expect(COMPANY_SIZE_RANGES["150-249"]).toEqual({
			min: 150,
			max: 249,
			label: "150 à 249 salariés",
		});
	});

	it("leaves the top bucket open-ended", () => {
		expect(COMPANY_SIZE_RANGES["250+"]).toEqual({
			min: 250,
			max: null,
			label: "250 salariés et plus",
		});
	});
});

describe("getCompanySizeRange", () => {
	it("maps a workforce to its bucket key", () => {
		expect(getCompanySizeRange(0)).toBe("<50");
		expect(getCompanySizeRange(49)).toBe("<50");
		expect(getCompanySizeRange(50)).toBe("50-99");
		expect(getCompanySizeRange(99)).toBe("50-99");
		expect(getCompanySizeRange(100)).toBe("100-149");
		expect(getCompanySizeRange(149)).toBe("100-149");
		expect(getCompanySizeRange(150)).toBe("150-249");
		expect(getCompanySizeRange(249)).toBe("150-249");
		expect(getCompanySizeRange(250)).toBe("250+");
		expect(getCompanySizeRange(10000)).toBe("250+");
	});
});

describe("getOptionalCompanySizeRange", () => {
	it("maps a known workforce to the same bucket as getCompanySizeRange", () => {
		for (const workforce of [0, 49, 50, 99, 100, 149, 150, 249, 250, 10000]) {
			expect(getOptionalCompanySizeRange(workforce)).toBe(
				getCompanySizeRange(workforce),
			);
		}
	});

	it("puts an unknown workforce in no bucket at all", () => {
		expect(getOptionalCompanySizeRange(null)).toBeUndefined();
	});

	// An unknown headcount folded into `<50` would assert a size the source does
	// not give — the mistake `coalesce(workforce_ema, 0)` makes on the SQL side.
	it("never folds an unknown workforce into the smallest bucket", () => {
		expect(getOptionalCompanySizeRange(null)).not.toBe("<50");
		expect(getOptionalCompanySizeRange(0)).toBe("<50");
	});
});

describe("isCseRequired", () => {
	it("is size-based only: true from 100 employees", () => {
		expect(isCseRequired(99)).toBe(false);
		expect(isCseRequired(100)).toBe(true);
		expect(isCseRequired(250)).toBe(true);
	});
});
