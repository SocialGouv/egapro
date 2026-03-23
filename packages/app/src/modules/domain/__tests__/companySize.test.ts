import { describe, expect, it } from "vitest";

import { classifyCompanySize, isCseRequired } from "../shared/companySize";

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
