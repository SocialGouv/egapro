import { QUARTILE_MIN_INCREMENT } from "./constants";

/**
 * Computes the lower bound of a quartile from the previous quartile's threshold.
 * Returns null if prevThreshold is empty, null, undefined, or not a valid number.
 */
export function computeQuartileMin(
	prevThreshold: string | null | undefined,
): string | null {
	if (
		prevThreshold === null ||
		prevThreshold === undefined ||
		prevThreshold === ""
	) {
		return null;
	}
	const parsed = parseFloat(prevThreshold);
	if (Number.isNaN(parsed)) return null;
	return (parsed + QUARTILE_MIN_INCREMENT).toFixed(2);
}

/**
 * Normalizes a legacy array of 3 or 4 thresholds into a stable 3-element tuple.
 * The 4th legacy threshold is ignored. null/undefined values are normalized to "".
 */
export function migrateLegacyThresholds(
	thresholds: ReadonlyArray<string | null | undefined>,
): [string, string, string] {
	const norm = (v: string | null | undefined) =>
		v === null || v === undefined ? "" : v;
	return [norm(thresholds[0]), norm(thresholds[1]), norm(thresholds[2])];
}
