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

export function isCseJustificationOpinionRequired({
	gapHigh,
	gapJustification,
}: {
	gapHigh: boolean;
	gapJustification: GapJustification | null;
}): boolean {
	return (
		gapHigh && (gapJustification === "all" || gapJustification === "partial")
	);
}
