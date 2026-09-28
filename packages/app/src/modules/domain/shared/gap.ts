/**
 * Gender pay gap business rules.
 *
 * This module contains the core calculations and classifications for
 * salary gaps between women and men. These are the regulatory rules
 * that determine whether a company must take corrective action:
 *
 * - `computeGap`: signed percentage difference between two salary values
 *   (positive when men earn more, negative when women earn more)
 * - `gapLevel`: classify a gap against the regulatory 5% threshold, by absolute
 *   magnitude — a gap is significant in either direction
 * - `hasGapsAboveThreshold`: detect significant gaps across employee categories
 * - `computeGapHighFlags`: split categories by declaration round then apply the threshold
 * - `computeTotal`: sum base + variable compensation components
 *
 * For number parsing/normalization, see `number.ts`.
 * For display formatting (%, €, units), see `format.ts`.
 */

import type { GapDirection, GapLevel } from "../types";
import { GAP_ALERT_THRESHOLD } from "./constants";
import { parseNumber } from "./number";

/** Compute signed gap ratio: (men - women) / men. Returns null if invalid or men is 0. Range: typically -1..1.
 *  The sign carries direction only (positive when men earn more, negative when women earn more); regulatory
 *  significance is assessed on the absolute magnitude via `gapLevel`. */
export function computeGapRatio(
	womenVal: string,
	menVal: string,
): number | null {
	const w = parseNumber(womenVal);
	const m = parseNumber(menVal);
	if (Number.isNaN(w) || Number.isNaN(m) || m === 0) return null;
	return (m - w) / m;
}

/** Compute gap as a signed percentage: ((men - women) / men) * 100. Returns null if inputs are invalid or men is zero.
 *  The sign carries direction only (positive when men earn more, negative when women earn more); regulatory
 *  significance is assessed on the absolute magnitude via `gapLevel`. */
export function computeGap(womenVal: string, menVal: string): number | null {
	const w = parseNumber(womenVal);
	const m = parseNumber(menVal);
	if (Number.isNaN(w) || Number.isNaN(m) || m === 0) return null;
	return ((m - w) / m) * 100;
}

/** The GIP-supplied gap for one indicator block, alongside the operands it was published with. */
export type GipGapReference = {
	women: string | null;
	men: string | null;
	/** Gap as a ratio (e.g. `"0.0887"`), as delivered in the `*_ecart` column. */
	gap: string | null;
};

/** True when the declared value still equals the GIP one, compared numerically so that
 *  `"1000"` and `"1000.00"` count as unchanged. */
function matchesGipOperand(value: string, gipValue: string | null): boolean {
	if (gipValue === null) return false;
	const declared = parseNumber(value);
	const gip = parseNumber(gipValue);
	return !Number.isNaN(declared) && !Number.isNaN(gip) && declared === gip;
}

/** The GIP gap ratio when both operands are untouched, `null` otherwise (caller recomputes).
 *
 *  The GIP computes each `*_ecart` on full-precision values but publishes the operands rounded to
 *  2 decimals, so recomputing the gap from those operands loses information — up to ~9 points on
 *  hourly variable pay, where amounts are a fraction of an euro. The GIP gap therefore stays
 *  authoritative for as long as the declarant has not altered either operand. */
function gipGapRatioIfUnchanged(
	womenVal: string,
	menVal: string,
	reference: GipGapReference | null | undefined,
): number | null {
	if (!reference || reference.gap === null) return null;
	if (!matchesGipOperand(womenVal, reference.women)) return null;
	if (!matchesGipOperand(menVal, reference.men)) return null;
	const ratio = Number(reference.gap);
	return Number.isNaN(ratio) ? null : ratio;
}

/** Gap ratio for one indicator: the GIP value while both operands are untouched, else recomputed.
 *  Counterpart of `computeGapRatio` — see `gipGapRatioIfUnchanged` for why the GIP value wins. */
export function resolveGapRatio(
	womenVal: string,
	menVal: string,
	reference: GipGapReference | null | undefined,
): number | null {
	const fromGip = gipGapRatioIfUnchanged(womenVal, menVal, reference);
	return fromGip === null ? computeGapRatio(womenVal, menVal) : fromGip;
}

/** Gap as a signed percentage: the GIP value while both operands are untouched, else recomputed.
 *  Counterpart of `computeGap` — see `gipGapRatioIfUnchanged` for why the GIP value wins. */
export function resolveGap(
	womenVal: string,
	menVal: string,
	reference: GipGapReference | null | undefined,
): number | null {
	const fromGip = gipGapRatioIfUnchanged(womenVal, menVal, reference);
	return fromGip === null ? computeGap(womenVal, menVal) : fromGip * 100;
}

/** Signed gap as a percentage from numeric values: ((men - women) / men) * 100. Null if men is 0. */
export function computeGapBetween(women: number, men: number): number | null {
	return men === 0 ? null : ((men - women) / men) * 100;
}

/** Classify a gap value against the regulatory threshold (5% by default).
 *  Symmetric: a gap is "high" as soon as its absolute magnitude reaches the threshold, in either direction. */
