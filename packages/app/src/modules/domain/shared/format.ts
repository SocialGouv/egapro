/**
 * Display formatting for numeric values (gaps, currencies, percentages, totals).
 *
 * All formatters produce strings with French locale conventions:
 * comma decimal separator, narrow no-break space thousand separator,
 * and the appropriate unit suffix (%, €, custom).
 *
 * These are pure presentation helpers — they contain no business logic.
 * For gap calculation and threshold classification, see `gap.ts`.
 */

/** Format a gap value with one decimal and a percent sign: `5.3` → `"5,3 %"`. */
export function formatGap(gap: number | null): string {
	if (gap === null) return "-";
	return `${gap.toFixed(1).replace(".", ",")} %`;
}

/** Format a gap value with one decimal, no percent sign: `5.3` → `"5,3"`. */
export function formatGapCompact(gap: number | null): string {
	if (gap === null) return "-";
	return gap.toFixed(1).replace(".", ",");
}

/** Compute count/total as a formatted percentage string. `count` is a raw string from form input. */
export function computeProportion(count: string, total?: number): string {
	const n = Number.parseInt(count, 10);
	if (Number.isNaN(n) || !total || total === 0) return "-";
	return `${((n / total) * 100).toFixed(1).replace(".", ",")} %`;
}

/** Format a currency value with the euro sign: `"1234.5"` → `"1 234,5 €"`. */
export function formatCurrency(value?: string | null): string {
	if (!value) return "-";
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return "-";
	return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

/** Compute count/total as a formatted percentage string. Both arguments are numbers. */
export function computePercentage(count: number, total: number): string {
	if (total === 0) return "-";
	return `${((count / total) * 100).toFixed(1).replace(".", ",")} %`;
}

/** Format a numeric total with an arbitrary unit suffix: `(1234.5, "€")` → `"1 234,5 €"`. */
export function formatTotal(value: number | null, unit: string): string {
	if (value === null) return "-";
	return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
}

/** Format an integer with French thousand separators: `4213` → `"4 213"`. */
export function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

/**
 * Format a percentage-point delta with sign and unit for KPI badges:
 * `2.1` → `"+2,1 pts"`, `-2.1` → `"-2,1 pts"`, `0` → `"= 0 pt"`.
 *
 * The value is rounded to one decimal before display.
 */
export function formatPointsDelta(value: number): string {
	const rounded = Math.round(value * 10) / 10;
	if (rounded === 0) return "= 0 pt";
	const sign = rounded > 0 ? "+" : "-";
	const abs = Math.abs(rounded).toFixed(1).replace(".", ",");
	return `${sign}${abs} pts`;
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

/** Format a date in long French format: `new Date("2026-03-10")` → `"10 mars 2026"`. */
export function formatLongDate(date: Date): string {
	return date.toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

/** Format a `MM-DD` fragment (year-agnostic) to French short form: `"02-15"` → `"15/02"`. */
export function formatMonthDay(monthDay: string): string {
	const [month, day] = monthDay.split("-");
	return `${day}/${month}`;
}
