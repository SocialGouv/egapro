import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	classifyCompanySize,
	companySizeRangeSchema,
	isCseRequired,
	isObligatedForYear,
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

describe("isObligatedForYear", () => {
	it("returns false for workforce below 50 regardless of year", () => {
		expect(isObligatedForYear(10, 2030)).toBe(false);
		expect(isObligatedForYear(49, 2033)).toBe(false);
		expect(isObligatedForYear(0, 2040)).toBe(false);
	});

	it("returns true every year for workforce >= 100", () => {
		expect(isObligatedForYear(100, 2024)).toBe(true);
		expect(isObligatedForYear(250, 2025)).toBe(true);
		expect(isObligatedForYear(500, 2030)).toBe(true);
	});

	it("returns true for 50-99 only on triennial anchor years (2030, 2033, …)", () => {
		expect(isObligatedForYear(50, 2030)).toBe(true);
		expect(isObligatedForYear(75, 2033)).toBe(true);
		expect(isObligatedForYear(99, 2036)).toBe(true);
	});

	it("returns false for 50-99 on non-anchor years", () => {
		expect(isObligatedForYear(50, 2029)).toBe(false);
		expect(isObligatedForYear(75, 2031)).toBe(false);
		expect(isObligatedForYear(99, 2032)).toBe(false);
		expect(isObligatedForYear(50, 2034)).toBe(false);
	});

	it("returns false for 50-99 before the anchor year", () => {
		expect(isObligatedForYear(75, 2027)).toBe(false);
		expect(isObligatedForYear(75, 2024)).toBe(false);
	});
});

describe("COMPANY_SIZE_RANGES", () => {
	it("defines inclusive bounds covering every integer workforce without gaps", () => {
		expect(COMPANY_SIZE_RANGES["<50"]).toEqual({
			min: 0,
			max: 49,
			label: "Moins de 50 salariés",
		});
		expect(COMPANY_SIZE_RANGES["50-99"].min).toBe(50);
		expect(COMPANY_SIZE_RANGES["50-99"].max).toBe(99);
		expect(COMPANY_SIZE_RANGES["100-149"].min).toBe(100);
		expect(COMPANY_SIZE_RANGES["150-249"].max).toBe(249);
		expect(COMPANY_SIZE_RANGES["250+"].max).toBeNull();
	});
});

describe("companySizeRangeSchema", () => {
	it("accepts all five range values", () => {
		for (const range of ["<50", "50-99", "100-149", "150-249", "250+"]) {
			expect(companySizeRangeSchema.parse(range)).toBe(range);
		}
	});

	it("rejects unknown values", () => {
		expect(() => companySizeRangeSchema.parse("all")).toThrow();
		expect(() => companySizeRangeSchema.parse("50-100")).toThrow();
	});
});
