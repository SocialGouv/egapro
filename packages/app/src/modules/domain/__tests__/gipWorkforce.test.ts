import { describe, expect, it } from "vitest";

import { isCseRequired } from "../shared/companySize";
import {
	GIP_WORKFORCE_UNKNOWN_LABEL,
	getObligationWorkforce,
	parseGipWorkforce,
	toDisplayWorkforce,
} from "../shared/gipWorkforce";
import { isIndicatorGRequired } from "../shared/indicatorG";

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

	it("makes a company absent from the GIP file non-subject to CSE and indicator G", () => {
		const workforce = getObligationWorkforce(null);
		expect(isCseRequired(workforce)).toBe(false);
		expect(isIndicatorGRequired(workforce, 2027)).toBe(false);
	});

	it("compares thresholds on the exact value, so 99,97 stays below 100", () => {
		expect(isCseRequired(getObligationWorkforce(99.97))).toBe(false);
		expect(isCseRequired(getObligationWorkforce(100))).toBe(true);
	});

	it("does not promote 149,99 to the triennial indicator G threshold", () => {
		expect(isIndicatorGRequired(getObligationWorkforce(149.99), 2027)).toBe(
			false,
		);
		expect(isIndicatorGRequired(getObligationWorkforce(150), 2027)).toBe(true);
	});
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

describe("GIP_WORKFORCE_UNKNOWN_LABEL", () => {
	it("is the label shown instead of any Weez/INSEE fallback value", () => {
		expect(GIP_WORKFORCE_UNKNOWN_LABEL).toBe("Effectif non connu du GIP");
	});
});
