/**
 * French-locale number parsing, normalization and display.
 *
 * These utilities handle the specifics of French numeric input:
 * - comma as decimal separator (e.g. "3,14")
 * - narrow no-break space as thousand separator (e.g. "1 000")
 *
 * They are used by form inputs to accept, validate and redisplay
 * user-entered numbers without losing locale conventions.
 */

/** Parse a French-formatted string into a JS number (comma → dot, strip spaces). */
export function parseNumber(value: string): number {
	return Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
}

/**
 * Normalize a raw decimal input: strip spaces, replace comma with dot,
 * reject any character that is not a digit or a single dot.
 *
 * Returns `null` when the input is invalid (letters, multiple dots, etc.).
 * Returns the empty string unchanged so callers can distinguish "empty" from "bad".
 */
export function normalizeDecimalInput(value: string): string | null {
	const normalized = value.replace(/\s/g, "").replace(",", ".");
	if (normalized === "") return normalized;
	const dotCount = normalized.split(".").length - 1;
	if (dotCount > 1) return null;
	for (const ch of normalized) {
		if (ch !== "." && (ch < "0" || ch > "9")) return null;
	}
	return normalized;
}

const thousandFormatter = new Intl.NumberFormat("fr-FR", {
	useGrouping: true,
	maximumFractionDigits: 0,
});

/**
 * Display a stored decimal for use inside an `<input>` element:
 * dot → comma (French decimal separator), no thousand grouping.
 *
 * Example: `"25000.5"` → `"25000,5"`.
 */
export function displayInputDecimal(value: string): string {
	if (!value) return value;
	return value.replace(".", ",");
}

/**
 * Display a stored decimal value with French locale conventions:
 * comma as decimal separator and narrow no-break spaces between thousands.
 *
 * Example: `"1234567.89"` → `"1 234 567,89"`.
 */
export function displayDecimal(value: string): string {
	if (!value) return value;
	const [intPart, decPart] = value.split(".");
	const n = Number.parseInt(intPart ?? "0", 10);
	const formatted = Number.isNaN(n)
		? (intPart ?? "")
		: thousandFormatter.format(n);
	return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}
