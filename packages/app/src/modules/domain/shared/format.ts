import { GAP_DISPLAY_DECIMALS } from "./constants";
import { gapRatioToPercent } from "./gap";

/**
 * The one place a value becomes display text — counts, percentages, amounts,
 * durations, file sizes, dates and times.
 *
 * All formatters produce strings with French locale conventions: comma decimal
 * separator, narrow no-break space thousand separator, and the appropriate unit
 * suffix (%, €, j, custom).
 *
 * A name says the scale it reads AND the decimal convention it writes, because
 * a screen owns its decimals: `formatGap` truncates to two, `formatPrecisePercentage`
 * keeps up to two, `formatFixedPercentage` always writes one. Never give one name
 * two conventions — `formatGap` used to mean both a 0-100 value and a 0-1 ratio,
 * and feeding one the other's input printed `717 %` or `0,07 %`.
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

/**
 * Significant digits kept when normalising a scaled gap before truncation.
 *
 * A gap is a percentage, so `gap * 10 ** GAP_DISPLAY_DECIMALS` carries at most
 * `3 + GAP_DISPLAY_DECIMALS` digits of real signal (`100 %` being the widest
 * value). 12 sits well above that, and well below the ~17 digits where IEEE 754
 * representation noise appears — so it erases the noise without ever touching a
 * meaningful digit. Raising GAP_DISPLAY_DECIMALS beyond 9 would require raising
 * this too.
 */
const GAP_NORMALISATION_PRECISION = 12;

function truncateGap(gap: number): number {
	const scale = 10 ** GAP_DISPLAY_DECIMALS;
	// `gap * scale` carries binary representation error — 4.6 * 100 yields
	// 459.99999999999994, which Math.trunc would drop to a whole cent below
	// the real value. Normalising to GAP_NORMALISATION_PRECISION significant
	// digits absorbs that error so only genuine sub-cent precision is
	// truncated away.
	return (
		Math.trunc(Number((gap * scale).toPrecision(GAP_NORMALISATION_PRECISION))) /
		scale
	);
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

/** Compute count/total as a formatted percentage string. `count` is a raw string from form input. */
export function computeProportion(count: string, total?: number): string {
	const n = Number.parseInt(count, 10);
	if (Number.isNaN(n) || !total || total === 0) return "- %";
	return `${((n / total) * 100).toFixed(1).replace(".", ",")} %`;
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

/** Format an already-computed percentage: `35` → `"35 %"`, `12.5` → `"12,5 %"`. Returns `"—"` for nullish values. */
export function formatPercentage(value: number | null | undefined): string {
	if (value === null || value === undefined) return "—";
	return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/** Compute count/total as a formatted percentage string. Both arguments are numbers. */
export function computePercentage(count: number, total: number): string {
	if (total === 0) return "- %";
	return `${((count / total) * 100).toFixed(1).replace(".", ",")} %`;
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

/** Count rounded to the unit before grouping: `249.6` → `"250"`. For averages shown as a headcount. */
export function formatRoundedCount(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return formatCount(Math.round(value));
}

/** Percentage already on the 0-100 scale, up to two decimals: `33.333` → `"33,33 %"`, `66.7` → `"66,7 %"`. */
export function formatPrecisePercentage(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
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

/** Format a date in short French format: `new Date("2026-03-10")` → `"10/03/2026"`. Returns `"—"` for nullish values. */
export function formatShortDate(date: Date | null | undefined): string {
	if (!date) return "—";
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(date));
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

/**
 * Format a date in long French format: `new Date("2026-03-10")` → `"10 mars 2026"`.
 * The first day of a month takes the French ordinal: `"1ᵉʳ juin 2026"`.
 */
export function formatLongDate(date: Date): string {
	// `formatToParts` rather than a regex over the formatted string: the ordinal
	// is applied to the day part itself, whatever separator or part order the
	// runtime's locale data produces.
	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
		.formatToParts(date)
		.map((part) =>
			part.type === "day" && part.value === "1" ? "1ᵉʳ" : part.value,
		)
		.join("");
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
