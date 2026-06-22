import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	classifyCompanySize,
	getCompanySizeRange,
	isCseRequired,
} from "../shared/companySize";

describe("classifyCompanySize", () => {
	it("returns voluntary for workforce below 50", () => {
		expect(classifyCompanySize(10)).toBe("voluntary");
		expect(classifyCompanySize(49)).toBe("voluntary");
	});

	it("returns triennial for workforce between 50 and 99", () => {
		expect(classifyCompanySize(50)).toBe("triennial");
		expect(classifyCompanySize(75)).toBe("triennial");
		expect(classifyCompanySize(99)).toBe("triennial");
	});

	it("returns annual for workforce >= 100", () => {
		expect(classifyCompanySize(100)).toBe("annual");
		expect(classifyCompanySize(500)).toBe("annual");
	});
});

describe("isCseRequired", () => {
	it("returns false for workforce below 100", () => {
		expect(isCseRequired(50)).toBe(false);
		expect(isCseRequired(99)).toBe(false);
	});

	it("returns true for workforce at or above 100", () => {
		expect(isCseRequired(100)).toBe(true);
		expect(isCseRequired(500)).toBe(true);
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
