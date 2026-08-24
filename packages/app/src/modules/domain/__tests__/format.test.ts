import { describe, expect, it } from "vitest";

import {
	computePercentage,
	computeProportion,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatIsoDate,
	formatMonthDay,
	formatPercentage,
	formatShortDate,
	formatShortDateTime,
	formatTotal,
} from "../shared/format";

describe("formatGap", () => {
	it("formats a gap with French decimal separator and two decimals", () => {
		expect(formatGap(5.3)).toBe("5,30 %");
	});

	it("truncates to two decimals without rounding", () => {
		expect(formatGap(5.349)).toBe("5,34 %");
		expect(formatGap(5.341)).toBe("5,34 %");
		expect(formatGap(99.999)).toBe("99,99 %");
	});

	// The reported bug: a below-threshold gap rounded up to "5,0 %" and looked
	// like the alert value. Truncation must never lift a value across the seuil.
	it("never displays the threshold for a gap strictly below 5", () => {
		expect(formatGap(4.9617)).toBe("4,96 %");
		expect(formatGap(4.996)).toBe("4,99 %");
		expect(formatGap(4.999)).toBe("4,99 %");
	});

	it("displays exactly the threshold only when the gap reaches it", () => {
		expect(formatGap(5)).toBe("5,00 %");
		expect(formatGap(5.04)).toBe("5,04 %");
	});

	it("truncates negative gaps toward zero, preserving magnitude below the seuil", () => {
		expect(formatGap(-4.9617)).toBe("-4,96 %");
		expect(formatGap(-5)).toBe("-5,00 %");
		expect(formatGap(-5.04)).toBe("-5,04 %");
	});

	// Values already exact at two decimals must survive truncation untouched.
	// A naive `Math.trunc(gap * 100)` drops a whole cent here, because the
	// product carries binary representation error (4.6 * 100 = 459.99999…).
	it("does not shave a cent off values already exact at two decimals", () => {
		expect(formatGap(4.6)).toBe("4,60 %");
		expect(formatGap(5.1)).toBe("5,10 %");
		expect(formatGap(2.3)).toBe("2,30 %");
		expect(formatGap(8.7)).toBe("8,70 %");
		expect(formatGap(1.15)).toBe("1,15 %");
		expect(formatGap(-4.6)).toBe("-4,60 %");
	});

	it("returns '- %' for null", () => {
		expect(formatGap(null)).toBe("- %");
	});
});

describe("formatGapCompact", () => {
	it("formats without percent sign, two decimals truncated", () => {
		expect(formatGapCompact(5.3)).toBe("5,30");
		expect(formatGapCompact(5.349)).toBe("5,34");
	});

	it("never displays the threshold for a gap strictly below 5", () => {
		expect(formatGapCompact(4.9617)).toBe("4,96");
		expect(formatGapCompact(5)).toBe("5,00");
	});

	it("returns dash for null", () => {
		expect(formatGapCompact(null)).toBe("-");
	});
});

describe("computeProportion", () => {
	it("computes percentage from count and total", () => {
		expect(computeProportion("25", 100)).toBe("25,0 %");
	});

	it("returns '- %' when total is zero", () => {
		expect(computeProportion("10", 0)).toBe("- %");
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

	it("returns '- %' when total is zero", () => {
		expect(computePercentage(10, 0)).toBe("- %");
	});
});

describe("formatPercentage", () => {
	it.each([
		[null, "—"],
		[undefined, "—"],
		[0, "0 %"],
		[60, "60 %"],
		[60.5, "60,5 %"],
		[33.333, "33,3 %"],
		[100, "100 %"],
	])("formats %s as %s", (value, expected) => {
		expect(formatPercentage(value)).toBe(expected);
	});

	it("keeps a negative percentage signed", () => {
		expect(formatPercentage(-12.5)).toBe("-12,5 %");
	});
});

describe("formatTotal", () => {
	it("formats value with unit", () => {
		expect(formatTotal(1234.5, "€")).toMatch(/1[\s\u202f]234,5 €/);
	});

	it("returns '- €' for null", () => {
		expect(formatTotal(null, "€")).toBe("- €");
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

describe("formatIsoDate", () => {
	it("formats a persisted ISO date as dd/mm/yyyy", () => {
		expect(formatIsoDate("2026-03-10")).toBe("10/03/2026");
	});

	it("pads single-digit days and months", () => {
		expect(formatIsoDate("2025-01-05")).toBe("05/01/2025");
	});

	it("keeps the persisted day across a month boundary", () => {
		expect(formatIsoDate("2025-07-01")).toBe("01/07/2025");
		expect(formatIsoDate("2026-06-30")).toBe("30/06/2026");
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
