import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	getCompanySizeRange,
} from "../shared/companySize";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
} from "../shared/constants";

describe("regulatory size constants", () => {
	// Boundary behavior lives symbolically in demarcheDecisionTable.test.ts
	// (#3975); the literal values are pinned here (COMPANY_SIZE_RANGES below
	// carries its own literals, independent of these constants).
	it("pins the voluntary/triennial boundary at 50", () => {
		expect(COMPANY_SIZE_VOLUNTARY_MAX).toBe(50);
	});

	it("pins the annual-declaration + CSE boundary at 100", () => {
		expect(COMPANY_SIZE_ANNUAL_MIN).toBe(100);
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
