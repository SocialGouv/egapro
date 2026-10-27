import { classifyCompanySize } from "./companySize";
import { getObligationWorkforce } from "./gipWorkforce";

export type NextStepsBlock =
	| "cse-inform"
	| "cse-inform-and-consult"
	| "afterward"
	| "gap-remediation"
	| "gap-compliance-process";

export type NextStepsBlocksInput = {
	/** `null` means the company is absent from the GIP file. */
	workforce: number | null;
	indicatorGRequired: boolean;
	hasSignificantIndicatorGGap: boolean;
};

export function getNextStepsBlocks(
	input: NextStepsBlocksInput,
): ReadonlyArray<NextStepsBlock> {
	const tier = classifyCompanySize(getObligationWorkforce(input.workforce));
	const hasSignificantGap =
		input.indicatorGRequired && input.hasSignificantIndicatorGGap;

	switch (tier) {
		case "voluntary":
			return ["afterward"];
		case "mandatory":
			// No dedicated Figma frame for this tier with G but no significant gap: falls back to the 6-indicator blocks.
			return hasSignificantGap
				? ["cse-inform", "gap-remediation"]
				: ["cse-inform", "afterward"];
		case "mandatory_with_compliance":
			return hasSignificantGap
				? ["cse-inform-and-consult", "gap-compliance-process"]
				: ["cse-inform-and-consult"];
	}
}
