import { describe, expect, it } from "vitest";

import { formatCount, formatDays, formatPercent } from "../formatters";

describe("formatPercent", () => {
	it("formats with one decimal in French locale", () => {
		expect(formatPercent(5.3)).toBe("5,3");
	});

	it("pads integers with one decimal", () => {
		expect(formatPercent(12)).toBe("12,0");
	});

	it("appends % suffix when withUnit is true", () => {
		expect(formatPercent(5.3, { withUnit: true })).toBe("5,3 %");
	});
});

describe("formatCount", () => {
	it("formats with French thousands separator", () => {
		expect(formatCount(1234).replace(/\s+/g, " ")).toBe("1 234");
	});

	it("handles zero", () => {
		expect(formatCount(0)).toBe("0");
	});
});

describe("formatDays", () => {
	it("formats a value with one decimal", () => {
		expect(formatDays(2.5)).toBe("2,5");
	});

	it("appends j suffix when withUnit is true", () => {
		expect(formatDays(2.5, { withUnit: true })).toBe("2,5 j");
	});

	it("returns em-dash for null", () => {
		expect(formatDays(null)).toBe("—");
		expect(formatDays(null, { withUnit: true })).toBe("—");
	});
});
