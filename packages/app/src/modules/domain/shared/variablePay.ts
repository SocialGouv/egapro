/**
 * Indicator E — proportion of employees receiving variable pay, per sex.
 *
 * GIP-MDS convention (`Proportion_variable_F` / `Proportion_variable_H`):
 * beneficiaries of one sex over the **total workforce of that same sex**.
 * Women and men proportions are therefore independent — unlike the quartile
 * proportions of indicator F, they do NOT sum to 1.
 *
 * This is the single definition of the rule: both the displayed percentage and
 * the value persisted on the declaration go through it, so the two can no
 * longer drift apart (issue #3940).
 */
import { computePercentage } from "./format";
import { proportionOf } from "./percentage";

/** GIP publishes proportions with 4 decimals, and the DB column is `numeric(9,4)`. */
const PROPORTION_SCALE = 10_000;

type CountInput = string | number | null | undefined;

/** Normalize a raw count (form string, DB numeric string, number) to a usable number. */
function toCount(value: CountInput): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Ratio between 0 and 1, rounded to 4 decimals — the value stored on the
 * declaration and exposed by the public API and the SUIT export.
 * Returns `null` when either count is missing or the workforce is zero.
 */
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

/**
 * Same rule, formatted for display: `"40,0 %"`, or `"- %"` when the proportion
 * cannot be computed. Formats the unrounded ratio so the displayed digit never
 * shifts because of the 4-decimal storage rounding.
 */
export function formatVariablePayProportion(
	beneficiaries: CountInput,
	workforce: CountInput,
): string {
	const count = toCount(beneficiaries);
	const total = toCount(workforce);
	if (count === null || total === null) return "- %";
	return computePercentage(count, total);
}
