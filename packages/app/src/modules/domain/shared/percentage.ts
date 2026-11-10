import { truncateDecimals } from "./decimal";
import { gapRatioToPercent } from "./gap";

export function proportionOf(count: number, total: number): number {
	return total === 0 ? 0 : count / total;
}

export function percentageOf(count: number, total: number): number {
	return total === 0 ? 0 : (count / total) * 100;
}

/** Converts a stored ratio (`0.074`) to the percentage points shown in exports (`7.4`).
 *  Truncated — never rounded — to {@link DISPLAY_DECIMALS}, via the single domain rule
 *  (`gapRatioToPercent` + `truncateDecimals`), so a `4.999 %` gap never crosses the
 *  alert threshold by display artefact. Null/blank/non-numeric input → null. */
export function ratioToPercentPoints(
	ratio: string | number | null | undefined,
): number | null {
	const percent = gapRatioToPercent(ratio);
	return percent === null ? null : truncateDecimals(percent);
}
