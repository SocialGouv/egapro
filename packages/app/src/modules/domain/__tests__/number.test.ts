import { describe, expect, it } from "vitest";

import {
	displayDecimal,
	normalizeDecimalInput,
	padDecimalToTwo,
	parseNumber,
} from "../shared/number";

describe("parseNumber", () => {
	it("parses a simple number", () => {
		expect(parseNumber("42")).toBe(42);
	});

	it("handles comma as decimal separator", () => {
		expect(parseNumber("3,14")).toBeCloseTo(3.14);
	});

	it("strips spaces (thousand separators)", () => {
		expect(parseNumber("1 000")).toBe(1000);
	});

	it("handles combined spaces and comma", () => {
		expect(parseNumber("1 234,56")).toBeCloseTo(1234.56);
	});

	it("returns NaN for empty string", () => {
		expect(parseNumber("")).toBeNaN();
	});
});

describe("normalizeDecimalInput", () => {
	it("returns empty string as-is", () => {
		expect(normalizeDecimalInput("")).toBe("");
	});

	it("replaces comma with dot", () => {
		expect(normalizeDecimalInput("3,14")).toBe("3.14");
	});

	it("strips spaces", () => {
		expect(normalizeDecimalInput("1 000")).toBe("1000");
	});

	it("rejects letters", () => {
		expect(normalizeDecimalInput("abc")).toBeNull();
	});

	it("rejects minus sign", () => {
		expect(normalizeDecimalInput("-5")).toBeNull();
	});

	it("rejects multiple dots", () => {
		expect(normalizeDecimalInput("1.2.3")).toBeNull();
	});
});

describe("displayDecimal", () => {
	it("returns empty string as-is", () => {
		expect(displayDecimal("")).toBe("");
	});

	it("replaces dot with comma", () => {
		expect(displayDecimal("3.14")).toBe("3,14");
	});

	it("adds thousand separator", () => {
		expect(displayDecimal("1000")).toBe("1 000");
	});

	it("formats large number with decimals", () => {
		expect(displayDecimal("1234567.89")).toBe("1 234 567,89");
	});
});

describe("padDecimalToTwo", () => {
	it("returns empty string as-is", () => {
		expect(padDecimalToTwo("")).toBe("");
	});

	it("pads an integer with .00", () => {
		expect(padDecimalToTwo("100")).toBe("100.00");
	});

	it("pads a one-digit fraction with trailing zero", () => {
		expect(padDecimalToTwo("100.5")).toBe("100.50");
	});

	it("keeps a two-digit fraction unchanged", () => {
		expect(padDecimalToTwo("100.50")).toBe("100.50");
	});

	it("rounds fractions longer than two digits", () => {
		expect(padDecimalToTwo("100.555")).toBe("100.56");
	});

	it("returns non-numeric input unchanged", () => {
		expect(padDecimalToTwo("abc")).toBe("abc");
	});
});
