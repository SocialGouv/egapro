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

type NumericInput = string | number | null | undefined;

/**
 * The reference text → number conversion: a finite number, else `null`.
 *
 * Reads canonical machine text (Postgres `numeric`, GIP file, CSV cell already
 * normalized): surrounding spaces are ignored, blank text is `null`, and the
 * WHOLE string must be a number — `"12abc"` is `null`, not 12. A French comma
 * is rejected (`"12,7"` → `null`): user input goes through
 * `normalizeDecimalInput` or `parseNumber` first. `Infinity` and `NaN`, as
 * text or as numbers, are `null`.
 */
export function toNullableNumber(value: NumericInput): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * {@link toNullableNumber} rounded to the nearest integer, for a source whose
 * counts may legitimately carry decimals (GIP EMA headcounts): `"12.7"` → 13.
 */
export function toRoundedInt(value: NumericInput): number | null {
	const parsed = toNullableNumber(value);
	return parsed === null ? null : Math.round(parsed);
}

/**
 * {@link toNullableNumber} restricted to integers, for a value that must
 * already be one (a declared headcount): `"12.7"` → `null`, never truncated.
 */
export function toStrictInt(value: NumericInput): number | null {
	const parsed = toNullableNumber(value);
	return parsed !== null && Number.isInteger(parsed) ? parsed : null;
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

/**
 * Pad a stored decimal value to exactly two fraction digits.
 * Used on blur for euro inputs so every amount displays a consistent ",XX" suffix.
 *
 * Empty or non-numeric values pass through unchanged.
 * Example: `"100"` → `"100.00"`, `"100.5"` → `"100.50"`, `"100.555"` → `"100.56"`.
 */
export function padDecimalToTwo(value: string): string {
	if (!value) return value;
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return value;
	return n.toFixed(2);
}

/**
 * Blur handler for decimal inputs: pad the value to two fraction digits and,
 * if the result differs from the original, hand it back to the setter.
 * Callers keep the value change out of their reducer when nothing needs updating.
 */
export function padDecimalOnBlur(
	value: string,
	setter: (padded: string) => void,
): void {
	const padded = padDecimalToTwo(value);
	if (padded !== value) setter(padded);
}
