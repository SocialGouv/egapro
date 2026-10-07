import { CIVIL_DATE_TIME_ZONE } from "./civilDate";
import { GAP_DISPLAY_DECIMALS } from "./constants";
import { DISPLAY_DECIMALS, truncateDecimals } from "./decimal";
import { gapRatioToPercent, truncateGapRatio } from "./gap";
import { percentageOf } from "./percentage";

/**
 * The one place a value becomes display text — counts, percentages, amounts,
 * durations, file sizes, dates and times.
 *
 * All formatters produce strings with French locale conventions: comma decimal
 * separator, narrow no-break space thousand separator, and the appropriate unit
 * suffix (%, €, j, custom).
 *
 * A percentage or an average shown to the user follows one rule, held by
 * `decimal.ts`: two decimals, truncated toward zero. A name still says the scale
 * it reads AND whether the two decimals are always written: `formatGap` and
 * `computePercentage` always write two, `formatPrecisePercentage` drops trailing
 * zeros. Never give one name two conventions — `formatGap` used to mean both a
 * 0-100 value and a 0-1 ratio, and feeding one the other's input printed `717 %`
 * or `0,07 %`.
 *
 * These are pure presentation helpers — they contain no business logic. A formatter
 * that carries a business rule (`formatSiren`, `formatWorkforceForUser`) lives next
 * to its rule and leans on the primitives here. For gap calculation and threshold
 * classification, see `gap.ts`.
 */

/** The dash a formatter writes when there is no value to show. */
export const MISSING_VALUE = "—";

/**
 * U+202F, the narrow no-break space French typography puts between a number and
 * its unit. It is what `Intl` already emits as a thousands separator; spelling it
 * out here is for the places that assemble a unit by hand, so the unit can never
 * wrap onto a line of its own.
 */
export const NARROW_NBSP = "\u202f";

type WithUnitOption = {
	withUnit?: boolean;
};

/** One decimal, always written — `12` reads `12,0`, never `12`. */
function oneFixedDecimal(value: number): string {
	return value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	});
}

/** Truncated to the display decimals, both always written: `40` → `"40,00"`, `51.428` → `"51,42"`. */
function fixedTruncatedDecimals(value: number): string {
	return truncateDecimals(value).toLocaleString("fr-FR", {
		maximumFractionDigits: DISPLAY_DECIMALS,
		minimumFractionDigits: DISPLAY_DECIMALS,
	});
}

/** Truncated to the display decimals, trailing zeros dropped: `49.876` → `"49,87"`, `66.7` → `"66,7"`, `50` → `"50"`. */
export function formatTruncatedDecimal(value: number): string {
	return truncateDecimals(value).toLocaleString("fr-FR", {
		maximumFractionDigits: DISPLAY_DECIMALS,
	});
}

function truncateGap(gap: number): number {
	return truncateGapRatio(gap / 100) * 100;
}

/** Format a gap value with two decimals (truncated) and a percent sign: `5.34` → `"5,34 %"`. */
export function formatGap(gap: number | null): string {
	if (gap === null) return "- %";
	return `${truncateGap(gap).toFixed(GAP_DISPLAY_DECIMALS).replace(".", ",")} %`;
}

/** Format a gap value with two decimals (truncated), no percent sign: `5.34` → `"5,34"`. */
export function formatGapCompact(gap: number | null): string {
	if (gap === null) return "-";
	return truncateGap(gap).toFixed(GAP_DISPLAY_DECIMALS).replace(".", ",");
}

/**
 * Format a monetary amount held as a raw form string, with its unit:
 * `("1234.5", "€/h")` → `"1 234,5 €/h"`. An empty amount reads `"-"` alone —
 * `formatTotal` would write `"- €"`, which reads as an amount of zero euros.
 */
export function formatCurrency(value?: string | null, unit = "€"): string {
	if (!value) return "-";
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return "-";
	return formatTotal(n, unit);
}

/**
 * Echo a percentage the user typed, at the one decimal its field accepts:
 * `35` → `"35 %"`, `12.5` → `"12,5 %"`. Returns `"—"` for nullish values.
 * Not for a computed percentage — that one takes two truncated decimals.
 */
