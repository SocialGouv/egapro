import type {
	CompliancePathValue,
	ComplianceRound,
	GapJustification,
} from "../types";

export function compliancePathsForGapJustification(
	justification: GapJustification,
	round: ComplianceRound,
): CompliancePathValue[] {
	if (justification === "all") return ["justify"];
	return round === 1
		? ["corrective_action", "joint_evaluation"]
		: ["joint_evaluation"];
}

export function gapJustificationFromPath(
	path: CompliancePathValue | undefined,
): GapJustification | undefined {
	return path === "justify" ? "all" : undefined;
}
