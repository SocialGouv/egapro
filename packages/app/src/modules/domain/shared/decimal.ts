/**
 * The one decimal rule for every percentage and average shown to the user:
 * two decimals, truncated toward zero — never rounded. `49.876` reads `49,87`,
 * `51.428` reads `51,42`, `-3.168` reads `-3,16`.
 *
 * Truncation rather than rounding is a business choice: a gap of 4.999 % must
 * never surface as `5,00 %`, which would read as crossing the alert threshold.
 * Every formatter of `format.ts` that writes a percentage or an average goes
 * through `truncateDecimals`, so the rule changes here and nowhere else.
 */

export const DISPLAY_DECIMALS = 2;

/** Absorbs IEEE 754 noise (`0.29 * 100` → `28.999…`) so truncation never drops a real digit. */
const NORMALISATION_PRECISION = 12;

/** Truncates toward zero to `decimals` places: `49.876` → `49.87`, `-0.001` → `0` (never `-0`). */
export function truncateDecimals(
	value: number,
	decimals: number = DISPLAY_DECIMALS,
): number {
	const scale = 10 ** decimals;
	const truncated =
		Math.trunc(Number((value * scale).toPrecision(NORMALISATION_PRECISION))) /
		scale;
	return truncated === 0 ? 0 : truncated;
}

/** A percentage at {@link DISPLAY_DECIMALS} is a ratio at two more decimals: the `numeric(9,4)` columns. */
export const RATIO_DECIMALS = DISPLAY_DECIMALS + 2;

/** The display rule applied to a stored ratio, so persistence, export and display never disagree. */
export function truncateRatio(ratio: number): number {
	return truncateDecimals(ratio, RATIO_DECIMALS);
}
