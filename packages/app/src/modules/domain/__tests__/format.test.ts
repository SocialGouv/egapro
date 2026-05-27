import { describe, expect, it } from "vitest";

import {
	computePercentage,
	computeProportion,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatMonthDay,
	formatPointsAbs,
	formatShortDate,
	formatShortDateTime,
	formatTotal,
	roundOneDecimal,
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

describe("formatMonthDay", () => {
	it("swaps a MM-DD fragment to the French DD/MM form", () => {
		expect(formatMonthDay("02-15")).toBe("15/02");
		expect(formatMonthDay("12-01")).toBe("01/12");
	});
});

describe("roundOneDecimal", () => {
	it("rounds to one decimal place (banker-agnostic)", () => {
		expect(roundOneDecimal(73.42)).toBe(73.4);
		expect(roundOneDecimal(73.45)).toBe(73.5);
		expect(roundOneDecimal(73.44)).toBe(73.4);
		expect(roundOneDecimal(73.0)).toBe(73);
	});

	it("handles negatives", () => {
		expect(roundOneDecimal(-2.07)).toBe(-2.1);
		expect(roundOneDecimal(-0.04)).toBeCloseTo(0, 10);
	});
});

describe("formatPointsAbs", () => {
	it("returns absolute value rounded to 1 decimal, French separator", () => {
		expect(formatPointsAbs(2.07)).toBe("2,1");
		expect(formatPointsAbs(-2.07)).toBe("2,1");
		expect(formatPointsAbs(0)).toBe("0,0");
		expect(formatPointsAbs(0.5)).toBe("0,5");
		expect(formatPointsAbs(-0.04)).toBe("0,0");
	});
});
