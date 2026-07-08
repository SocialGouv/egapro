/**
 * Gender pay gap business rules.
 *
 * This module contains the core calculations and classifications for
 * salary gaps between women and men. These are the regulatory rules
 * that determine whether a company must take corrective action:
 *
 * - `computeGap`: signed percentage difference between two salary values
 *   (positive when men earn more, negative when women earn more — GIP convention)
 * - `gapLevel`: classify a gap against the regulatory 5% threshold (positive-only)
 * - `hasGapsAboveThreshold`: detect significant gaps across employee categories
 * - `computeTotal`: sum base + variable compensation components
 *
 * For number parsing/normalization, see `number.ts`.
 * For display formatting (%, €, units), see `format.ts`.
 */

import type { GapLevel } from "../types";
import { GAP_ALERT_THRESHOLD } from "./constants";
import { parseNumber } from "./number";

/** Compute signed gap ratio: (men - women) / men. Returns null if invalid or men is 0. Range: typically -1..1.
 *  Sign convention: positive when men earn more (typical case), negative when women earn more. */
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
 *  Sign convention (GIP): positive when men earn more (typical case), negative when women earn more. */
export function computeGap(womenVal: string, menVal: string): number | null {
	const w = parseNumber(womenVal);
	const m = parseNumber(menVal);
	if (Number.isNaN(w) || Number.isNaN(m) || m === 0) return null;
	return ((m - w) / m) * 100;
}

/** Signed gap as a percentage from numeric values: ((men - women) / men) * 100. Null if men is 0. */
export function computeGapBetween(women: number, men: number): number | null {
	return men === 0 ? null : ((men - women) / men) * 100;
}

/** Classify a gap value against the regulatory threshold (5% by default).
 *  Positive-only: a negative gap (women earn more) is below the threshold, so classified "low". */
export function gapLevel(gap: number | null): GapLevel | null {
	if (gap === null) return null;
	return gap < GAP_ALERT_THRESHOLD ? "low" : "high";
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

/** Returns true if any employee category has a salary gap >= threshold (default: regulatory 5%).
 *  Positive-only: a negative gap (women earn more) is never counted. */
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
			return gap !== null && gap >= threshold;
		});
	});
}
