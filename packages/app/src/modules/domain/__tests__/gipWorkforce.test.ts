import { describe, expect, it } from "vitest";

import {
	GIP_WORKFORCE_ABSENT_DISPLAY,
	getObligationWorkforce,
	parseGipWorkforce,
	toDisplayWorkforce,
} from "../shared/gipWorkforce";

describe("parseGipWorkforce", () => {
	it("parses the numeric(9,2) string returned by the postgres driver", () => {
		expect(parseGipWorkforce("70.00")).toBe(70);
		expect(parseGipWorkforce("99.97")).toBe(99.97);
		expect(parseGipWorkforce("0.00")).toBe(0);
	});

	it("passes a number through unchanged", () => {
		expect(parseGipWorkforce(250)).toBe(250);
		expect(parseGipWorkforce(99.97)).toBe(99.97);
		expect(parseGipWorkforce(0)).toBe(0);
	});

	it("returns null when the company is absent from the GIP file", () => {
		expect(parseGipWorkforce(null)).toBeNull();
		expect(parseGipWorkforce(undefined)).toBeNull();
	});

	it("returns null for a non-numeric value", () => {
		expect(parseGipWorkforce("")).toBeNull();
		expect(parseGipWorkforce("n/a")).toBeNull();
		expect(parseGipWorkforce(Number.NaN)).toBeNull();
		expect(parseGipWorkforce(Number.POSITIVE_INFINITY)).toBeNull();
	});

	it("keeps a negative value rather than silently coercing it", () => {
		expect(parseGipWorkforce("-1.00")).toBe(-1);
	});
});

describe("getObligationWorkforce", () => {
	it("returns the exact GIP value when the company is known", () => {
		expect(getObligationWorkforce(70)).toBe(70);
		expect(getObligationWorkforce(99.97)).toBe(99.97);
		expect(getObligationWorkforce(0)).toBe(0);
	});

	it("treats a company absent from the GIP file as a sub-50 headcount", () => {
		expect(getObligationWorkforce(null)).toBe(0);
	});

	// Downstream obligation consequences (absent company → no obligation;
	// exact-value comparison for decimal workforces like 99.97) live in the
	// GIP-workforce describes of demarcheDecisionTable.test.ts (#3975).
});

describe("toDisplayWorkforce", () => {
	it("floors the value so 99,97 never displays as 100", () => {
		expect(toDisplayWorkforce(99.97)).toBe(99);
		expect(toDisplayWorkforce(70.5)).toBe(70);
		expect(toDisplayWorkforce(99.999)).toBe(99);
	});

	it("leaves an integer value unchanged", () => {
		expect(toDisplayWorkforce(70)).toBe(70);
		expect(toDisplayWorkforce(0)).toBe(0);
	});

	it("returns null when the company is absent from the GIP file", () => {
		expect(toDisplayWorkforce(null)).toBeNull();
	});
});

describe("GIP_WORKFORCE_ABSENT_DISPLAY", () => {
	it("is the label shown instead of any Weez/INSEE fallback value", () => {
		expect(GIP_WORKFORCE_ABSENT_DISPLAY).toBe("< 50");
	});
});
