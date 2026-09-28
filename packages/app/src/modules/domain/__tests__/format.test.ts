import { afterEach, describe, expect, it, vi } from "vitest";

import {
	computePercentage,
	computeProportion,
	formatCount,
	formatCurrency,
	formatDays,
	formatDecimal,
	formatFileSize,
	formatFixedPercentage,
	formatGap,
	formatGapCompact,
	formatIsoDate,
	formatLongDate,
	formatMonthDay,
	formatOptionalIsoDate,
	formatPercentage,
	formatPointsAbs,
	formatPrecisePercentage,
	formatRatioAsPercentage,
	formatRoundedCount,
	formatShortDate,
	formatShortDateTime,
	formatTime,
	formatTotal,
	formatWholePercentage,
	MISSING_VALUE,
	NARROW_NBSP,
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

	it("takes an arbitrary unit, for the hourly tranches of the recap", () => {
		expect(formatCurrency("1234.5", "€/h")).toMatch(/1[\s\u202f]234,5 €\/h/);
	});

	it("returns a bare dash for undefined, never an amount of zero euros", () => {
		expect(formatCurrency(undefined)).toBe("-");
		expect(formatCurrency(undefined, "€/h")).toBe("-");
		expect(formatCurrency("", "€/h")).toBe("-");
		expect(formatCurrency("not-a-number")).toBe("-");
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

	describe("under a negative-offset timezone", () => {
		afterEach(() => {
			vi.unstubAllEnvs();
		});

		// Regression: `new Date("2025-07-01")` parsed as UTC midnight rendered back as "30/06/2025".
		it("keeps the persisted day", () => {
			vi.stubEnv("TZ", "America/New_York");
			expect(formatIsoDate("2025-07-01")).toBe("01/07/2025");
		});
	});
});

describe("formatOptionalIsoDate", () => {
	it("formats a persisted ISO date as dd/mm/yyyy", () => {
		expect(formatOptionalIsoDate("2026-03-10")).toBe("10/03/2026");
	});

	it("returns dash for undefined", () => {
		expect(formatOptionalIsoDate(undefined)).toBe("—");
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

describe("MISSING_VALUE", () => {
	it("is the em dash every formatter writes for an absent value", () => {
		expect(MISSING_VALUE).toBe("\u2014");
	});
});

describe("NARROW_NBSP", () => {
	it("is the narrow no-break space, so a unit never wraps away from its number", () => {
		expect(NARROW_NBSP).toBe("\u202f");
	});
});

describe("formatCount", () => {
	it("groups thousands with the French narrow no-break space", () => {
		expect(formatCount(2256)).toBe("2\u202f256");
		expect(formatCount(1234)).toBe("1\u202f234");
	});

	it("leaves a value below a thousand ungrouped", () => {
		expect(formatCount(0)).toBe("0");
		expect(formatCount(999)).toBe("999");
	});

	it("keeps the decimals a chart axis tick may carry", () => {
		expect(formatCount(2.5)).toBe("2,5");
	});

	it("marks a missing count rather than printing a zero", () => {
		expect(formatCount(null)).toBe(MISSING_VALUE);
	});
});

describe("formatRoundedCount", () => {
	it("rounds an average headcount to the unit", () => {
		expect(formatRoundedCount(249.6)).toBe("250");
		expect(formatRoundedCount(249.4)).toBe("249");
	});

	it("groups the rounded value like any other count", () => {
		expect(formatRoundedCount(2256.4)).toBe("2\u202f256");
	});

	it("marks a missing count rather than printing a zero", () => {
		expect(formatRoundedCount(null)).toBe(MISSING_VALUE);
	});
});

describe("formatPrecisePercentage", () => {
	it("leaves a value already on the 0-100 scale alone", () => {
		expect(formatPrecisePercentage(66.7)).toBe("66,7 %");
	});

	it("keeps at most two decimals", () => {
		expect(formatPrecisePercentage(33.333)).toBe("33,33 %");
	});

	it("writes a whole percentage without a decimal part", () => {
		expect(formatPrecisePercentage(50)).toBe("50 %");
	});

	it("marks a missing percentage rather than printing a zero", () => {
		expect(formatPrecisePercentage(null)).toBe(MISSING_VALUE);
	});
});

describe("formatRatioAsPercentage", () => {
	it("turns the stored 0-1 ratio into a percentage", () => {
		expect(formatRatioAsPercentage(0.0717)).toBe("7,17 %");
	});

	it("keeps the sign of a gap in favour of women", () => {
		expect(formatRatioAsPercentage(-0.05)).toBe("-5 %");
	});

	it("marks a missing ratio rather than printing a zero", () => {
		expect(formatRatioAsPercentage(null)).toBe(MISSING_VALUE);
	});
});

describe("formatWholePercentage", () => {
	it("drops the decimal part entirely", () => {
		expect(formatWholePercentage(33.3)).toBe("33 %");
		expect(formatWholePercentage(66.7)).toBe("67 %");
	});

	it("leaves an already whole percentage alone", () => {
		expect(formatWholePercentage(100)).toBe("100 %");
		expect(formatWholePercentage(0)).toBe("0 %");
	});
});

describe("formatFixedPercentage", () => {
	it("formats with one decimal in French locale", () => {
		expect(formatFixedPercentage(5.3)).toBe("5,3");
	});

	it("pads integers with one decimal", () => {
		expect(formatFixedPercentage(12)).toBe("12,0");
	});

	it("appends % suffix when withUnit is true", () => {
		expect(formatFixedPercentage(5.3, { withUnit: true })).toBe("5,3 %");
		expect(formatFixedPercentage(12, { withUnit: true })).toBe("12,0 %");
	});

	it("reads a rate of a hundred as the tile used to write it", () => {
		expect(formatFixedPercentage(100)).toBe("100,0");
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

describe("formatDecimal", () => {
	it("keeps at most one decimal without padding a whole number", () => {
		expect(formatDecimal(2.5)).toBe("2,5");
		expect(formatDecimal(2)).toBe("2");
		expect(formatDecimal(2.46)).toBe("2,5");
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

describe("formatFileSize", () => {
	it("formats bytes under 1 Mo as a French Ko label", () => {
		expect(formatFileSize(63365)).toBe("61,88 Ko");
	});

	it("formats bytes of 1 Mo and above as a French Mo label", () => {
		expect(formatFileSize(5 * 1024 * 1024)).toBe("5 Mo");
		expect(formatFileSize(1024 * 1024 + 512 * 1024)).toBe("1,5 Mo");
	});

	it("returns null for unknown or negative sizes", () => {
		expect(formatFileSize(null)).toBeNull();
		expect(formatFileSize(-1)).toBeNull();
	});
});

describe("formatTime", () => {
	it("writes the time of day on a 24-hour clock", () => {
		expect(formatTime(new Date(2026, 5, 1, 14, 5))).toBe("14:05");
		expect(formatTime(new Date(2026, 5, 1, 9, 5))).toBe("09:05");
		expect(formatTime(new Date(2026, 5, 1, 0, 0))).toBe("00:00");
	});
});

describe("formatLongDate", () => {
	it("writes the month in full", () => {
		expect(formatLongDate(new Date(2026, 5, 12))).toBe("12 juin 2026");
	});

	it("gives the first of the month its French ordinal", () => {
		expect(formatLongDate(new Date(2026, 5, 1))).toBe(
			"1\u1d49\u02b3 juin 2026",
		);
	});
});
