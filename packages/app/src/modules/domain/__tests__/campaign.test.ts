import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	formatFrenchDate,
	getCseYear,
	getCurrentYear,
	getDeclarationDeadline,
	getDefaultCampaignDeadlines,
	getSecondDeclarationDeadline,
} from "../shared/campaign";

describe("getCurrentYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the current calendar year", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getCurrentYear()).toBe(2025);
	});

	it("returns the year from the system clock", () => {
		vi.setSystemTime(new Date("2030-01-01"));
		expect(getCurrentYear()).toBe(2030);
	});
});

describe("getCseYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns current year + 1", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getCseYear()).toBe(2026);
	});
});

describe("getDeclarationDeadline", () => {
	it("returns 1er juin for the given year", () => {
		expect(getDeclarationDeadline(2027)).toBe("1\u1D49\u02B3 juin 2027");
	});
});

describe("getSecondDeclarationDeadline", () => {
	it("returns 1 décembre for the given year", () => {
		expect(getSecondDeclarationDeadline(2027)).toBe("1 décembre 2027");
	});
});

describe("formatFrenchDate", () => {
	it("formats the 1st of a month with superscript", () => {
		expect(formatFrenchDate("2027-06-01")).toBe("1\u1D49\u02B3 juin 2027");
	});

	it("formats other days without superscript", () => {
		expect(formatFrenchDate("2027-12-15")).toBe("15 décembre 2027");
	});

	it("formats February correctly", () => {
		expect(formatFrenchDate("2028-02-01")).toBe("1\u1D49\u02B3 février 2028");
	});
});

describe("getDefaultCampaignDeadlines", () => {
	it("returns default deadlines for a given year", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.decl1ModificationDeadline).toBe("1\u1D49\u02B3 juin 2027");
		expect(deadlines.decl1JustificationDeadline).toBe(
			"1\u1D49\u02B3 juin 2027",
		);
		expect(deadlines.decl1JointEvaluationDeadline).toBe(
			"1\u1D49\u02B3 août 2027",
		);
		expect(deadlines.decl2ModificationDeadline).toBe(
			"1\u1D49\u02B3 décembre 2027",
		);
		expect(deadlines.decl2JustificationDeadline).toBe(
			"1\u1D49\u02B3 décembre 2027",
		);
		expect(deadlines.decl2JointEvaluationDeadline).toBe(
			"1\u1D49\u02B3 février 2028",
		);
	});
});
