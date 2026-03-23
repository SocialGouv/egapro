import { describe, expect, it } from "vitest";

import {
	displayDecimal,
	normalizeDecimalInput,
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
		expect(displayDecimal("1000")).toBe("1\u202F000");
	});

	it("formats large number with decimals", () => {
		expect(displayDecimal("1234567.89")).toBe("1\u202F234\u202F567,89");
	});
});
