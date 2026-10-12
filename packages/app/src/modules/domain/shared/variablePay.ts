/**
 * Indicator E — proportion of employees receiving variable pay, per sex:
 * beneficiaries of one sex over the total workforce of that same sex.
 *
 * The two proportions are independent and do NOT sum to 1, unlike the quartile
 * proportions of indicator F. Both the displayed percentage and the persisted
 * value go through this module, so they cannot drift apart again.
 */
import { truncateRatio } from "./decimal";
import { computePercentage } from "./format";
import { toNullableNumber } from "./number";
import { proportionOf } from "./percentage";

type CountInput = string | number | null | undefined;

/** Ratio 0..1 — the value persisted, then served by the public API and the SUIT export. */
export function variablePayProportion(
	beneficiaries: CountInput,
	workforce: CountInput,
): number | null {
	const count = toNullableNumber(beneficiaries);
	const total = toNullableNumber(workforce);
	if (count === null || total === null || total === 0) return null;
	return truncateRatio(proportionOf(count, total));
}

/** Formats the unrounded ratio, so the displayed digit never shifts with the 4-decimal storage rounding. */
export function formatVariablePayProportion(
	beneficiaries: CountInput,
	workforce: CountInput,
): string {
	const count = toNullableNumber(beneficiaries);
	const total = toNullableNumber(workforce);
	if (count === null || total === null) return "- %";
	return computePercentage(count, total);
}
