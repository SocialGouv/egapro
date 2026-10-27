import { classifyCompanySize } from "./companySize";
import { getObligationWorkforce } from "./gipWorkforce";

/**
 * One "end of recap page" info box shown on the first declaration's review
 * step (`Step6Review`). See ticket #4925 for the block-by-block Figma
 * reference and the selection matrix.
 */
export type NextStepsBlock =
	| "cse-inform"
	| "cse-inform-and-consult"
	| "afterward"
	| "gap-remediation"
	| "gap-compliance-process";

export type NextStepsBlocksInput = {
	/** GIP annual average headcount — `null` when the company is absent from the GIP file. */
	workforce: number | null;
	/** Whether this campaign year's declaration carries indicator G (`Step6Review`'s `indicatorGRequired` prop). */
	indicatorGRequired: boolean;
	/** Whether indicator G shows a gap >= `GAP_ALERT_THRESHOLD` for at least one employee category. */
	hasSignificantIndicatorGGap: boolean;
};

/**
 * Selects which info blocks the first declaration's recap page shows, based on
 * the company's obligation tier, whether indicator G applies this campaign
 * year, and whether it shows a significant gap. Pure selection rule: no year
 * or threshold is hardcoded here — it only composes `classifyCompanySize` and
 * the booleans the caller already derived from `isIndicatorGRequiredForGip`
 * and `hasGapsAboveThreshold`.
 *
 * The 50-99 tier with indicator G but no significant gap has no dedicated
 * Figma frame (ticket #4925, "points ouverts" #1): it falls back to the same
 * blocks as the 6-indicator case, by construction of the `hasSignificantGap`
 * guard below.
 */
export function getNextStepsBlocks(
	input: NextStepsBlocksInput,
): ReadonlyArray<NextStepsBlock> {
	const tier = classifyCompanySize(getObligationWorkforce(input.workforce));
	const hasSignificantGap =
		input.indicatorGRequired && input.hasSignificantIndicatorGGap;

	if (tier === "voluntary") return ["afterward"];

	if (tier === "mandatory") {
		return hasSignificantGap
			? ["cse-inform", "gap-remediation"]
			: ["cse-inform", "afterward"];
	}

	return hasSignificantGap
		? ["cse-inform-and-consult", "gap-compliance-process"]
		: ["cse-inform-and-consult"];
}
