/**
 * Indicator E — proportion of employees receiving variable pay, per sex:
 * beneficiaries of one sex over the total workforce of that same sex.
 *
 * The two proportions are independent and do NOT sum to 1, unlike the quartile
 * proportions of indicator F. Both the displayed percentage and the persisted
 * value go through this module, so they cannot drift apart again.
 */
import { computePercentage } from "./format";
import { proportionOf } from "./percentage";

/** Matches the `numeric(9,4)` column the ratio is persisted into. */
const PROPORTION_SCALE = 10_000;

type CountInput = string | number | null | undefined;

function toCount(value: CountInput): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

/** Ratio 0..1 — the value persisted, then served by the public API and the SUIT export. */
export function variablePayProportion(
	beneficiaries: CountInput,
	workforce: CountInput,
): number | null {
	const count = toCount(beneficiaries);
	const total = toCount(workforce);
	if (count === null || total === null || total === 0) return null;
	return (
		Math.round(proportionOf(count, total) * PROPORTION_SCALE) / PROPORTION_SCALE
	);
}

/** Formats the unrounded ratio, so the displayed digit never shifts with the 4-decimal storage rounding. */
export function formatVariablePayProportion(
	beneficiaries: CountInput,
	workforce: CountInput,
): string {
	const count = toCount(beneficiaries);
	const total = toCount(workforce);
	if (count === null || total === null) return "- %";
	return computePercentage(count, total);
}
