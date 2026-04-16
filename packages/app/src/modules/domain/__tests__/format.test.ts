import { describe, expect, it } from "vitest";

import {
	computePercentage,
	computeProportion,
	formatCount,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatPointsDelta,
	formatShortDate,
	formatShortDateTime,
	formatTotal,
} from "../shared/format";

describe("formatGap", () => {
	it("formats a gap with French decimal separator", () => {
		expect(formatGap(5.3)).toBe("5,3 %");
	});

	it("returns dash for null", () => {
		expect(formatGap(null)).toBe("-");
	});
});

describe("formatGapCompact", () => {
	it("formats without percent sign", () => {
		expect(formatGapCompact(5.3)).toBe("5,3");
	});

	it("returns dash for null", () => {
		expect(formatGapCompact(null)).toBe("-");
	});
});

describe("computeProportion", () => {
	it("computes percentage from count and total", () => {
		expect(computeProportion("25", 100)).toBe("25,0 %");
	});

	it("returns dash when total is zero", () => {
		expect(computeProportion("10", 0)).toBe("-");
	});
});

describe("formatCurrency", () => {
	it("formats a number with euro sign", () => {
		expect(formatCurrency("1234.5")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns dash for undefined", () => {
		expect(formatCurrency(undefined)).toBe("-");
	});
});

describe("computePercentage", () => {
	it("computes percentage from count and total", () => {
		expect(computePercentage(25, 100)).toBe("25,0 %");
	});

	it("returns dash when total is zero", () => {
		expect(computePercentage(10, 0)).toBe("-");
	});
});

describe("formatTotal", () => {
	it("formats value with unit", () => {
		expect(formatTotal(1234.5, "€")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns dash for null", () => {
		expect(formatTotal(null, "€")).toBe("-");
	});
});

describe("formatShortDate", () => {
	it("formats a date in dd/mm/yyyy", () => {
		expect(formatShortDate(new Date("2024-06-15T10:00:00Z"))).toBe(
			"15/06/2024",
		);
	});

	it("returns dash for null", () => {
		expect(formatShortDate(null)).toBe("—");
	});

	it("returns dash for undefined", () => {
		expect(formatShortDate(undefined)).toBe("—");
	});
});

describe("formatShortDateTime", () => {
	it("formats a date with time", () => {
		const result = formatShortDateTime(new Date("2024-06-15T10:30:00Z"));
		expect(result).toMatch(/15\/06\/2024/);
		expect(result).toMatch(/\d{2}:\d{2}/);
	});

	it("returns dash for null", () => {
		expect(formatShortDateTime(null)).toBe("—");
	});
});

describe("formatCount", () => {
	it("formats an integer with French thousand separators", () => {
		expect(formatCount(4213)).toMatch(/4[\s\u202f]213/);
	});

	it("leaves values below 1000 unchanged", () => {
		expect(formatCount(42)).toBe("42");
	});
});

describe("formatPointsDelta", () => {
	it("prefixes a positive value with + and appends pts", () => {
		expect(formatPointsDelta(2.1)).toBe("+2,1 pts");
	});

	it("prefixes a negative value with - and appends pts", () => {
		expect(formatPointsDelta(-2.1)).toBe("-2,1 pts");
	});

	it("formats zero as '= 0 pt' (singular, no sign)", () => {
		expect(formatPointsDelta(0)).toBe("= 0 pt");
		expect(formatPointsDelta(0.04)).toBe("= 0 pt");
	});

	it("rounds to one decimal", () => {
		expect(formatPointsDelta(2.16)).toBe("+2,2 pts");
		expect(formatPointsDelta(-0.18)).toBe("-0,2 pts");
	});
});
