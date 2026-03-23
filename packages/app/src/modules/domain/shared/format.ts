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
