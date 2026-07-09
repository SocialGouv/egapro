import type { GapDirection } from "../types";
import { GAP_ALERT_THRESHOLD, QUARTILE_MIN_INCREMENT } from "./constants";

/** Balanced top-quartile band: parity (0.5) ± the regulatory alert threshold as a ratio (±0.05). */
export const QUARTILE_BALANCE_LOWER = 0.5 - GAP_ALERT_THRESHOLD / 100;
export const QUARTILE_BALANCE_UPPER = 0.5 + GAP_ALERT_THRESHOLD / 100;

/** Classifies the average top-quartile women ratio against the parity band.
 *  "women" = women under-represented (ratio below the band), "men" = men under-represented, "balanced" = within band. */
export function quartileImbalanceDirection(
	avgWomenRatio: number,
): GapDirection {
	if (avgWomenRatio < QUARTILE_BALANCE_LOWER) return "women";
	if (avgWomenRatio > QUARTILE_BALANCE_UPPER) return "men";
	return "balanced";
}

/** True when the average top-quartile women ratio falls outside the parity band. */
export function isQuartileImbalanced(avgWomenRatio: number): boolean {
	return quartileImbalanceDirection(avgWomenRatio) !== "balanced";
}

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