export function formatPercentage(value: number | null | undefined): string {
	if (value === null || value === undefined) return "—";
	return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/** Compute count/total as a percentage, two truncated decimals always written: `(18, 35)` → `"51,42 %"`. */
export function computePercentage(count: number, total: number): string {
	if (total === 0) return "- %";
	return `${fixedTruncatedDecimals(percentageOf(count, total))} %`;
}

/** Format a numeric total with an arbitrary unit suffix: `(1234.5, "€")` → `"1 234,5 €"`. */
export function formatTotal(value: number | null, unit: string): string {
	if (value === null) return `- ${unit}`;
	return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
}

/** Whole count, thousands grouped: `2256` → `"2 256"`. `null` reads as the missing-value dash. */
export function formatCount(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return value.toLocaleString("fr-FR");
}

/** Percentage already on the 0-100 scale, up to two truncated decimals: `66.666` → `"66,66 %"`, `66.7` → `"66,7 %"`. */
export function formatPrecisePercentage(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return `${formatTruncatedDecimal(value)} %`;
}

/**
 * Percentage from a 0-1 ratio — the shape every gap and proportion column is
 * stored in: `0.0717` → `"7,17 %"`. Named after the scale it reads, not after
 * the gap, because proportions come through here too.
 */
export function formatRatioAsPercentage(ratio: number | null): string {
	return formatPrecisePercentage(gapRatioToPercent(ratio));
}

/** Percentage with no decimal at all: `33.3` → `"33 %"`. For values already rounded upstream. */
export function formatWholePercentage(value: number): string {
	return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;
}

/** Percentage with exactly one decimal: `12` → `"12,0"`, with the unit `"12,0 %"`. */
export function formatFixedPercentage(
	value: number,
	{ withUnit = false }: WithUnitOption = {},
): string {
	const formatted = oneFixedDecimal(value);
	return withUnit ? `${formatted} %` : formatted;
}

/**
 * Magnitude of a percentage-point delta, one decimal: `-2.07` → `"2,1"`.
 * The sign is carried by the badge that shows it, never by the figure.
 */
export function formatPointsAbs(points: number): string {
	return oneFixedDecimal(Math.abs(points));
}

/** Plain decimal, up to one place, no unit: `2.5` → `"2,5"`, `2` → `"2"`. */
export function formatDecimal(value: number): string {
	return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

/** Duration in days, exactly one decimal: `2.5` → `"2,5"`, with the unit `"2,5 j"`. */
export function formatDays(
	value: number | null,
	{ withUnit = false }: WithUnitOption = {},
): string {
	if (value === null) return MISSING_VALUE;
	const formatted = oneFixedDecimal(value);
	return withUnit ? `${formatted} j` : formatted;
}

const ONE_KO = 1024;
const ONE_MO = ONE_KO * 1024;

/**
 * Byte count as a French file-size label: `63365` → `"61,88 Ko"`.
 * Returns `null` when the size is unknown, so callers can omit it entirely.
 */
export function formatFileSize(bytes: number | null): string | null {
	if (bytes === null || bytes < 0) return null;
	const formatter = new Intl.NumberFormat("fr-FR", {
		maximumFractionDigits: 2,
	});
	if (bytes < ONE_MO) {
		return `${formatter.format(bytes / ONE_KO)} Ko`;
	}
	return `${formatter.format(bytes / ONE_MO)} Mo`;
}

function shortDate(date: Date, timeZone?: string): string {
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone,
	}).format(new Date(date));
}

/** Format a timestamp's day in short French format, in the viewer's time zone: `"10/03/2026"`. Returns `"—"` for nullish values. */
export function formatShortDate(date: Date | null | undefined): string {
	if (!date) return MISSING_VALUE;
	return shortDate(date);
}

/** Format a civil date (UTC midnight) in short French format: `new Date("2026-03-10")` → `"10/03/2026"`, whatever the viewer's time zone. Returns `"—"` for nullish values. */
export function formatCivilShortDate(date: Date | null | undefined): string {
	if (!date) return MISSING_VALUE;
	return shortDate(date, CIVIL_DATE_TIME_ZONE);
}

/** Format a persisted ISO date string (`YYYY-MM-DD`) in short French format: `"2026-03-10"` → `"10/03/2026"`. */
export function formatIsoDate(value: string): string {
	const [year, month, day] = value.split("-");
	return `${day}/${month}/${year}`;
}

/** Format an optional persisted ISO date string (`YYYY-MM-DD`) in short French format. Returns `"—"` for `undefined`. */
export function formatOptionalIsoDate(value: string | undefined): string {
	return value === undefined ? "—" : formatIsoDate(value);
}

/** Format a date with time in short French format: `new Date(…)` → `"10/03/2026 14:30"`. Returns `"—"` for nullish values. */
export function formatShortDateTime(date: Date | null | undefined): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

function longDate(date: Date, timeZone?: string): string {
	// `formatToParts` rather than a regex over the formatted string: the ordinal
	// is applied to the day part itself, whatever separator or part order the
	// runtime's locale data produces.
	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone,
	})
		.formatToParts(date)
		.map((part) =>
			part.type === "day" && part.value === "1" ? "1ᵉʳ" : part.value,
		)
		.join("");
}

/**
 * Format a timestamp's day in long French format, in the viewer's time zone:
 * `"10 mars 2026"`. The first day of a month takes the French ordinal: `"1ᵉʳ juin 2026"`.
 */
export function formatLongDate(date: Date): string {
	return longDate(date);
}

/**
 * Format a civil date (UTC midnight) in long French format, whatever the viewer's
 * time zone: `new Date("2026-06-01")` → `"1ᵉʳ juin 2026"`.
 */
export function formatCivilLongDate(date: Date): string {
	return longDate(date, CIVIL_DATE_TIME_ZONE);
}

/**
 * A civil date split for markup that styles the ordinal itself:
 * `new Date("2026-03-01")` → `{ day: 1, monthYear: "mars 2026" }`.
 */
export function civilLongDateParts(date: Date): {
	day: number;
	monthYear: string;
} {
	return {
		day: date.getUTCDate(),
		monthYear: new Intl.DateTimeFormat("fr-FR", {
			month: "long",
			year: "numeric",
			timeZone: CIVIL_DATE_TIME_ZONE,
		}).format(date),
	};
}

/** Format a `MM-DD` fragment (year-agnostic) to French short form: `"02-15"` → `"15/02"`. */
export function formatMonthDay(monthDay: string): string {
	const [month, day] = monthDay.split("-");
	return `${day}/${month}`;
}

/** Format the time of day on a 24-hour clock: `"14:05"`. */
export function formatTime(date: Date): string {
	return new Intl.DateTimeFormat("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);
}