export function gapLevel(gap: number | null): GapLevel | null {
	if (gap === null) return null;
	return Math.abs(gap) < GAP_ALERT_THRESHOLD ? "low" : "high";
}

/** Null-safe gap magnitude (absolute value). Use when the display cares about size, not direction. */
export function gapMagnitude(gap: number | null): number | null {
	return gap === null ? null : Math.abs(gap);
}

/** True when any gap in the list reaches the alert threshold in either direction (via `gapLevel`). */
export function hasHighGap(gaps: ReadonlyArray<number | null>): boolean {
	return gaps.some((gap) => gapLevel(gap) === "high");
}

/** Direction of pay disparity, derived only from gaps that cross the regulatory threshold and weighted by
 *  their signed magnitude (cumulated per side) — unlike a plain majority vote, which would let several
 *  sub-threshold rows outvote a single significant one. Positive gaps favor "women" (men earn more),
 *  negative gaps favor "men" (women earn more), matching `computeGap`'s sign convention.
 *
 *  Total: whenever at least one gap is significant, the result always carries a sign — it can never be
 *  "balanced" while a threshold-crossing row exists. */
export function significantGapDirection(
	gaps: ReadonlyArray<number | null>,
	threshold: number = GAP_ALERT_THRESHOLD,
): GapDirection {
	const significant = gaps.filter(
		(gap): gap is number => gap !== null && Math.abs(gap) >= threshold,
	);
	if (significant.length === 0) return "balanced";

	const cumulated = significant.reduce((sum, gap) => sum + gap, 0);
	if (cumulated > 0) return "women";
	if (cumulated < 0) return "men";

	// Exact tie between opposing significant gaps: break on the largest magnitude side.
	const largestMagnitude = significant.reduce((largest, gap) =>
		Math.abs(gap) > Math.abs(largest) ? gap : largest,
	);
	return largestMagnitude > 0 ? "women" : "men";
}

/** Converts a stored gap ratio (e.g. `"0.0523"`) to a signed percentage (`5.23`).
 *  Null, blank, or non-numeric input → null. Mirrors the ratio→percent step used across exports. */
export function gapRatioToPercent(
	ratio: string | number | null | undefined,
): number | null {
	if (ratio === null || ratio === undefined || ratio === "") return null;
	const n = typeof ratio === "number" ? ratio : Number(ratio);
	return Number.isNaN(n) ? null : n * 100;
}

/** Sum base and variable compensation. Returns null only when both inputs are invalid. */
export function computeTotal(base: string, variable: string): number | null {
	const b = Number.parseFloat(base);
	const v = Number.parseFloat(variable);
	if (Number.isNaN(b) && Number.isNaN(v)) return null;
	return (Number.isNaN(b) ? 0 : b) + (Number.isNaN(v) ? 0 : v);
}

type SalaryPair = {
	women: string | null;
	men: string | null;
};

type EmployeeCategoryLike = {
	annualBaseWomen?: string | null;
	annualBaseMen?: string | null;
	annualVariableWomen?: string | null;
	annualVariableMen?: string | null;
	hourlyBaseWomen?: string | null;
	hourlyBaseMen?: string | null;
	hourlyVariableWomen?: string | null;
	hourlyVariableMen?: string | null;
};

/** Returns true if any employee category has a salary gap whose absolute magnitude reaches the threshold
 *  (default: regulatory 5%). Symmetric: a gap counts in either direction. */
export function hasGapsAboveThreshold(
	categories: EmployeeCategoryLike[],
	threshold = GAP_ALERT_THRESHOLD,
): boolean {
	return categories.some((cat) => {
		const pairs: SalaryPair[] = [
			{ women: cat.annualBaseWomen ?? null, men: cat.annualBaseMen ?? null },
			{
				women: cat.annualVariableWomen ?? null,
				men: cat.annualVariableMen ?? null,
			},
			{ women: cat.hourlyBaseWomen ?? null, men: cat.hourlyBaseMen ?? null },
			{
				women: cat.hourlyVariableWomen ?? null,
				men: cat.hourlyVariableMen ?? null,
			},
		];
		return pairs.some(({ women, men }) => {
			if (!women || !men) return false;
			const gap = computeGap(women, men);
			return gap !== null && Math.abs(gap) >= threshold;
		});
	});
}

type CategoryWithDeclarationType = EmployeeCategoryLike & {
	declarationType: "initial" | "correction";
};

export function computeGapHighFlags(
	categories: CategoryWithDeclarationType[],
): { firstDeclGapHigh: boolean; secondDeclGapHigh: boolean } {
	const initialCategories = categories.filter(
		(category) => category.declarationType === "initial",
	);
	const correctionCategories = categories.filter(
		(category) => category.declarationType === "correction",
	);
	return {
		firstDeclGapHigh: hasGapsAboveThreshold(initialCategories),
		secondDeclGapHigh: hasGapsAboveThreshold(correctionCategories),
	};
}
